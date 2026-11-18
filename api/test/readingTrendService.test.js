const test = require('node:test');
const assert = require('node:assert/strict');
const {
    DEFAULT_MINIMUM_UNIQUE_READERS,
    calculate_trend_score,
    create_reading_trend_service,
    get_current_utc_month_window,
    get_trend_windows,
    parse_minimum_unique_readers
} = require('../services/readingTrendService');

const AS_OF = new Date('2026-03-01T00:00:00.000Z');

test('calculates the specified trend score without rewarding a decline', () => {
    assert.equal(calculate_trend_score(40, 20), 50);
    assert.equal(calculate_trend_score(20, 40), 20);
    assert.equal(calculate_trend_score(30, 30), 30);
});

test('defines adjacent half-open 30-day windows in UTC across month and year boundaries', () => {
    assert.deepEqual(get_trend_windows(AS_OF), {
        previousStart: '2025-12-31 00:00:00',
        recentStart: '2026-01-30 00:00:00',
        asOf: '2026-03-01 00:00:00'
    });
    assert.equal(
        get_trend_windows(new Date('2026-03-01T00:00:00.999Z')).asOf,
        '2026-03-01 00:00:00'
    );
});

test('defines the current calendar-month window in UTC with an exclusive current-time end', () => {
    const asOf = new Date('2026-03-31T23:59:59.999Z');
    assert.deepEqual(get_current_utc_month_window(asOf), {
        periodStart: '2026-03-01 00:00:00',
        periodEnd: '2026-03-31 23:59:59'
    });
});

test('queries unique users over the bounded 60-day range and applies the configurable threshold', async () => {
    let captured;
    const service = create_reading_trend_service({
        sequelize: {
            async query(sql, options) {
                captured = { sql, ...options };
                return [{
                    id: 8,
                    titulo: 'Trending book',
                    ranking: 4.5,
                    author_id: 3,
                    author_name: 'Author',
                    author_face: '/authors/3.jpg',
                    recent_unique_readers: '40',
                    previous_unique_readers: '20',
                    trend_score: '50.0'
                }];
            }
        },
        minimumUniqueReaders: 30,
        now: () => AS_OF
    });

    const books = await service.get_trending_books();

    assert.match(captured.sql, /COUNT\(DISTINCT CASE/);
    assert.match(captured.sql, /event\.occurred_at >= :recentStart/);
    assert.match(captured.sql, /event\.occurred_at < :asOf/);
    assert.match(captured.sql, /event\.occurred_at >= :previousStart/);
    assert.match(captured.sql, /FORCE INDEX \(book_read_events_occurred_at_book_id_user_id\)/);
    assert.match(captured.sql, /recent_unique_readers >= :minimumUniqueReaders/);
    assert.match(captured.sql, /ROW_NUMBER\(\) OVER/);
    assert.match(captured.sql, /author_position <= 3/);
    assert.match(captured.sql, /TRIM\(book\.titulo\) <> ''/);
    assert.equal(captured.replacements.previousStart, '2025-12-31 00:00:00');
    assert.equal(captured.replacements.recentStart, '2026-01-30 00:00:00');
    assert.equal(captured.replacements.asOf, '2026-03-01 00:00:00');
    assert.equal(captured.replacements.minimumUniqueReaders, 30);
    assert.equal(captured.replacements.limit, 20);
    assert.equal(books[0].recent_unique_readers, 40);
    assert.equal(books[0].previous_unique_readers, 20);
    assert.equal(books[0].trend_score, 50);
    assert.deepEqual(books[0].Autor, {
        id: 3,
        nombre: 'Author',
        url_cara: '/authors/3.jpg'
    });
});

test('queries unique monthly readers in a half-open UTC period and enforces the threshold', async () => {
    let captured;
    const service = create_reading_trend_service({
        sequelize: {
            async query(sql, options) {
                captured = { sql, ...options };
                return [{
                    id: 8,
                    titulo: 'Monthly book',
                    ranking: 4.5,
                    author_id: 3,
                    author_name: 'Author',
                    author_face: '/authors/3.jpg',
                    unique_readers: '36'
                }];
            }
        },
        minimumUniqueReaders: 30,
        now: () => new Date('2026-03-31T23:59:59.999Z')
    });

    const result = await service.get_current_month_trends();

    assert.match(captured.sql, /COUNT\(DISTINCT event\.user_id\)/);
    assert.match(captured.sql, /event\.occurred_at >= :periodStart/);
    assert.match(captured.sql, /event\.occurred_at < :periodEnd/);
    assert.match(captured.sql, /unique_readers >= :minimumUniqueReaders/);
    assert.match(captured.sql, /author_position <= 3/);
    assert.equal(captured.replacements.periodStart, '2026-03-01 00:00:00');
    assert.equal(captured.replacements.periodEnd, '2026-03-31 23:59:59');
    assert.equal(captured.replacements.minimumUniqueReaders, 30);
    assert.equal(captured.replacements.limit, 20);
    assert.equal(result.books[0].unique_readers, 36);
    assert.deepEqual(result.period, {
        start: '2026-03-01 00:00:00',
        end_exclusive: '2026-03-31 23:59:59',
        time_zone: 'UTC'
    });
});

test('defaults the threshold to 30 and rejects invalid settings and timestamps', () => {
    assert.equal(DEFAULT_MINIMUM_UNIQUE_READERS, 30);
    assert.equal(parse_minimum_unique_readers(''), 30);
    assert.equal(parse_minimum_unique_readers('12'), 12);
    assert.throws(() => parse_minimum_unique_readers('0'), /positive safe integer/);
    assert.throws(() => get_trend_windows('2026-03-01T00:00:00.000Z'), /valid Date/);
    assert.throws(() => calculate_trend_score(-1, 0), /non-negative safe integers/);
});

test('returns no trends when historical activity is absent instead of falling back to popularity', async () => {
    let queryCount = 0;
    const service = create_reading_trend_service({
        sequelize: {
            async query(sql) {
                queryCount += 1;
                assert.match(sql, /FROM `book_read_events` AS event/);
                assert.match(sql, /recent_unique_readers >= :minimumUniqueReaders/);
                return [];
            }
        },
        now: () => AS_OF
    });

    assert.deepEqual(await service.get_trending_books(), []);
    assert.equal(queryCount, 1);
});
