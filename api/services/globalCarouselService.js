const { QueryTypes } = require('sequelize');
const { map_book_rows_to_cards } = require('../utils/bookCardMapper');

const MAX_GLOBAL_CAROUSEL_BOOKS = 20;
const MIN_GLOBAL_CAROUSEL_BOOKS = 3;
const DEFAULT_NEW_RELEASES_WINDOW_YEARS = 2;

function parse_new_releases_window_years(value = process.env.NEW_RELEASES_WINDOW_YEARS) {
    if (value === undefined || value === '') return DEFAULT_NEW_RELEASES_WINDOW_YEARS;

    const years = Number(value);
    if (!Number.isSafeInteger(years) || years < 1) {
        throw new Error('NEW_RELEASES_WINDOW_YEARS must be a positive safe integer');
    }
    return years;
}

function get_new_releases_year_window(asOf, windowYears) {
    if (!(asOf instanceof Date) || !Number.isFinite(asOf.getTime())) {
        throw new Error('Release calculation time must be a valid Date');
    }

    const years = parse_new_releases_window_years(windowYears);
    const currentYear = asOf.getUTCFullYear();
    return {
        firstYear: Math.max(1, currentYear - years + 1),
        lastYear: currentYear
    };
}

function create_global_carousel_service({
    sequelize,
    readingTrendService,
    newReleasesWindowYears = parse_new_releases_window_years(),
    now = () => new Date()
}) {
    if (!readingTrendService) {
        throw new Error('A reading trend service is required');
    }

    const configuredWindowYears = parse_new_releases_window_years(newReleasesWindowYears);

    async function get_most_read_books() {
        const rows = await sequelize.query(`
            WITH ranked_books AS (
                SELECT
                    book.id,
                    book.titulo,
                    book.url_portada,
                    book.ranking,
                    book.read_count,
                    book.id_autor,
                    author.id AS author_id,
                    author.nombre AS author_name,
                    author.url_cara AS author_face,
                    ROW_NUMBER() OVER (
                        PARTITION BY COALESCE(book.id_autor, -book.id)
                        ORDER BY book.read_count DESC,
                            book.ranking DESC,
                            book.id ASC
                    ) AS author_position
                FROM \`Libro\` AS book
                LEFT JOIN \`Autor\` AS author
                    ON author.id = book.id_autor
                WHERE book.read_count > 0
                    AND TRIM(book.titulo) <> ''
            )
            SELECT
                id,
                titulo,
                url_portada,
                ranking,
                read_count,
                id_autor,
                author_id,
                author_name,
                author_face
            FROM ranked_books
            WHERE author_position <= 3
            ORDER BY read_count DESC,
                ranking DESC,
                id ASC
            LIMIT :limit
        `, {
            replacements: { limit: MAX_GLOBAL_CAROUSEL_BOOKS },
            type: QueryTypes.SELECT
        });

        return map_book_rows_to_cards(rows);
    }

    async function get_new_releases() {
        const period = get_new_releases_year_window(now(), configuredWindowYears);
        const rows = await sequelize.query(`
            WITH ranked_books AS (
                SELECT
                    book.id,
                    book.titulo,
                    book.url_portada,
                    book.ranking,
                    book.anio,
                    book.id_autor,
                    author.id AS author_id,
                    author.nombre AS author_name,
                    author.url_cara AS author_face,
                    ROW_NUMBER() OVER (
                        PARTITION BY COALESCE(book.id_autor, -book.id)
                        ORDER BY book.anio DESC,
                            book.ranking DESC,
                            book.id ASC
                    ) AS author_position
                FROM \`Libro\` AS book
                LEFT JOIN \`Autor\` AS author
                    ON author.id = book.id_autor
                WHERE book.anio >= :firstYear
                    AND book.anio <= :lastYear
                    AND TRIM(book.titulo) <> ''
            )
            SELECT
                id,
                titulo,
                url_portada,
                ranking,
                anio,
                id_autor,
                author_id,
                author_name,
                author_face
            FROM ranked_books
            WHERE author_position <= 3
            ORDER BY anio DESC,
                ranking DESC,
                id ASC
            LIMIT :limit
        `, {
            replacements: {
                ...period,
                limit: MAX_GLOBAL_CAROUSEL_BOOKS
            },
            type: QueryTypes.SELECT
        });

        return {
            books: map_book_rows_to_cards(rows),
            period: {
                start_year: period.firstYear,
                end_year: period.lastYear
            }
        };
    }

    async function get_global_carousels() {
        const [mostRead, spontaneousTrends, monthlyTrends, newReleases] = await Promise.all([
            get_most_read_books(),
            readingTrendService.get_trending_books(),
            readingTrendService.get_current_month_trends(),
            get_new_releases()
        ]);

        const carousels = [
            {
                id: 'most-read',
                title: 'Los más leídos en NextRead',
                libros: mostRead
            },
            {
                id: 'spontaneous-trends',
                title: 'Tendencias espontáneas',
                libros: spontaneousTrends
            },
            {
                id: 'monthly-trends',
                title: 'Tendencias del mes',
                libros: monthlyTrends.books,
                period: monthlyTrends.period
            },
            {
                id: 'new-releases',
                title: 'Nuevos lanzamientos',
                libros: newReleases.books,
                period: newReleases.period
            }
        ];

        return carousels.filter((carousel) =>
            carousel.libros.length >= MIN_GLOBAL_CAROUSEL_BOOKS
        );
    }

    return { get_global_carousels, get_most_read_books, get_new_releases };
}

module.exports = {
    DEFAULT_NEW_RELEASES_WINDOW_YEARS,
    MAX_GLOBAL_CAROUSEL_BOOKS,
    MIN_GLOBAL_CAROUSEL_BOOKS,
    create_global_carousel_service,
    get_new_releases_year_window,
    parse_new_releases_window_years
};
