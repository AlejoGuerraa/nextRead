const { QueryTypes } = require('sequelize');
const { map_book_rows_to_cards } = require('../utils/bookCardMapper');

const MAX_DECADE_GROUPS = 5;
const MAX_BOOKS_PER_DECADE = 20;

function create_public_decade_carousel_service({ sequelize }) {
    async function get_decades(requestedDecade = null) {
        if (requestedDecade !== null &&
            (!Number.isSafeInteger(requestedDecade) || requestedDecade < 1000 || requestedDecade > 2100)) {
            throw new Error('Requested decade must be a year between 1000 and 2100');
        }

        const rows = await sequelize.query(`
            WITH selected_decades AS (
                SELECT
                    CASE
                        WHEN :requestedDecade IS NULL THEN FLOOR(book.anio / 10) * 10
                        ELSE :requestedDecade
                    END AS decade_start
                FROM \`Libro\` AS book
                WHERE book.anio > 0
                    AND (
                        :requestedDecade IS NULL
                        OR book.anio BETWEEN :requestedDecade AND :requestedDecade + 9
                    )
                GROUP BY decade_start
                ORDER BY decade_start DESC
                LIMIT :maxDecades
            ),
            ranked_books AS (
                SELECT
                    book.id,
                    book.titulo,
                    book.anio,
                    book.url_portada,
                    book.ranking,
                    book.id_autor,
                    author.id AS author_id,
                    author.nombre AS author_name,
                    author.url_cara AS author_face,
                    decade.decade_start,
                    COUNT(*) OVER (
                        PARTITION BY decade.decade_start
                    ) AS decade_count,
                    ROW_NUMBER() OVER (
                        PARTITION BY decade.decade_start
                        ORDER BY book.anio DESC, book.id DESC
                    ) AS decade_position
                FROM selected_decades AS decade
                INNER JOIN \`Libro\` AS book
                    ON (
                        (
                            :requestedDecade IS NULL
                            AND FLOOR(book.anio / 10) * 10 = decade.decade_start
                        )
                        OR (
                            :requestedDecade IS NOT NULL
                            AND book.anio BETWEEN :requestedDecade AND :requestedDecade + 9
                        )
                    )
                LEFT JOIN \`Autor\` AS author
                    ON author.id = book.id_autor
            )
            SELECT
                id,
                titulo,
                anio,
                url_portada,
                ranking,
                id_autor,
                author_id,
                author_name,
                author_face,
                decade_start,
                decade_count
            FROM ranked_books
            WHERE decade_position <= :maxBooks
            ORDER BY decade_start DESC, anio DESC, id DESC
        `, {
            replacements: {
                requestedDecade,
                maxDecades: requestedDecade === null ? MAX_DECADE_GROUPS : 1,
                maxBooks: MAX_BOOKS_PER_DECADE
            },
            type: QueryTypes.SELECT
        });

        const cards = map_book_rows_to_cards(rows);
        const groups = new Map();

        rows.forEach((row, index) => {
            const start = Number(row.decade_start);
            let group = groups.get(start);

            if (!group) {
                group = {
                    decade: `${start}s`,
                    start,
                    end: start + 9,
                    count: Number(row.decade_count),
                    libros: []
                };
                groups.set(start, group);
            }

            const book = cards[index];
            book.ranking = book.ranking == null ? 0 : Math.floor(Number(book.ranking));
            group.libros.push(book);
        });

        return [...groups.values()];
    }

    return { get_decades };
}

module.exports = {
    MAX_BOOKS_PER_DECADE,
    MAX_DECADE_GROUPS,
    create_public_decade_carousel_service
};
