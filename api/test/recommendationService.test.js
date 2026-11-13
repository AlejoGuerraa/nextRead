const test = require('node:test');
const assert = require('node:assert/strict');
const {
    create_candidate_repository,
    create_recommendation_service,
    generate_candidate_set,
    is_valid_catalog_book,
    merge_candidate_sources,
    score_book
} = require('../services/recommendationService');
const {
    has_index,
    supports_multi_valued_indexes
} = require('../scripts/migrateRecommendationSchema');

const NOW = new Date('2026-01-01T00:00:00.000Z');

function preference(weight, tagUpdatedAt = NOW.toISOString()) {
    return {
        weight,
        updated_at: tagUpdatedAt
    };
}

function book(id, fields = {}) {
    return {
        id,
        titulo: `Book ${id}`,
        anio: 1990 + id,
        tipo: 'Novela',
        tags: ['fantasy'],
        generos: ['adventure'],
        id_autor: id,
        ...fields
    };
}

test('normalizes scores, applies negative weights, and ignores unknown or duplicate tags', () => {
    const weights = new Map([
        ['fantasy', 0.8],
        ['horror', -0.4]
    ]);
    const completeBook = book(1, {
        tags: ['fantasy', 'horror', 'unrecognized', 'fantasy']
    });

    assert.ok(Math.abs(score_book(completeBook, weights).score - (1 / 3)) < 1e-12);
    assert.equal(score_book(book(2, { tags: ['unknown'] }), weights).score, 0);
    assert.equal(score_book(book(3, { tags: null }), weights).score, 0);
});

test('scores compatibility independently of optional metadata', () => {
    const weights = new Map([['fantasy', 0.25]]);
    const complete = score_book(book(1), weights);
    const strong = score_book(book(3), new Map([['fantasy', 0.8]]));
    const incomplete = score_book(book(2, {
        id_autor: null,
        generos: null,
        anio: null,
        tipo: null
    }), weights);

    assert.equal(complete.score, 0.25);
    assert.equal(strong.score, 0.8);
    assert.equal(incomplete.score, complete.score);
    assert.equal(is_valid_catalog_book(book(2, {
        id_autor: null,
        generos: null,
        anio: null,
        tipo: null
    })), true);
    assert.equal(is_valid_catalog_book(book('invalid-id')), false);
    assert.ok(complete.score >= -1 && complete.score <= 1);
});

test('merges books returned by multiple interest groups and exploration without duplicates', () => {
    const merged = merge_candidate_sources(
        [[book(1), book(2)], [book(1, { titulo: 'Duplicate row' })],
            [book(3, { tags: null })]],
        [book(2), book(4)]
    );

    assert.deepEqual(merged.map((candidate) => candidate.id).sort(), [1, 2, 4]);
    assert.equal(merged.find((candidate) => candidate.id === 2).sources.has('exploration'), true);
});

test('uses multiple positive interests, interleaves deterministic exploration, and supports few interests', async () => {
    const interests = [
        ['fantasy', 0.8],
        ['mystery', 0.4]
    ];
    const interestBooks = {
        fantasy: Array.from({ length: 10 }, (_, index) => book(index + 1)),
        mystery: Array.from({ length: 10 }, (_, index) => book(index + 11, {
            tags: ['mystery'],
            id_autor: index + 11
        }))
    };
    const explorationBooks = Array.from({ length: 10 }, (_, index) => book(index + 21, {
        tags: ['unfamiliar'],
        id_autor: index + 21
    }));
    const fetchedTags = [];
    const fetch_candidates_by_tag = async ({ tag }) => {
        fetchedTags.push(tag);
        return interestBooks[tag];
    };
    let excludedInterestIds = [];
    const fetch_exploration_candidates = async ({ excludedBookIds }) => {
        excludedInterestIds = excludedBookIds;
        return [book(1), ...explorationBooks];
    };
    const preferences = {
        recommendation: {
            tags: Object.fromEntries(interests.map(([tag, weight]) => [tag, preference(weight)]))
        }
    };

    const first = await generate_candidate_set({
        userId: 7,
        preferences,
        fetch_candidates_by_tag,
        fetch_exploration_candidates,
        targetSize: 10,
        now: NOW
    });
    const fewInterests = await generate_candidate_set({
        userId: 8,
        preferences: {
            recommendation: { tags: { fantasy: preference(0.8) } }
        },
        fetch_candidates_by_tag,
        fetch_exploration_candidates,
        targetSize: 10,
        now: NOW
    });

    assert.deepEqual(fetchedTags.slice(0, 2), ['fantasy', 'mystery']);
    assert.equal(first.length, 10);
    assert.equal(first.filter((candidate) => candidate.is_exploration).length, 2);
    assert.equal(first[4].is_exploration, true);
    assert.equal(new Set(first.map((candidate) => candidate.book_id)).size, first.length);
    assert.ok(excludedInterestIds.includes(1));
    assert.ok(first.filter((candidate) => candidate.is_exploration)
        .every((candidate) => candidate.book_id > 20));
    assert.equal(fewInterests.length, 10);
});

test('spreads compatibility results across authors, genres, decades, and work types', async () => {
    const candidates = [
        ...Array.from({ length: 6 }, (_, index) => book(index + 1, {
            id_autor: 1,
            generos: ['adventure'],
            anio: 1991 + index,
            tipo: 'Novela'
        })),
        book(7, { id_autor: 7, generos: ['poetry'], anio: 1880, tipo: 'Poesía' }),
        book(8, { id_autor: 8, generos: ['history'], anio: 1920, tipo: 'Ensayo' }),
        book(9, { id_autor: 9, generos: ['drama'], anio: 2005, tipo: 'Teatro' })
    ];
    const recommendations = await generate_candidate_set({
        userId: 9,
        preferences: {
            recommendation: { tags: { fantasy: preference(0.8) } }
        },
        fetch_candidates_by_tag: async () => candidates,
        fetch_exploration_candidates: async () => [],
        targetSize: 8,
        explorationRatio: 0,
        now: NOW
    });
    const selectedBooks = recommendations.map(({ book_id }) =>
        candidates.find(({ id }) => id === book_id)
    );

    assert.ok(new Set(selectedBooks.map(({ id_autor }) => id_autor)).size >= 4);
    assert.ok(new Set(selectedBooks.map(({ tipo }) => tipo)).size >= 3);
    assert.ok(new Set(selectedBooks.map(({ anio }) => Math.floor(anio / 10))).size >= 3);
    assert.ok(new Set(selectedBooks.flatMap(({ generos }) => generos)).size >= 3);
});

test('fills a candidate set from exploration when no compatibility candidates exist', async () => {
    const catalogSample = Array.from({ length: 20 }, (_, index) => book(index + 1, {
        tags: ['unfamiliar'],
        id_autor: index + 1
    }));
    const options = {
        preferences: null,
        fetch_candidates_by_tag: async () => {
            assert.fail('Users without positive interests should not run tag queries');
        },
        fetch_exploration_candidates: async () => catalogSample,
        targetSize: 10,
        now: NOW
    };
    const firstRun = await generate_candidate_set({ ...options, userId: 31 });
    const repeatedRun = await generate_candidate_set({ ...options, userId: 31 });
    const anotherUser = await generate_candidate_set({ ...options, userId: 32 });
    const nextGeneration = await generate_candidate_set({
        ...options,
        userId: 31,
        generationId: 2
    });

    assert.deepEqual(firstRun, repeatedRun);
    assert.equal(firstRun.length, 10);
    assert.ok(firstRun.every(({ is_exploration }) => is_exploration));
    assert.notDeepEqual(
        firstRun.map(({ book_id }) => book_id),
        anotherUser.map(({ book_id }) => book_id)
    );
    assert.notDeepEqual(
        firstRun.map(({ book_id }) => book_id),
        nextGeneration.map(({ book_id }) => book_id)
    );
    assert.ok(firstRun.every(({ score }) => score === 0));
});

test('rotates equal-weight candidate tags deterministically independent of property order', async () => {
    const tags = Object.fromEntries(
        Array.from({ length: 10 }, (_, index) => [`tag-${index}`, preference(0.4)])
    );
    const reversedTags = Object.fromEntries(Object.entries(tags).reverse());
    const run = async (preferenceTags) => {
        const searchedTags = [];
        await generate_candidate_set({
            userId: 12,
            generationId: 8,
            preferences: { recommendation: { tags: preferenceTags } },
            fetch_candidates_by_tag: async ({ tag }) => {
                searchedTags.push(tag);
                return [];
            },
            fetch_exploration_candidates: async () => [],
            targetSize: 10,
            now: NOW
        });
        return searchedTags;
    };

    const first = await run(tags);
    const reversed = await run(reversedTags);

    assert.equal(first.length, 8);
    assert.deepEqual(first, reversed);
});

test('candidate SQL uses bounded cursor ranges, safe parameters, and read-only exclusions', async () => {
    const queries = [];
    const repository = create_candidate_repository({
        sequelize: {
            async query(sql, options) {
                if (/MAX\(id\)/.test(sql)) {
                    return [{ max_id: 1000 }];
                }
                queries.push({ sql, options });
                return [];
            }
        }
    });

    const maxBookId = await repository.get_max_book_id();
    await repository.fetch_candidates_by_tag({
        userId: 12,
        generationId: 4,
        maxBookId,
        tag: 'fantasy',
        limit: 25
    });

    assert.equal(queries.length, 2);
    assert.match(queries[0].sql, /JSON_CONTAINS\(book\.tags, :candidateTags\) = 1/);
    assert.match(queries[0].sql, /state\.reading_status = 'read'/);
    assert.doesNotMatch(queries[0].sql, /reading_status\s*=\s*'(?:reading|to_read)'/);
    assert.match(queries[0].sql, /book\.id >= :cursor/);
    assert.match(queries[1].sql, /book\.id < :cursor/);
    assert.match(queries[0].sql, /ORDER BY book\.id ASC\s+LIMIT :limit/);
    assert.doesNotMatch(queries[0].sql, /ORDER BY (?:CRC32|RAND)\(/);
    assert.equal(queries[0].options.replacements.userId, 12);
    assert.equal(queries[0].options.replacements.limit, 25);
    assert.equal(queries[0].options.replacements.candidateTags, '["fantasy"]');
    assert.ok(queries[0].options.replacements.cursor >= 1);
    assert.ok(queries[0].options.replacements.cursor <= maxBookId);
});

test('exploration query excludes books already fetched by interest', async () => {
    let query;
    const repository = create_candidate_repository({
        sequelize: {
            async query(sql, options) {
                if (/MAX\(id\)/.test(sql)) return [{ max_id: 100 }];
                query = { sql, options };
                return [];
            }
        }
    });

    await repository.fetch_exploration_candidates({
        userId: 3,
        generationId: 2,
        maxBookId: 100,
        excludedBookIds: [8, 9],
        limit: 20
    });

    assert.match(query.sql, /book\.id NOT IN \(:excludedBookIds\)/);
    assert.deepEqual(query.options.replacements.excludedBookIds, [8, 9]);
});

test('recommendation index migration detects compatible MySQL and existing indexes', () => {
    assert.equal(supports_multi_valued_indexes('8.0.17'), true);
    assert.equal(supports_multi_valued_indexes('8.4.1-commercial'), true);
    assert.equal(supports_multi_valued_indexes('8.0.16'), false);
    assert.equal(supports_multi_valued_indexes('10.11.5-MariaDB'), false);
    assert.equal(has_index([
        { Key_name: 'uq_generation_book', Column_name: 'user_id', Seq_in_index: 1, Non_unique: 0 },
        { Key_name: 'uq_generation_book', Column_name: 'generation_id', Seq_in_index: 2, Non_unique: 0 },
        { Key_name: 'uq_generation_book', Column_name: 'book_id', Seq_in_index: 3, Non_unique: 0 }
    ], ['user_id', 'generation_id', 'book_id'], true), true);
});

test('replaces a user recommendation set atomically with unique sequential positions', async () => {
    const operations = [];
    const storedRows = [];
    const candidates = [book(1), book(2)];
    let storedPreferences = {
        recommendation: { tags: { fantasy: preference(0.8) } }
    };
    const service = create_recommendation_service({
        sequelize: {
            async transaction(callback) {
                return callback({ LOCK: { UPDATE: 'UPDATE' } });
            }
        },
        Usuario: {
            async findByPk(_id, options = {}) {
                return {
                    id: 5,
                    preferences: JSON.parse(JSON.stringify(storedPreferences)),
                    async save() {
                        storedPreferences = JSON.parse(JSON.stringify(this.preferences));
                        operations.push(['savePreferences']);
                    }
                };
            }
        },
        UserRecommendation: {
            async destroy(options) {
                operations.push(['destroy', options.where.user_id]);
            },
            async bulkCreate(rows) {
                operations.push(['bulkCreate', rows.length]);
                storedRows.push(...rows);
            }
        },
        candidateRepository: {
            async fetch_candidates_by_tag() { return candidates; },
            async fetch_exploration_candidates() { return []; }
        },
        targetSize: 10
    });

    const result = await service.generate_for_user(5, { now: NOW });

    assert.equal(result.generation_id, 1);
    assert.deepEqual(operations.slice(-2), [['destroy', 5], ['bulkCreate', 2]]);
    assert.deepEqual(storedRows.map((row) => row.position), [1, 2]);
    assert.ok(storedRows.every((row) => row.generation_id === 1));
    assert.deepEqual(
        storedRows.map((row) => row.book_id),
        result.recommendations.map((recommendation) => recommendation.book_id)
    );
    assert.equal(new Set(result.recommendations.map((row) => row.book_id)).size, 2);
});

test('a late generation cannot replace a generation reserved after it', async () => {
    let preferences = {
        recommendation: { tags: { fantasy: preference(0.8) } }
    };
    let storedRows = [{ user_id: 5, book_id: 99, generation_id: 0, position: 1 }];
    let transactionTail = Promise.resolve();
    let resumeOldGeneration;
    let oldGenerationStarted;
    const oldStarted = new Promise((resolve) => {
        oldGenerationStarted = resolve;
    });
    const oldGenerationGate = new Promise((resolve) => {
        resumeOldGeneration = resolve;
    });
    const service = create_recommendation_service({
        sequelize: {
            async transaction(callback) {
                let release;
                const previous = transactionTail;
                transactionTail = new Promise((resolve) => {
                    release = resolve;
                });
                await previous;
                try {
                    return await callback({ LOCK: { UPDATE: 'UPDATE' } });
                } finally {
                    release();
                }
            }
        },
        Usuario: {
            async findByPk() {
                return {
                    id: 5,
                    preferences: JSON.parse(JSON.stringify(preferences)),
                    async save() {
                        preferences = JSON.parse(JSON.stringify(this.preferences));
                    }
                };
            }
        },
        UserRecommendation: {
            async destroy() {
                storedRows = [];
            },
            async bulkCreate(rows) {
                storedRows = rows;
            }
        },
        candidateRepository: {
            async fetch_candidates_by_tag({ generationId }) {
                if (generationId === 1) {
                    oldGenerationStarted();
                    await oldGenerationGate;
                }
                return [book(generationId)];
            },
            async fetch_exploration_candidates() {
                return [];
            }
        },
        targetSize: 1
    });

    const olderGeneration = service.generate_for_user(5, { now: NOW });
    await oldStarted;
    const newerResult = await service.generate_for_user(5, { now: NOW });
    resumeOldGeneration();

    await assert.rejects(olderGeneration, { code: 'RECOMMENDATION_GENERATION_STALE' });
    assert.equal(newerResult.generation_id, 2);
    assert.equal(storedRows.length, 1);
    assert.equal(storedRows[0].generation_id, 2);
    assert.equal(storedRows[0].book_id, 2);
});

test('a candidate failure leaves the previously published set untouched', async () => {
    const previousRows = [{ user_id: 5, book_id: 99, generation_id: 7, position: 1 }];
    let storedRows = [...previousRows];
    let destroyCalls = 0;
    let preferences = {
        recommendation: { tags: { fantasy: preference(0.8) } }
    };
    const service = create_recommendation_service({
        sequelize: {
            async transaction(callback) {
                return callback({ LOCK: { UPDATE: 'UPDATE' } });
            }
        },
        Usuario: {
            async findByPk() {
                return {
                    id: 5,
                    preferences: JSON.parse(JSON.stringify(preferences)),
                    async save() {
                        preferences = JSON.parse(JSON.stringify(this.preferences));
                    }
                };
            }
        },
        UserRecommendation: {
            async destroy() {
                destroyCalls += 1;
                storedRows = [];
            },
            async bulkCreate(rows) {
                storedRows = rows;
            }
        },
        candidateRepository: {
            async fetch_candidates_by_tag() {
                throw new Error('Candidate lookup failed');
            },
            async fetch_exploration_candidates() {
                return [];
            }
        },
        targetSize: 1
    });

    await assert.rejects(
        service.generate_for_user(5, { now: NOW }),
        /Candidate lookup failed/
    );
    assert.equal(destroyCalls, 0);
    assert.deepEqual(storedRows, previousRows);
});

test('a tag preference change during calculation prevents stale publication', async () => {
    let preferences = {
        recommendation: { tags: { fantasy: preference(0.8) } }
    };
    const previousRows = [{ user_id: 5, book_id: 99, generation_id: 4, position: 1 }];
    let storedRows = [...previousRows];
    let destroyCalls = 0;
    const service = create_recommendation_service({
        sequelize: {
            async transaction(callback) {
                return callback({ LOCK: { UPDATE: 'UPDATE' } });
            }
        },
        Usuario: {
            async findByPk() {
                return {
                    id: 5,
                    preferences: JSON.parse(JSON.stringify(preferences)),
                    async save() {
                        preferences = JSON.parse(JSON.stringify(this.preferences));
                    }
                };
            }
        },
        UserRecommendation: {
            async destroy() {
                destroyCalls += 1;
                storedRows = [];
            },
            async bulkCreate(rows) {
                storedRows = rows;
            }
        },
        candidateRepository: {
            async fetch_candidates_by_tag() {
                preferences.recommendation.tags.fantasy = preference(0.2, '2026-01-02T00:00:00.000Z');
                return [book(1)];
            },
            async fetch_exploration_candidates() {
                return [];
            }
        },
        targetSize: 1
    });

    await assert.rejects(
        service.generate_for_user(5, { now: NOW }),
        { code: 'RECOMMENDATION_GENERATION_STALE' }
    );
    assert.equal(destroyCalls, 0);
    assert.deepEqual(storedRows, previousRows);
});
