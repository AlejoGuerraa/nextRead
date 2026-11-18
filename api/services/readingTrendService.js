const { QueryTypes } = require('sequelize');
const { map_book_rows_to_cards } = require('../utils/bookCardMapper');

const TREND_WINDOW_DAYS = 30;
const TREND_WINDOW_MS = TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const TREND_ACCELERATION_FACTOR = 0.5;
const DEFAULT_MINIMUM_UNIQUE_READERS = 30;
const MAX_TREND_BOOKS = 20;

function parse_minimum_unique_readers(value = process.env.READING_TRENDS_MIN_UNIQUE_USERS) {
    if (value === undefined || value === '') return DEFAULT_MINIMUM_UNIQUE_READERS;
    const minimum = Number(value);
    if (!Number.isSafeInteger(minimum) || minimum < 1) {
        throw new Error('READING_TRENDS_MIN_UNIQUE_USERS must be a positive safe integer');
    }
    return minimum;
}

function format_utc_datetime(value) {
    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
        throw new Error('Trend calculation time must be a valid Date');
    }
    return value.toISOString().slice(0, 19).replace('T', ' ');
}

function get_trend_windows(asOf) {
    if (!(asOf instanceof Date) || !Number.isFinite(asOf.getTime())) {
        throw new Error('Trend calculation time must be a valid Date');
    }
    const asOfMs = Math.floor(asOf.getTime() / 1000) * 1000;
    return {
        previousStart: format_utc_datetime(new Date(asOfMs - 2 * TREND_WINDOW_MS)),
        recentStart: format_utc_datetime(new Date(asOfMs - TREND_WINDOW_MS)),
        asOf: format_utc_datetime(asOf)
    };
}

function get_current_utc_month_window(asOf) {
    if (!(asOf instanceof Date) || !Number.isFinite(asOf.getTime())) {
        throw new Error('Trend calculation time must be a valid Date');
    }

    const asOfMs = Math.floor(asOf.getTime() / 1000) * 1000;
    const end = new Date(asOfMs);
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

    return {
        periodStart: format_utc_datetime(start),
        periodEnd: format_utc_datetime(end)
    };
}

function calculate_trend_score(recentUniqueReaders, previousUniqueReaders) {
    const recent = Number(recentUniqueReaders);
    const previous = Number(previousUniqueReaders);
    if (
        !Number.isSafeInteger(recent) ||
        recent < 0 ||
        !Number.isSafeInteger(previous) ||
        previous < 0
    ) {
        throw new Error('Trend reader counts must be non-negative safe integers');
    }
    return recent + TREND_ACCELERATION_FACTOR * Math.max(0, recent - previous);
}

function create_reading_trend_service({
    sequelize,
    minimumUniqueReaders = parse_minimum_unique_readers(),
    now = () => new Date()
}) {
    const configuredMinimum = parse_minimum_unique_readers(minimumUniqueReaders);

    async function get_trending_books() {
        const windows = get_trend_windows(now());
        const rows = await sequelize.query(`
            WITH period_activity AS (
                SELECT
                    event.book_id,
                    COUNT(DISTINCT CASE
                        WHEN event.occurred_at >= :recentStart THEN event.user_id
                    END) AS recent_unique_readers,
                    COUNT(DISTINCT CASE
                        WHEN event.occurred_at < :recentStart THEN event.user_id
                    END) AS previous_unique_readers
                FROM \`book_read_events\` AS event
                    FORCE INDEX (book_read_events_occurred_at_book_id_user_id)
                WHERE event.occurred_at >= :previousStart
                    AND event.occurred_at < :asOf
                GROUP BY event.book_id
            ),
            trend_scores AS (
                SELECT
                    activity.book_id,
                    activity.recent_unique_readers,
                    activity.previous_unique_readers,
                    activity.recent_unique_readers
                        + ${TREND_ACCELERATION_FACTOR} * GREATEST(
                            0,
                            activity.recent_unique_readers - activity.previous_unique_readers
                        ) AS trend_score
                FROM period_activity AS activity
                WHERE activity.recent_unique_readers >= :minimumUniqueReaders
            ),
            ranked_trends AS (
                SELECT
                    book.id,
                    book.titulo,
                    book.url_portada,
                    book.ranking,
                    book.id_autor,
                    author.id AS author_id,
                    author.nombre AS author_name,
                    author.url_cara AS author_face,
                    stats.recent_unique_readers,
                    stats.previous_unique_readers,
                    stats.trend_score,
                    ROW_NUMBER() OVER (
                        PARTITION BY COALESCE(book.id_autor, -book.id)
                        ORDER BY stats.trend_score DESC,
                            stats.recent_unique_readers DESC,
                            book.ranking DESC,
                            book.id ASC
                    ) AS author_position
                FROM trend_scores AS stats
                INNER JOIN \`Libro\` AS book
                    ON book.id = stats.book_id
                LEFT JOIN \`Autor\` AS author
                    ON author.id = book.id_autor
                WHERE TRIM(book.titulo) <> ''
            )
            SELECT
                id,
                titulo,
                url_portada,
                ranking,
                id_autor,
                author_id,
                author_name,
                author_face,
                recent_unique_readers,
                previous_unique_readers,
                trend_score
            FROM ranked_trends
            WHERE author_position <= 3
            ORDER BY trend_score DESC,
                recent_unique_readers DESC,
                ranking DESC,
                id ASC
            LIMIT :limit
        `, {
            replacements: {
                ...windows,
                minimumUniqueReaders: configuredMinimum,
                limit: MAX_TREND_BOOKS
            },
            type: QueryTypes.SELECT
        });

        return map_book_rows_to_cards(rows).map((book, index) => {
            const row = rows[index];
            return {
                ...book,
                recent_unique_readers: Number(row.recent_unique_readers),
                previous_unique_readers: Number(row.previous_unique_readers),
                trend_score: Number(row.trend_score)
            };
        });
    }

    async function get_current_month_trends() {
        const period = get_current_utc_month_window(now());
        const rows = await sequelize.query(`
            WITH monthly_activity AS (
                SELECT
                    event.book_id,
                    COUNT(DISTINCT event.user_id) AS unique_readers
                FROM \`book_read_events\` AS event
                    FORCE INDEX (book_read_events_occurred_at_book_id_user_id)
                WHERE event.occurred_at >= :periodStart
                    AND event.occurred_at < :periodEnd
                GROUP BY event.book_id
            ),
            ranked_monthly_trends AS (
                SELECT
                    book.id,
                    book.titulo,
                    book.url_portada,
                    book.ranking,
                    book.id_autor,
                    author.id AS author_id,
                    author.nombre AS author_name,
                    author.url_cara AS author_face,
                    activity.unique_readers,
                    ROW_NUMBER() OVER (
                        PARTITION BY COALESCE(book.id_autor, -book.id)
                        ORDER BY activity.unique_readers DESC,
                            book.ranking DESC,
                            book.id ASC
                    ) AS author_position
                FROM monthly_activity AS activity
                INNER JOIN \`Libro\` AS book
                    ON book.id = activity.book_id
                LEFT JOIN \`Autor\` AS author
                    ON author.id = book.id_autor
                WHERE activity.unique_readers >= :minimumUniqueReaders
                    AND TRIM(book.titulo) <> ''
            )
            SELECT
                id,
                titulo,
                url_portada,
                ranking,
                id_autor,
                author_id,
                author_name,
                author_face,
                unique_readers
            FROM ranked_monthly_trends
            WHERE author_position <= 3
            ORDER BY unique_readers DESC,
                ranking DESC,
                id ASC
            LIMIT :limit
        `, {
            replacements: {
                ...period,
                minimumUniqueReaders: configuredMinimum,
                limit: MAX_TREND_BOOKS
            },
            type: QueryTypes.SELECT
        });

        const books = map_book_rows_to_cards(rows).map((book, index) => ({
            ...book,
            unique_readers: Number(rows[index].unique_readers)
        }));

        return {
            books,
            period: {
                start: period.periodStart,
                end_exclusive: period.periodEnd,
                time_zone: 'UTC'
            }
        };
    }

    return { get_trending_books, get_current_month_trends };
}

module.exports = {
    DEFAULT_MINIMUM_UNIQUE_READERS,
    TREND_ACCELERATION_FACTOR,
    TREND_WINDOW_DAYS,
    calculate_trend_score,
    create_reading_trend_service,
    get_current_utc_month_window,
    get_trend_windows,
    parse_minimum_unique_readers
};
