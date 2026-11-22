const test = require('node:test');
const assert = require('node:assert/strict');
const {
    create_user_carousel_service
} = require('../services/userCarouselService');

function make_book(id, overrides = {}) {
    return {
        id,
        titulo: `Book ${id}`,
        url_portada: `/covers/${id}.jpg`,
        ranking: 4.2,
        id_autor: id,
        nombre_autor: `Author ${id}`,
        ...overrides
    };
}

function make_service(query_handler, options = {}) {
    const calls = [];
    const service = create_user_carousel_service({
        sequelize: {
            async query(sql, queryOptions) {
                calls.push({ sql, ...queryOptions });
                return query_handler(sql, queryOptions, calls.length);
            }
        },
        ...options
    });
    return { service, calls };
}

test('reading-state carousels use the current user state and return bounded books', async () => {
    const { service, calls } = make_service((sql, { replacements }) => {
        assert.match(sql, /state\.reading_status IN \('reading', 'to_read'\)/);
        assert.match(sql, /ORDER BY state\.status_updated_at DESC/);
        assert.match(sql, /reading_states\.status_position <= :limit/);
        assert.equal(replacements.userId, 17);
        return [
            ...Array.from({ length: 20 }, (_, index) => ({
                ...make_book(index + 1),
                reading_status: 'reading'
            })),
            ...Array.from({ length: 3 }, (_, index) => ({
                ...make_book(index + 30),
                reading_status: 'to_read'
            }))
        ];
    });

    const carousels = await service.get_reading_status_carousels(17);

    assert.equal(calls.length, 1);
    assert.equal(carousels.length, 2);
    assert.equal(carousels[0].libros.length, 20);
    assert.equal(carousels[1].libros.length, 3);
});

test('authors are ranked by separate positive-rating, favorite, and read evidence', async () => {
    const { service } = make_service((sql, { replacements }) => {
        assert.match(sql, /positive_rating_count DESC/);
        assert.match(sql, /favorite_count DESC/);
        assert.match(sql, /read_book_count DESC/);
        assert.match(sql, /review\.activo = 1/);
        assert.equal(replacements.userId, 4);
        return [
            { id: 1, nombre: 'Author 1' },
            { id: 2, nombre: 'Author 2' },
            { id: 3, nombre: 'Author 3' }
        ];
    });

    const carousel = await service.get_recommended_authors(4);

    assert.equal(carousel.kind, 'authors');
    assert.deepEqual(carousel.autores.map((author) => author.id), [1, 2, 3]);
});

test('more-from-author requires two read books and excludes already-read books', async () => {
    const { service, calls } = make_service((sql) => {
        if (sql.includes('HAVING COUNT(DISTINCT state.book_id) >= 2')) {
            return [{ id: 8, nombre: 'Author 8', read_book_count: 2 }];
        }

        assert.match(sql, /state\.reading_status = 'read'/);
        assert.match(sql, /candidate_books\.author_position <= :authorLimit/);
        return Array.from({ length: 5 }, (_, index) =>
            make_book(index + 10, { id_autor: 8, ranking: 5 - index })
        );
    });

    const carousel = await service.get_more_from_authors(12);

    assert.equal(calls.length, 2);
    assert.equal(carousel.libros.length, 5);
    assert.ok(carousel.libros.every((book) => book.id_autor === 8));
});

test('read-again carousel returns only eligible read and highly rated or favorite books', async () => {
    const { service, calls } = make_service((sql, { replacements }) => {
        assert.match(sql, /state\.reading_status = 'read'/);
        assert.match(sql, /state\.is_favorite = 1 OR rating\.puntuacion >= 4/);
        assert.equal(replacements.userId, 31);
        return Array.from({ length: 5 }, (_, index) =>
            make_book(index + 300, { puntuacion_usuario: 5 })
        );
    });

    const carousel = await service.get_read_again_carousel(31);

    assert.equal(calls.length, 1);
    assert.equal(carousel.id, 'volver-a-leerlo');
    assert.equal(carousel.title, 'Volver a leerlo');
    assert.equal(carousel.libros.length, 5);
});

test('random list selection reads only the authenticated user and preserves list order', async () => {
    const { service, calls } = make_service((sql, options, callIndex) => {
        if (callIndex === 1) {
            assert.match(sql, /WHERE id = :userId/);
            assert.equal(options.replacements.userId, 21);
            return [{
                id: 21,
                listas: JSON.stringify({
                    'Lista privada': { libros: [2, 2, 999, 1, 3], isPrivate: true },
                    'Lista vacía': { libros: [], isPrivate: false }
                })
            }];
        }

        assert.match(sql, /JSON_TABLE/);
        assert.match(sql, /STRAIGHT_JOIN `Libro` AS book FORCE INDEX \(PRIMARY\)/);
        assert.deepEqual(JSON.parse(options.replacements.bookIdsJson), [2, 999, 1, 3]);
        assert.equal(options.replacements.limit, 20);
        return [make_book(1), make_book(2), make_book(3)];
    }, { random: () => 0 });

    const carousel = await service.get_random_user_list(21);

    assert.equal(calls.length, 2);
    assert.equal(carousel.list_name, 'Lista privada');
    assert.deepEqual(carousel.libros.map((book) => book.id), [2, 1, 3]);
});

test('because-you-read uses a read high-rated source and indexed tag matching', async () => {
    const sources = [
        { id: 100, titulo: 'Source 100', tags: ['fantasy'], puntuacion_usuario: 5 },
        { id: 101, titulo: 'Source 101', tags: ['mystery'], puntuacion_usuario: 4 },
        { id: 102, titulo: 'Source 102', tags: ['history'], puntuacion_usuario: 5 }
    ];
    const candidates = [
        ...Array.from({ length: 4 }, (_, index) =>
            make_book(index + 200, { id_autor: 7 })
        ),
        make_book(204, { id_autor: 8 }),
        make_book(205, { id_autor: 9 })
    ];
    const { service, calls } = make_service((sql, { replacements }) => {
        if (sql.includes('FROM `Resenas_Libros` AS review')) {
            assert.match(sql, /state\.reading_status = 'read'/);
            assert.match(sql, /review\.puntuacion IN \(4, 5\)/);
            assert.equal(replacements.userId, 2);
            return sources;
        }

        assert.match(sql, /MEMBER OF\(matching_book\.tags\)/);
        assert.match(sql, /FORCE INDEX \(idx_libro_tags_mvi\)/);
        assert.match(sql, /book\.id <> :sourceBookId/);
        assert.match(sql, /state\.reading_status = 'read'/);
        return candidates;
    }, { now: () => new Date('2026-02-01T00:00:00.000Z') });

    const carousel = await service.get_because_read_carousel(2);

    assert.equal(calls.length, 2);
    assert.equal(carousel.kind, 'books');
    assert.equal(carousel.libros.length, 5);
    assert.equal(carousel.source_book.id, 100);
    assert.equal(carousel.libros.some((book) => book.id === 100), false);
    assert.equal(carousel.libros.filter((book) => book.id_autor === 7).length, 3);
});

test('does not present a contextual carousel when fewer than three similar books exist', async () => {
    const { service } = make_service((sql) => {
        if (sql.includes('FROM `Resenas_Libros` AS review')) {
            return [{
                id: 100,
                titulo: 'Source',
                tags: ['fantasy'],
                puntuacion_usuario: 5
            }];
        }
        return [make_book(200), make_book(201)];
    });

    assert.equal(await service.get_because_read_carousel(2), null);
});

test('rejects invalid authenticated user identifiers before querying', async () => {
    const { service, calls } = make_service(() => []);

    await assert.rejects(
        service.get_reading_status_carousels('1 OR 1=1'),
        /valid authenticated user id/
    );
    assert.equal(calls.length, 0);
});
