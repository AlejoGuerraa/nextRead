const test = require('node:test');
const assert = require('node:assert/strict');
const { create_recommendation_reader } = require('../services/recommendationService');

function create_reader(records) {
    const queries = [];
    const reader = create_recommendation_reader({
        sequelize: {
            async query(sql, options) {
                queries.push({ sql, options });
                assert.match(sql, /MAX\(generation_id\) AS generation_id/);
                assert.match(sql, /WHERE user_id = :userId/);
                assert.match(sql, /AND generation_id > 0/);
                assert.match(sql, /ORDER BY recommendation\.position ASC/);
                const userId = options.replacements.userId;
                const userRecommendations = records.filter((record) =>
                    Number(record.user_id) === userId &&
                    Number(record.generation_id) > 0
                );
                if (userRecommendations.length === 0) return [];

                const latestGeneration = Math.max(...userRecommendations.map((record) =>
                    Number(record.generation_id)
                ));
                return userRecommendations
                    .filter((record) => Number(record.generation_id) === latestGeneration)
                    .sort((left, right) => left.position - right.position)
                    .slice(0, options.replacements.limit || 20)
                    .map(({ user_id, ...record }) => ({ ...record }));
            }
        }
    });

    return { queries, reader };
}

function recommendation({
    user_id = 1,
    generation_id = 3,
    position = 1,
    id = position,
    titulo = `Book ${id}`,
    is_read = false,
    anio = 1965,
    tags = ['1960']
} = {}) {
    return {
        user_id,
        generation_id,
        position,
        id,
        titulo,
        url_portada: `/covers/${id}.jpg`,
        ranking: 4.2,
        nombre_autor: 'Author',
        score: 0.6,
        is_exploration: false,
        is_read,
        anio,
        tags
    };
}

test('returns a pending response when the user has no published recommendations', async () => {
    const { reader } = create_reader([]);

    assert.deepEqual(await reader.get_published_for_user(8), {
        status: 'pending',
        generation_id: null,
        libros: []
    });
});

test('does not expose legacy generation-zero rows as published recommendations', async () => {
    const { reader } = create_reader([
        recommendation({ user_id: 8, generation_id: 0, id: 80 })
    ]);

    assert.deepEqual(await reader.get_published_for_user(8), {
        status: 'pending',
        generation_id: null,
        libros: []
    });
});

test('returns the published books and generation metadata for the authenticated user', async () => {
    const { reader } = create_reader([recommendation({ user_id: 8, id: 21 })]);

    const result = await reader.get_published_for_user(8);

    assert.equal(result.status, 'ready');
    assert.equal(result.generation_id, 3);
    assert.equal(result.libros[0].id, 21);
    assert.equal(result.libros[0].titulo, 'Book 21');
});

test('returns recommendations in persisted position order', async () => {
    const { reader } = create_reader([
        recommendation({ position: 3, id: 31 }),
        recommendation({ position: 1, id: 11 }),
        recommendation({ position: 2, id: 21 })
    ]);

    const result = await reader.get_published_for_user(1);

    assert.deepEqual(result.libros.map(({ position, id }) => [position, id]), [
        [1, 11],
        [2, 21],
        [3, 31]
    ]);
});

test('isolates published recommendations by user id', async () => {
    const { queries, reader } = create_reader([
        recommendation({ user_id: 7, id: 71 }),
        recommendation({ user_id: 8, id: 81 })
    ]);

    const result = await reader.get_published_for_user(8);

    assert.deepEqual(result.libros.map(({ id }) => id), [81]);
    assert.equal(queries[0].options.replacements.userId, 8);
});

test('selects only the latest published generation even when older rows exist', async () => {
    const { reader } = create_reader([
        recommendation({ user_id: 5, generation_id: 0, position: 1, id: 1 }),
        recommendation({ user_id: 5, generation_id: 4, position: 1, id: 41 }),
        recommendation({ user_id: 5, generation_id: 7, position: 2, id: 72 }),
        recommendation({ user_id: 5, generation_id: 7, position: 1, id: 71 })
    ]);

    const result = await reader.get_published_for_user(5);

    assert.equal(result.generation_id, 7);
    assert.deepEqual(result.libros.map(({ generation_id, position, id }) => [
        generation_id,
        position,
        id
    ]), [
        [7, 1, 71],
        [7, 2, 72]
    ]);
});

test('reads the bounded latest candidate set without treating read books as missing generations', async () => {
    const { queries, reader } = create_reader([
        recommendation({ user_id: 5, generation_id: 4, position: 1, id: 41 }),
        recommendation({
            user_id: 5,
            generation_id: 7,
            position: 1,
            id: 71,
            is_read: true,
            tags: ['1960'],
            anio: 1965
        }),
        recommendation({
            user_id: 5,
            generation_id: 7,
            position: 2,
            id: 72,
            is_read: false,
            tags: ['1980'],
            anio: 1982
        })
    ]);

    const result = await reader.get_published_candidate_set_for_user(5);

    assert.equal(result.status, 'ready');
    assert.equal(result.generation_id, 7);
    assert.deepEqual(result.candidates.map(({ id, is_read }) => [id, is_read]), [
        [71, true],
        [72, false]
    ]);
    assert.equal(queries[0].options.replacements.limit, 200);
    assert.match(queries[0].sql, /LEFT JOIN `user_book_states` AS state/);
    assert.match(queries[0].sql, /LIMIT :limit/);
});

test('returns pending when no candidate generation is published', async () => {
    const { reader } = create_reader([]);

    assert.deepEqual(await reader.get_published_candidate_set_for_user(8), {
        status: 'pending',
        generation_id: null,
        candidates: []
    });
});
