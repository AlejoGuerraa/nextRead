const test = require('node:test');
const assert = require('node:assert/strict');
const {
    build_personalized_carousels,
    select_diverse_candidates
} = require('../services/recommendationCarouselService');

function candidate(id, overrides = {}) {
    return {
        id,
        titulo: `Book ${id}`,
        url_portada: `/covers/${id}.jpg`,
        position: id,
        score: 0.6,
        is_exploration: false,
        is_read: false,
        id_autor: id,
        nombre_autor: `Author ${id}`,
        anio: 1965,
        tipo: 'Novela',
        tema: 'Aventura',
        generos: ['Ficción'],
        tags: ['1960'],
        ranking: 4.2,
        read_count: id,
        ...overrides
    };
}

function get_carousel(carousels, id) {
    return carousels.find((carousel) => carousel.id === id);
}

test('Para vos enforces quality, read exclusion, author diversity, exploration share, and position stability', () => {
    const rows = Array.from({ length: 18 }, (_, index) => {
        const id = index + 1;
        return candidate(id, {
            id_autor: id <= 4 ? 1 : id,
            nombre_autor: id <= 4 ? 'Shared Author' : `Author ${id}`
        });
    });
    rows.push(...Array.from({ length: 5 }, (_, index) => {
        const id = index + 21;
        return candidate(id, { is_exploration: true });
    }));
    rows.push(
        candidate(26, { is_read: true }),
        candidate(27, { ranking: 3 }),
        candidate(28, { ranking: null })
    );

    const carousel = get_carousel(build_personalized_carousels(rows), 'para-vos');

    assert.equal(carousel.libros.length, 20);
    assert.equal(carousel.libros.filter(({ id }) => id >= 21 && id <= 25).length, 4);
    assert.equal(carousel.libros.some(({ id }) => [26, 27, 28].includes(id)), false);
    assert.deepEqual(
        carousel.libros.map(({ id }) => id),
        [...carousel.libros.map(({ id }) => id)].sort((left, right) => left - right)
    );
    assert.deepEqual(build_personalized_carousels(rows), build_personalized_carousels(rows));
    const authorCounts = carousel.libros
        .filter(({ id }) => id <= 4)
        .length;
    assert.equal(authorCounts, 3);
});

test('does not present a solely exploratory generation as personalized when preferences are absent', () => {
    const rows = Array.from({ length: 4 }, (_, index) =>
        candidate(index + 1, {
            score: 0,
            is_exploration: true
        })
    );

    const carousels = build_personalized_carousels(rows);

    assert.deepEqual(carousels, []);
});

test('groups only supported periods and combines accent/case variants without duplicate books', () => {
    const rows = [
        candidate(1, { generos: ['Ficción', 'ficcion', 'FICCIÓN'] }),
        candidate(2, { tipo: 'novela', generos: ['ficcion'] }),
        candidate(3, { tipo: 'NOVELA', generos: ['Ficción'] }),
        candidate(4, { tipo: 'Novela', generos: ['Ficción'] }),
        candidate(5, { anio: 1982, tags: ['1970'], tipo: '', generos: [] }),
        candidate(6, { anio: 0, tags: ['0'], tipo: '', generos: [] })
    ];

    const carousels = build_personalized_carousels(rows);
    const genre = get_carousel(carousels, 'genero-ficcion');
    const type = get_carousel(carousels, 'tipo-novela');
    const decade = get_carousel(carousels, 'epoca-1960s');
    const theme = get_carousel(carousels, 'tema-aventura');

    assert.ok(genre);
    assert.ok(type);
    assert.ok(decade);
    assert.ok(theme);
    assert.equal(genre.libros.length, 4);
    assert.equal(type.libros.length, 4);
    assert.equal(decade.libros.length, 4);
    assert.equal(decade.title, 'Libros del 1960 que te pueden atrapar');
    assert.equal(type.title, 'Nuestra selección de novelas');
    assert.equal(theme.title, 'Aventura');
    assert.equal(get_carousel(carousels, 'epoca-1980s'), undefined);
    assert.equal(get_carousel(carousels, 'epoca-0s'), undefined);
    assert.equal(new Set(genre.libros.map(({ id }) => id)).size, genre.libros.length);
});

test('Joyas uses compatibility, quality, and relative popularity and excludes read candidates', () => {
    const rows = Array.from({ length: 8 }, (_, index) => {
        const id = index + 1;
        return candidate(id, {
            score: id / 10,
            ranking: 3.5 + id / 10,
            read_count: id,
            is_read: id === 1
        });
    });

    const carousel = get_carousel(build_personalized_carousels(rows), 'joyas-por-descubrir');

    assert.ok(carousel);
    assert.equal(carousel.title, 'Joyas escondidas');
    assert.ok(carousel.libros.length >= 3);
    assert.ok(carousel.libros.length <= 20);
    assert.equal(carousel.libros.some(({ id }) => id === 1 || id > 5), false);
});

test('omits carousels that do not have enough eligible books', () => {
    const carousels = build_personalized_carousels([
        candidate(1, { is_read: true }),
        candidate(2, { ranking: null }),
        candidate(3, { tags: [], generos: [], tipo: '', tema: '' })
    ]);

    assert.deepEqual(carousels, []);
});

test('diversity selection limits repeated authors and duplicate candidates', () => {
    const selected = select_diverse_candidates([
        candidate(1, { id_autor: 5 }),
        candidate(1, { id_autor: 8 }),
        candidate(2, { id_autor: 5 }),
        candidate(3, { id_autor: 5 }),
        candidate(4, { id_autor: 5 }),
        candidate(5, { id_autor: 9 })
    ]);

    assert.deepEqual(selected.map(({ id }) => id), [1, 2, 3, 5]);
});
