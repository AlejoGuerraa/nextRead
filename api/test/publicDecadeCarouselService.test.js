const assert = require('node:assert/strict');
const test = require('node:test');
const {
    MAX_BOOKS_PER_DECADE,
    MAX_DECADE_GROUPS,
    create_public_decade_carousel_service
} = require('../services/publicDecadeCarouselService');

function create_rows(start, displayedCount, totalCount) {
    return Array.from({ length: displayedCount }, (_, index) => ({
        id: start + index,
        titulo: `Book ${start + index}`,
        anio: start + 9 - Math.floor(index / 10),
        url_portada: null,
        ranking: '4.8',
        id_autor: 7,
        author_id: 7,
        author_name: 'Author',
        author_face: null,
        decade_start: start,
        decade_count: totalCount
    }));
}

test('limits public decade results in SQL while retaining complete group counts', async () => {
    let queryOptions;
    const sequelize = {
        async query(sql, options) {
            queryOptions = { sql, options };
            return [
                ...create_rows(2020, MAX_BOOKS_PER_DECADE, 26),
                ...create_rows(2010, MAX_BOOKS_PER_DECADE, 24)
            ];
        }
    };
    const service = create_public_decade_carousel_service({ sequelize });

    const decades = await service.get_decades();

    assert.equal(decades.length, 2);
    assert.deepEqual(decades.map(({ count, libros }) => [count, libros.length]), [
        [26, MAX_BOOKS_PER_DECADE],
        [24, MAX_BOOKS_PER_DECADE]
    ]);
    assert.equal(decades[0].libros[0].Autor.nombre, 'Author');
    assert.equal(decades[0].libros[0].ranking, 4);
    assert.match(queryOptions.sql, /ROW_NUMBER\(\) OVER/);
    assert.match(queryOptions.sql, /WHERE decade_position <= :maxBooks/);
    assert.deepEqual(queryOptions.options.replacements, {
        requestedDecade: null,
        maxDecades: MAX_DECADE_GROUPS,
        maxBooks: MAX_BOOKS_PER_DECADE
    });
});

test('uses the requested decade range and returns only its bounded group', async () => {
    let queryOptions;
    const sequelize = {
        async query(_sql, options) {
            queryOptions = options;
            return create_rows(1965, 1, 1);
        }
    };
    const service = create_public_decade_carousel_service({ sequelize });

    const decades = await service.get_decades(1965);

    assert.equal(decades.length, 1);
    assert.equal(decades[0].decade, '1965s');
    assert.deepEqual(queryOptions.replacements, {
        requestedDecade: 1965,
        maxDecades: 1,
        maxBooks: MAX_BOOKS_PER_DECADE
    });
});

test('rejects invalid decade input before querying', async () => {
    let didQuery = false;
    const service = create_public_decade_carousel_service({
        sequelize: {
            async query() {
                didQuery = true;
                return [];
            }
        }
    });

    await assert.rejects(service.get_decades('1960'), /Requested decade must be/);
    assert.equal(didQuery, false);
});
