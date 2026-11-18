const test = require('node:test');
const assert = require('node:assert/strict');
const {
    WEIGHT_LIMIT,
    apply_contribution_delta,
    build_book_contributions,
    build_initial_preferences,
    createTagPreferenceService,
    effective_weight,
    normalize_tags
} = require('../services/tagPreferenceService');

const NOW = new Date('2026-01-01T00:00:00.000Z');
const close_to = (actual, expected, tolerance = 1e-10) => {
    assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be close to ${expected}`);
};

function create_signal_store() {
    const records = new Map();
    const key_for = ({ user_id, book_id }) => `${user_id}:${book_id}`;
    return {
        records,
        model: {
            async findOne({ where }) {
                const key = key_for(where);
                const record = records.get(key);
                if (!record) return null;
                return {
                    ...record,
                    async save() {
                        records.set(key, this);
                    },
                    async destroy() {
                        records.delete(key);
                    }
                };
            },
            async create(record) {
                records.set(key_for(record), { ...record });
            }
        }
    };
}

function create_transaction() {
    return { LOCK: { UPDATE: 'UPDATE' } };
}

test('creates a normalized preference for a user with no existing profile', () => {
    const contribution = build_book_contributions(['Fantasy'], { isFavorite: true });
    const result = apply_contribution_delta(null, {}, contribution, NOW);
    const entry = result.preferences.recommendation.tags.fantasy;

    assert.equal(result.changed, true);
    close_to(entry.weight, 0.30);
    assert.equal(entry.contribution_count, 1);
    assert.equal(entry.updated_at, NOW.toISOString());
});

test('maps each configured interaction to its normalized impact', () => {
    const cases = [
        [{ isFavorite: true }, 0.30],
        [{ readingStatus: 'reading' }, 0.05],
        [{ readingStatus: 'to_read' }, 0.15],
        [{ readingStatus: 'read' }, 0.10],
        [{ rating: 5 }, 0.40],
        [{ rating: 4 }, 0.25],
        [{ rating: 3 }, 0.15],
        [{ rating: 2 }, -0.20],
        [{ rating: 1 }, -0.30]
    ];

    for (const [source, impact] of cases) {
        const contributions = build_book_contributions(['tag'], {
            isFavorite: false,
            readingStatus: null,
            rating: null,
            ...source
        });
        const result = apply_contribution_delta(null, {}, contributions, NOW);
        close_to(result.preferences.recommendation.tags.tag.weight, impact);
    }
});

test('combines favorite and status signals while a rating replaces the unrated-read signal', () => {
    const favoriteAndToRead = build_book_contributions(['fantasy'], {
        isFavorite: true,
        readingStatus: 'to_read',
        rating: null
    });
    const readWithRating = build_book_contributions(['fantasy'], {
        isFavorite: true,
        readingStatus: 'read',
        rating: 2
    });
    const initial = apply_contribution_delta(null, {}, favoriteAndToRead, NOW);
    const result = apply_contribution_delta(initial.preferences, favoriteAndToRead, readWithRating, NOW);

    close_to(result.preferences.recommendation.tags.fantasy.evidence_sum, Math.atanh(0.30) + Math.atanh(-0.20));
    close_to(result.preferences.recommendation.tags.fantasy.weight, Math.tanh(
        Math.atanh(0.30) + Math.atanh(-0.20)
    ));
    assert.equal(result.preferences.recommendation.tags.fantasy.contribution_count, 1);
});

test('normalizes and deduplicates tags without merging accent variants', () => {
    assert.deepEqual(normalize_tags([' Fantasía ', 'fantasi\u0301a', 'Fantasía', 'fantasia', null]), [
        'fantasía',
        'fantasia'
    ]);
    assert.deepEqual(build_book_contributions([], { isFavorite: true }), {});
});

test('decays positive and negative weights at 75, 150, and 300 days without changing sign', () => {
    const positive = { weight: 0.4, updated_at: NOW.toISOString() };
    const negative = { weight: -0.3, updated_at: NOW.toISOString() };
    const days = [75, 150, 300];
    const expectedFactors = [Math.sqrt(0.8), 0.8, 0.64];

    days.forEach((day, index) => {
        const now = new Date(NOW.getTime() + day * 86400000);
        close_to(effective_weight(positive, now), 0.4 * expectedFactors[index]);
        close_to(effective_weight(negative, now), -0.3 * expectedFactors[index]);
    });
});

test('reverses a book signal using its saved tag snapshot after catalog tags change', async () => {
    const { model, records } = create_signal_store();
    const service = createTagPreferenceService({ UserBookPreferenceSignal: model });
    const user = {
        id: 7,
        preferences: null,
        async save() {}
    };
    const transaction = create_transaction();

    await service.update_book_signals({
        user,
        bookId: 21,
        tags: ['science fiction'],
        oldSources: { isFavorite: false, readingStatus: null, rating: null },
        newSources: { isFavorite: true, readingStatus: null, rating: null },
        transaction,
        now: NOW
    });
    await service.update_book_signals({
        user,
        bookId: 21,
        tags: ['horror'],
        oldSources: { isFavorite: true, readingStatus: null, rating: null },
        newSources: { isFavorite: false, readingStatus: null, rating: null },
        transaction,
        now: new Date(NOW.getTime() + 86400000)
    });

    assert.deepEqual(user.preferences.recommendation.tags, {});
    assert.equal(records.size, 0);
});

test('replaces a rating contribution, replays idempotently, and preserves its timestamp', async () => {
    const { model } = create_signal_store();
    const service = createTagPreferenceService({ UserBookPreferenceSignal: model });
    const user = { id: 3, preferences: null, async save() {} };
    const transaction = create_transaction();
    const oldSources = { isFavorite: false, readingStatus: null, rating: null };
    const fiveStarSources = { ...oldSources, rating: 5 };
    const oneStarSources = { ...oldSources, rating: 1 };

    await service.update_book_signals({
        user,
        bookId: 10,
        tags: ['mystery'],
        oldSources,
        newSources: fiveStarSources,
        transaction,
        now: NOW
    });
    await service.update_book_signals({
        user,
        bookId: 10,
        tags: ['mystery'],
        oldSources: fiveStarSources,
        newSources: oneStarSources,
        transaction,
        now: new Date(NOW.getTime() + 86400000)
    });
    const entry = user.preferences.recommendation.tags.mystery;
    close_to(entry.weight, -0.30);
    assert.equal(entry.updated_at, new Date(NOW.getTime() + 86400000).toISOString());

    await service.update_book_signals({
        user,
        bookId: 10,
        tags: ['mystery'],
        oldSources: fiveStarSources,
        newSources: oneStarSources,
        transaction,
        now: new Date(NOW.getTime() + 2 * 86400000)
    });
    close_to(user.preferences.recommendation.tags.mystery.weight, -0.30);
    assert.equal(user.preferences.recommendation.tags.mystery.updated_at, entry.updated_at);
});

test('bounds aggregated weights when many books contribute to the same tag', () => {
    const contributions = new Map();
    for (let bookId = 1; bookId <= 100; bookId += 1) {
        contributions.set(bookId, { fantasy: Math.atanh(0.40) });
    }

    const initial = build_initial_preferences(contributions, NOW);
    const entry = initial.tags.fantasy;
    assert.equal(entry.contribution_count, 100);
    assert.ok(entry.weight <= WEIGHT_LIMIT);
    assert.ok(entry.weight > 0.999);
});
