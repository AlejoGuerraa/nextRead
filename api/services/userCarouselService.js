const { QueryTypes } = require('sequelize');
const { normalize_tags } = require('./tagPreferenceService');
const { parse_custom_lists } = require('../utils/customLists');

const MAX_BOOKS_PER_CAROUSEL = 20;
const MIN_CAROUSEL_BOOKS = 3;
const MAX_RECOMMENDED_AUTHORS = 20;
const MAX_MORE_AUTHOR_SOURCES = Math.ceil(MAX_BOOKS_PER_CAROUSEL / 3);
const MAX_SIMILARITY_TAGS = 8;
const MAX_SIMILARITY_CANDIDATES_PER_SOURCE = 40;
const MAX_READ_SOURCES = 100;

const BOOK_CARD_FIELDS = `
    book.id,
    book.titulo,
    book.url_portada,
    book.ranking,
    book.id_autor,
    author.nombre AS nombre_autor
`;

function is_valid_id(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0;
}

function normalize_book_card(book) {
    return {
        id: Number(book.id),
        titulo: book.titulo,
        url_portada: book.url_portada || null,
        ranking: book.ranking == null ? null : Number(book.ranking),
        id_autor: is_valid_id(book.id_autor) ? Number(book.id_autor) : null,
        nombre_autor: book.nombre_autor || null,
        ...(book.puntuacion_usuario == null
            ? {}
            : { puntuacion_usuario: Number(book.puntuacion_usuario) })
    };
}

function parse_json_array(value) {
    let parsed = value;
    if (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === 'string' && item.trim())
        .map((item) => item.trim());
}

function make_books_carousel(id, title, books, extra = {}) {
    if (books.length < MIN_CAROUSEL_BOOKS) return null;
    return {
        id,
        title,
        kind: 'books',
        libros: books.map(normalize_book_card),
        ...extra
    };
}

function create_user_carousel_service({
    sequelize,
    random = Math.random,
    now = () => new Date()
}) {
    async function select(sql, replacements) {
        return sequelize.query(sql, {
            replacements,
            type: QueryTypes.SELECT
        });
    }

    function normalize_user_id(userId) {
        const id = Number(userId);
        if (!is_valid_id(id)) {
            throw new Error('A valid authenticated user id is required');
        }
        return id;
    }

    async function get_reading_status_carousels(userId) {
        const id = normalize_user_id(userId);
        const rows = await select(`
            SELECT
                reading_states.reading_status,
                reading_states.id,
                reading_states.titulo,
                reading_states.url_portada,
                reading_states.ranking,
                reading_states.id_autor,
                reading_states.nombre_autor
            FROM (
                SELECT
                    state.reading_status,
                    ${BOOK_CARD_FIELDS},
                    ROW_NUMBER() OVER (
                        PARTITION BY state.reading_status
                        ORDER BY state.status_updated_at DESC, state.book_id DESC
                    ) AS status_position
                FROM \`user_book_states\` AS state
                INNER JOIN \`Libro\` AS book
                    ON book.id = state.book_id
                LEFT JOIN \`Autor\` AS author
                    ON author.id = book.id_autor
                WHERE state.user_id = :userId
                    AND state.reading_status IN ('reading', 'to_read')
            ) AS reading_states
            WHERE reading_states.status_position <= :limit
            ORDER BY reading_states.reading_status ASC, reading_states.status_position ASC
        `, {
            userId: id,
            limit: MAX_BOOKS_PER_CAROUSEL
        });

        const reading = rows
            .filter((row) => row.reading_status === 'reading')
            .map(normalize_book_card);
        const toRead = rows
            .filter((row) => row.reading_status === 'to_read')
            .map(normalize_book_card);

        return [
            make_books_carousel('seguir-leyendo', 'Seguir leyendo', reading),
            make_books_carousel('para-leer', 'Para leer', toRead)
        ].filter(Boolean);
    }

    async function get_recommended_authors(userId) {
        const id = normalize_user_id(userId);
        const rows = await select(`
            WITH latest_active_ratings AS (
                SELECT review.libro_id, review.puntuacion
                FROM \`Resenas_Libros\` AS review
                INNER JOIN (
                    SELECT libro_id, MAX(id) AS review_id
                    FROM \`Resenas_Libros\`
                    WHERE usuario_id = :userId
                        AND activo = 1
                    GROUP BY libro_id
                ) AS latest
                    ON latest.review_id = review.id
                WHERE review.usuario_id = :userId
                    AND review.activo = 1
            ),
            user_evidence AS (
                SELECT state.book_id, 'read' AS signal_type
                FROM \`user_book_states\` AS state
                WHERE state.user_id = :userId
                    AND state.reading_status = 'read'
                UNION ALL
                SELECT state.book_id, 'favorite' AS signal_type
                FROM \`user_book_states\` AS state
                WHERE state.user_id = :userId
                    AND state.is_favorite = 1
                UNION ALL
                SELECT rating.libro_id, 'positive_rating' AS signal_type
                FROM latest_active_ratings AS rating
                WHERE rating.puntuacion >= 4
            )
            SELECT
                author.id,
                author.nombre,
                author.url_cara,
                COUNT(DISTINCT CASE
                    WHEN evidence.signal_type = 'positive_rating' THEN evidence.book_id
                END) AS positive_rating_count,
                COUNT(DISTINCT CASE
                    WHEN evidence.signal_type = 'favorite' THEN evidence.book_id
                END) AS favorite_count,
                COUNT(DISTINCT CASE
                    WHEN evidence.signal_type = 'read' THEN evidence.book_id
                END) AS read_book_count
            FROM user_evidence AS evidence
            INNER JOIN \`Libro\` AS book
                ON book.id = evidence.book_id
            INNER JOIN \`Autor\` AS author
                ON author.id = book.id_autor
            GROUP BY author.id, author.nombre, author.url_cara
            ORDER BY
                positive_rating_count DESC,
                favorite_count DESC,
                read_book_count DESC,
                author.id ASC
            LIMIT :limit
        `, {
            userId: id,
            limit: MAX_RECOMMENDED_AUTHORS
        });

        if (rows.length < MIN_CAROUSEL_BOOKS) return null;
        return {
            id: 'autores',
            title: 'Autores para vos',
            kind: 'authors',
            autores: rows.map((author) => ({
                id: Number(author.id),
                nombre: author.nombre,
                url_cara: author.url_cara || null
            }))
        };
    }

    async function get_more_from_authors(userId) {
        const id = normalize_user_id(userId);
        const authors = await select(`
            SELECT
                author.id,
                author.nombre,
                COUNT(DISTINCT state.book_id) AS read_book_count
            FROM \`user_book_states\` AS state
            INNER JOIN \`Libro\` AS book
                ON book.id = state.book_id
            INNER JOIN \`Autor\` AS author
                ON author.id = book.id_autor
            WHERE state.user_id = :userId
                AND state.reading_status = 'read'
            GROUP BY author.id, author.nombre
            HAVING COUNT(DISTINCT state.book_id) >= 2
            ORDER BY read_book_count DESC, author.id ASC
            LIMIT :limit
        `, {
            userId: id,
            limit: MAX_MORE_AUTHOR_SOURCES
        });

        const qualifyingAuthors = [...new Map(authors
            .filter((author) => is_valid_id(author.id))
            .map((author) => [Number(author.id), {
                id: Number(author.id),
                nombre: author.nombre,
                read_book_count: Number(author.read_book_count)
            }])).values()];
        if (qualifyingAuthors.length === 0) return null;

        const authorIds = qualifyingAuthors.map((author) => author.id);
        const authorLimit = qualifyingAuthors.length === 1
            ? MAX_BOOKS_PER_CAROUSEL
            : 3;
        const rows = await select(`
            SELECT candidate_books.*
            FROM (
                SELECT
                    ${BOOK_CARD_FIELDS},
                    book.anio,
                    ROW_NUMBER() OVER (
                        PARTITION BY book.id_autor
                        ORDER BY book.ranking DESC, book.anio DESC, book.id ASC
                    ) AS author_position
                FROM \`Libro\` AS book
                INNER JOIN \`Autor\` AS author
                    ON author.id = book.id_autor
                WHERE book.id_autor IN (:authorIds)
                    AND NOT EXISTS (
                        SELECT 1
                        FROM \`user_book_states\` AS state
                        WHERE state.user_id = :userId
                            AND state.book_id = book.id
                            AND state.reading_status = 'read'
                    )
            ) AS candidate_books
            WHERE candidate_books.author_position <= :authorLimit
            ORDER BY FIELD(candidate_books.id_autor, :authorOrder),
                candidate_books.ranking DESC,
                candidate_books.anio DESC,
                candidate_books.id ASC
            LIMIT :limit
        `, {
            userId: id,
            authorIds,
            authorOrder: authorIds,
            authorLimit,
            limit: MAX_BOOKS_PER_CAROUSEL
        });

        const authorOrder = new Map(authorIds.map((authorId, index) => [authorId, index]));
        const authorCounts = new Map();
        const seenBookIds = new Set();
        const books = [...rows]
            .sort((left, right) =>
                (authorOrder.get(Number(left.id_autor)) ?? Number.MAX_SAFE_INTEGER) -
                    (authorOrder.get(Number(right.id_autor)) ?? Number.MAX_SAFE_INTEGER) ||
                Number(right.ranking) - Number(left.ranking) ||
                Number(right.anio) - Number(left.anio) ||
                Number(left.id) - Number(right.id)
            )
            .filter((book) => {
                const bookId = Number(book.id);
                const authorId = Number(book.id_autor);
                if (seenBookIds.has(bookId)) return false;
                const count = authorCounts.get(authorId) || 0;
                if (count >= authorLimit) return false;
                seenBookIds.add(bookId);
                authorCounts.set(authorId, count + 1);
                return true;
            })
            .map(normalize_book_card);

        const title = qualifyingAuthors.length === 1
            ? `Más de ${qualifyingAuthors[0].nombre}`
            : 'Más de tus autores';
        return make_books_carousel('mas-de-autor', title, books);
    }

    async function get_random_user_list(userId) {
        const id = normalize_user_id(userId);
        const [user] = await select(`
            SELECT id, listas
            FROM \`Usuario\`
            WHERE id = :userId
            LIMIT 1
        `, { userId: id });
        if (!user) return null;

        const availableLists = Object.entries(parse_custom_lists(user.listas))
            .map(([name, list]) => ({
                name,
                bookIds: [...new Set(list.libros
                    .map(Number)
                    .filter((bookId) => is_valid_id(bookId)))]
            }))
            .filter((list) => list.name.trim() && list.bookIds.length > 0)
            .sort((left, right) => left.name.localeCompare(right.name));
        if (availableLists.length === 0) return null;

        const randomValue = Number(random());
        if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
            throw new Error('Random source must return a value between 0 and 1');
        }
        const selectedList = availableLists[
            Math.floor(randomValue * availableLists.length)
        ];
        const bookIds = selectedList.bookIds;
        const rows = await select(`
            SELECT
                ${BOOK_CARD_FIELDS}
            FROM JSON_TABLE(
                :bookIdsJson,
                '$[*]' COLUMNS (
                    list_position FOR ORDINALITY,
                    book_id INT PATH '$' NULL ON ERROR
                )
            ) AS listed_books
            STRAIGHT_JOIN \`Libro\` AS book FORCE INDEX (PRIMARY)
                ON book.id = listed_books.book_id
            LEFT JOIN \`Autor\` AS author FORCE INDEX (PRIMARY)
                ON author.id = book.id_autor
            ORDER BY listed_books.list_position
            LIMIT :limit
        `, {
            bookIdsJson: JSON.stringify(bookIds),
            limit: MAX_BOOKS_PER_CAROUSEL
        });

        const booksById = new Map(rows.map((book) => [
            Number(book.id),
            normalize_book_card(book)
        ]));
        const books = bookIds.map((bookId) => booksById.get(bookId)).filter(Boolean);
        return make_books_carousel(
            'de-lista',
            `De tu lista: ${selectedList.name}`,
            books,
            { list_name: selectedList.name }
        );
    }

    async function get_read_again_carousel(userId) {
        const id = normalize_user_id(userId);
        const rows = await select(`
            WITH latest_active_ratings AS (
                SELECT review.libro_id, review.puntuacion
                FROM \`Resenas_Libros\` AS review
                INNER JOIN (
                    SELECT libro_id, MAX(id) AS review_id
                    FROM \`Resenas_Libros\`
                    WHERE usuario_id = :userId
                        AND activo = 1
                    GROUP BY libro_id
                ) AS latest
                    ON latest.review_id = review.id
                WHERE review.usuario_id = :userId
                    AND review.activo = 1
            )
            SELECT
                ${BOOK_CARD_FIELDS},
                rating.puntuacion AS puntuacion_usuario
            FROM \`user_book_states\` AS state
            INNER JOIN \`Libro\` AS book
                ON book.id = state.book_id
            LEFT JOIN \`Autor\` AS author
                ON author.id = book.id_autor
            LEFT JOIN latest_active_ratings AS rating
                ON rating.libro_id = book.id
            WHERE state.user_id = :userId
                AND state.reading_status = 'read'
                AND (state.is_favorite = 1 OR rating.puntuacion >= 4)
            ORDER BY rating.puntuacion DESC,
                state.is_favorite DESC,
                state.status_updated_at DESC,
                state.book_id DESC
            LIMIT :limit
        `, {
            userId: id,
            limit: MAX_BOOKS_PER_CAROUSEL
        });
        return make_books_carousel('volver-a-leerlo', 'Volver a leerlo', rows);
    }

    async function get_read_sources(userId, bookId = null, limit = MAX_READ_SOURCES) {
        const id = normalize_user_id(userId);
        if (bookId !== null && !is_valid_id(bookId)) {
            throw new Error('A valid source book id is required');
        }

        const sourceBookFilter = bookId === null ? '' : 'AND book.id = :bookId';
        return select(`
            SELECT
                book.id,
                book.titulo,
                book.anio,
                book.tipo,
                book.tema,
                book.generos,
                book.tags,
                book.id_autor,
                author.nombre AS nombre_autor,
                review.puntuacion AS puntuacion_usuario
            FROM \`Resenas_Libros\` AS review
            INNER JOIN (
                SELECT libro_id, MAX(id) AS review_id
                FROM \`Resenas_Libros\`
                WHERE usuario_id = :userId
                    AND activo = 1
                GROUP BY libro_id
            ) AS latest
                ON latest.review_id = review.id
            INNER JOIN \`user_book_states\` AS state
                ON state.user_id = review.usuario_id
                AND state.book_id = review.libro_id
                AND state.reading_status = 'read'
            INNER JOIN \`Libro\` AS book
                ON book.id = review.libro_id
            LEFT JOIN \`Autor\` AS author
                ON author.id = book.id_autor
            WHERE review.usuario_id = :userId
                AND review.activo = 1
                AND review.puntuacion IN (4, 5)
                ${sourceBookFilter}
            ORDER BY review.fecha DESC, review.id DESC, book.id ASC
            LIMIT :limit
        `, {
            userId: id,
            ...(bookId === null ? {} : { bookId: Number(bookId) }),
            limit
        });
    }

    async function find_similar_books(userId, source) {
        const tags = normalize_tags(source.tags)
            .filter((tag) => tag.length <= 255)
            .slice(0, MAX_SIMILARITY_TAGS);
        const tagPredicates = tags.map((_, index) =>
            `:sourceTag${index} MEMBER OF(book.tags)`
        );
        const replacements = {
            userId: normalize_user_id(userId),
            sourceBookId: Number(source.id),
            limit: MAX_BOOKS_PER_CAROUSEL,
            sourceLimit: MAX_SIMILARITY_CANDIDATES_PER_SOURCE
        };
        tags.forEach((tag, index) => {
            replacements[`sourceTag${index}`] = tag;
        });

        const candidateSources = tagPredicates.map((_, index) => `
            (
                SELECT matching_book.id
                FROM \`Libro\` AS matching_book FORCE INDEX (idx_libro_tags_mvi)
                WHERE matching_book.id <> :sourceBookId
                    AND :sourceTag${index} MEMBER OF(matching_book.tags)
                ORDER BY matching_book.ranking DESC, matching_book.id ASC
                LIMIT :sourceLimit
            )
        `);
        if (is_valid_id(source.id_autor)) {
            replacements.sourceAuthorId = Number(source.id_autor);
            candidateSources.push(`
                (
                    SELECT matching_book.id
                    FROM \`Libro\` AS matching_book FORCE INDEX (id_autor)
                    WHERE matching_book.id <> :sourceBookId
                        AND matching_book.id_autor = :sourceAuthorId
                    ORDER BY matching_book.ranking DESC, matching_book.id ASC
                    LIMIT :sourceLimit
                )
            `);
        }
        if (candidateSources.length === 0) return [];

        const tagScore = tagPredicates.length > 0
            ? tagPredicates.map((predicate) =>
                `CASE WHEN ${predicate} THEN 1 ELSE 0 END`
            ).join(' + ')
            : '0';
        const genreScore = parse_json_array(source.generos).length > 0
            ? 'CASE WHEN JSON_OVERLAPS(book.generos, CAST(:sourceGenres AS JSON)) THEN 1 ELSE 0 END'
            : '0';
        if (genreScore !== '0') {
            replacements.sourceGenres = JSON.stringify(parse_json_array(source.generos));
        }
        const themeScore = typeof source.tema === 'string' && source.tema.trim()
            ? 'CASE WHEN book.tema = :sourceTheme THEN 1 ELSE 0 END'
            : '0';
        if (themeScore !== '0') replacements.sourceTheme = source.tema.trim();
        const typeScore = typeof source.tipo === 'string' && source.tipo.trim()
            ? 'CASE WHEN book.tipo = :sourceType THEN 1 ELSE 0 END'
            : '0';
        if (typeScore !== '0') replacements.sourceType = source.tipo.trim();
        const year = Number(source.anio);
        const decadeScore = Number.isSafeInteger(year) && year > 0
            ? 'CASE WHEN FLOOR(book.anio / 10) = :sourceDecade THEN 1 ELSE 0 END'
            : '0';
        if (decadeScore !== '0') replacements.sourceDecade = Math.floor(year / 10);
        const sameAuthorScore = is_valid_id(source.id_autor)
            ? 'CASE WHEN book.id_autor = :sourceAuthorId THEN 1 ELSE 0 END'
            : '0';

        const rows = await select(`
            WITH candidate_ids AS (
                ${candidateSources.join('\nUNION\n')}
            ),
            scored_candidates AS (
                SELECT
                    ${BOOK_CARD_FIELDS},
                    book.anio,
                    (${tagScore}) AS shared_tag_count,
                    ${sameAuthorScore} AS same_author,
                    ${genreScore} AS same_genre,
                    ${themeScore} AS same_theme,
                    ${typeScore} AS same_type,
                    ${decadeScore} AS same_decade
                FROM \`Libro\` AS book
                INNER JOIN candidate_ids
                    ON candidate_ids.id = book.id
                LEFT JOIN \`Autor\` AS author
                    ON author.id = book.id_autor
                WHERE book.id <> :sourceBookId
                    AND book.titulo IS NOT NULL
                    AND TRIM(book.titulo) <> ''
                    AND NOT EXISTS (
                        SELECT 1
                        FROM \`user_book_states\` AS state
                        WHERE state.user_id = :userId
                            AND state.book_id = book.id
                            AND state.reading_status = 'read'
                    )
            ),
            ranked_candidates AS (
                SELECT
                    scored_candidates.*,
                    ROW_NUMBER() OVER (
                        PARTITION BY COALESCE(id_autor, -id)
                        ORDER BY shared_tag_count DESC,
                            same_author DESC,
                            same_genre DESC,
                            same_theme DESC,
                            same_type DESC,
                            same_decade DESC,
                            ranking DESC,
                            id ASC
                    ) AS author_position
                FROM scored_candidates
            )
            SELECT *
            FROM ranked_candidates
            WHERE author_position <= 3
            ORDER BY shared_tag_count DESC,
                same_author DESC,
                same_genre DESC,
                same_theme DESC,
                same_type DESC,
                same_decade DESC,
                ranking DESC,
                id ASC
            LIMIT :limit
        `, replacements);

        const seenBookIds = new Set();
        const authorCounts = new Map();
        return rows.filter((book) => {
            const bookId = Number(book.id);
            const authorKey = is_valid_id(book.id_autor)
                ? Number(book.id_autor)
                : `book:${bookId}`;
            if (seenBookIds.has(bookId)) return false;
            const authorCount = authorCounts.get(authorKey) || 0;
            if (authorCount >= 3) return false;
            seenBookIds.add(bookId);
            authorCounts.set(authorKey, authorCount + 1);
            return true;
        }).map(normalize_book_card);
    }

    async function get_because_read_carousel(userId) {
        const id = normalize_user_id(userId);
        const sources = await get_read_sources(id);
        if (sources.length === 0) return null;

        const currentTime = now();
        const currentTimeMs = currentTime instanceof Date
            ? currentTime.getTime()
            : typeof currentTime === 'number'
                ? currentTime
                : Date.parse(currentTime);
        if (!Number.isFinite(currentTimeMs)) {
            throw new Error('Current time is invalid');
        }
        const utcDay = Math.floor(currentTimeMs / 86400000);
        const sourceIndex = (utcDay + id) % sources.length;
        const source = sources[sourceIndex];
        const books = await find_similar_books(id, source);
        if (books.length < MIN_CAROUSEL_BOOKS) return null;

        return make_books_carousel(
            'porque-leiste',
            `Porque leíste ${source.titulo}`,
            books,
            {
                source_book: {
                    id: Number(source.id),
                    titulo: source.titulo
                }
            }
        );
    }

    async function get_similar_books_for_read_source(userId, bookId) {
        const [source] = await get_read_sources(
            userId,
            bookId,
            1
        );
        if (!source) return null;
        return {
            source: {
                id: Number(source.id),
                titulo: source.titulo,
                generos: parse_json_array(source.generos),
                id_autor: is_valid_id(source.id_autor) ? Number(source.id_autor) : null
            },
            libros: await find_similar_books(userId, source)
        };
    }

    return {
        get_because_read_carousel,
        get_more_from_authors,
        get_random_user_list,
        get_read_again_carousel,
        get_reading_status_carousels,
        get_recommended_authors,
        get_similar_books_for_read_source
    };
}

module.exports = {
    MAX_BOOKS_PER_CAROUSEL,
    MAX_MORE_AUTHOR_SOURCES,
    MIN_CAROUSEL_BOOKS,
    create_user_carousel_service
};
