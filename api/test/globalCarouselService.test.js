const test = require('node:test');
const assert = require('node:assert/strict');
const {
    DEFAULT_NEW_RELEASES_WINDOW_YEARS,
    create_global_carousel_service,
    get_new_releases_year_window,
    parse_new_releases_window_years
} = require('../services/globalCarouselService');

const AS_OF = new Date('2026-11-18T08:33:59.000Z');

function book_row(id, fields = {}) {
    return {
        id,
        titulo: `Book ${id}`,
        url_portada: `/covers/${id}.jpg`,
        ranking: 4.5,
        id_autor: id,
        author_id: id,
        author_name: `Author ${id}`,
        author_face: `/authors/${id}.jpg`,
        ...fields
    };
}

function reading_trend_service(overrides = {}) {
    return {
        async get_trending_books() {
            return [book_row(1), book_row(2), book_row(3), ...(overrides.spontaneous || [])];
        },
        async get_current_month_trends() {
            return {
                books: [book_row(1), book_row(2), book_row(3), ...(overrides.monthly || [])],
                period: {
                    start: '2026-11-01 00:00:00',
                    end_exclusive: '2026-11-18 08:33:59',
                    time_zone: 'UTC'
                }
            };
        }
    };
}

test('uses a configurable UTC publication-year window and rejects invalid periods', () => {
    assert.equal(DEFAULT_NEW_RELEASES_WINDOW_YEARS, 2);
    assert.equal(parse_new_releases_window_years('3'), 3);
    assert.deepEqual(get_new_releases_year_window(AS_OF, 2), {
        firstYear: 2025,
        lastYear: 2026
    });
    assert.throws(() => parse_new_releases_window_years('0'), /positive safe integer/);
    assert.throws(() => get_new_releases_year_window('2026-01-01', 2), /valid Date/);
});

test('queries current readers for most-read and maps only the card fields', async () => {
    let captured;
    const service = create_global_carousel_service({
        sequelize: {
            async query(sql, options) {
                captured = { sql, ...options };
                return [book_row(7, { read_count: 12 })];
            }
        },
        readingTrendService: reading_trend_service(),
        now: () => AS_OF
    });

    const books = await service.get_most_read_books();

    assert.match(captured.sql, /book\.read_count > 0/);
    assert.match(captured.sql, /ORDER BY book\.read_count DESC/);
    assert.match(captured.sql, /author_position <= 3/);
    assert.doesNotMatch(captured.sql, /tags|descripcion/);
    assert.equal(captured.replacements.limit, 20);
    assert.equal(books[0].read_count, 12);
    assert.deepEqual(books[0].Autor, {
        id: 7,
        nombre: 'Author 7',
        url_cara: '/authors/7.jpg'
    });
});

test('filters new releases by the configured year range and returns stable ranked cards', async () => {
    let captured;
    const service = create_global_carousel_service({
        sequelize: {
            async query(sql, options) {
                captured = { sql, ...options };
                return [book_row(9, { anio: 2026 })];
            }
        },
        readingTrendService: reading_trend_service(),
        newReleasesWindowYears: 2,
        now: () => AS_OF
    });

    const result = await service.get_new_releases();

    assert.match(captured.sql, /book\.anio >= :firstYear/);
    assert.match(captured.sql, /book\.anio <= :lastYear/);
    assert.match(captured.sql, /ORDER BY book\.anio DESC/);
    assert.match(captured.sql, /author_position <= 3/);
    assert.doesNotMatch(captured.sql, /tags|descripcion/);
    assert.equal(captured.replacements.firstYear, 2025);
    assert.equal(captured.replacements.lastYear, 2026);
    assert.equal(captured.replacements.limit, 20);
    assert.equal(result.books[0].anio, 2026);
    assert.deepEqual(result.period, { start_year: 2025, end_year: 2026 });
});

test('composes the four global carousels and omits those below the minimum', async () => {
    const service = create_global_carousel_service({
        sequelize: {
            async query(sql) {
                if (sql.includes('book.read_count > 0')) {
                    return [book_row(1), book_row(2), book_row(3)];
                }
                return [book_row(1), book_row(2)];
            }
        },
        readingTrendService: {
            async get_trending_books() {
                return [book_row(1), book_row(2), book_row(3)];
            },
            async get_current_month_trends() {
                return {
                    books: [book_row(1), book_row(2), book_row(3)],
                    period: { start: '2026-11-01 00:00:00', end_exclusive: '2026-11-18 08:33:59', time_zone: 'UTC' }
                };
            }
        },
        now: () => AS_OF
    });

    const carousels = await service.get_global_carousels();

    assert.deepEqual(carousels.map(({ id }) => id), [
        'most-read',
        'spontaneous-trends',
        'monthly-trends'
    ]);
    assert.deepEqual(carousels[2].period, {
        start: '2026-11-01 00:00:00',
        end_exclusive: '2026-11-18 08:33:59',
        time_zone: 'UTC'
    });
});

