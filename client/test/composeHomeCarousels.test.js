import assert from 'node:assert/strict';
import test from 'node:test';
import { compose_home_carousels } from '../src/hooks/composeHomeCarousels.js';

const make_books = (start, count = 3) => Array.from(
  { length: count },
  (_, index) => ({ id: start + index, id_autor: 100, nombre_autor: 'Author' }),
);
const globalCarousels = [{ id: 'most-read', books: make_books(1) }];
const personalizedCarousels = [{ id: 'para-vos', books: make_books(10) }];
const contextualCarousels = [
  { id: 'seguir-leyendo', title: 'Seguir leyendo', books: make_books(5) },
  { id: 'para-leer', title: 'Para leer', books: make_books(7) },
  { id: 'autores', kind: 'authors', authors: [{ id: 1 }, { id: 2 }, { id: 3 }] },
];
const publicDecadeCarousels = [{ id: 'decade-2000', books: make_books(20) }];

test('composes fixed authenticated sources in required order and omits empty rows', () => {
  const carousels = compose_home_carousels({
    globalCarousels,
    personalizedCarousels: [...personalizedCarousels, { id: 'empty', books: [] }],
    contextualCarousels,
    publicDecadeCarousels,
    userId: 7,
    recommendationStatus: 'ready',
  });

  assert.deepEqual(carousels.slice(0, 2).map(({ id }) => id), ['para-vos', 'seguir-leyendo']);
  assert.equal(carousels.filter(({ id }) => id === 'most-read').length <= 1, true);
});

test('keeps global and contextual content while an initial generation is pending', () => {
  const carousels = compose_home_carousels({
    globalCarousels,
    personalizedCarousels,
    contextualCarousels,
    publicDecadeCarousels,
    userId: 7,
    recommendationStatus: 'pending',
  });

  assert.equal(carousels.slice(0, 1)[0].id, 'seguir-leyendo');
  assert.ok(!carousels.some(({ id }) => id === 'para-vos'));
});

test('preserves successful sources when personalized recommendations fail', () => {
  const carousels = compose_home_carousels({
    globalCarousels: [],
    contextualCarousels,
    userId: 7,
    recommendationStatus: 'error',
  });

  assert.deepEqual(carousels.map(({ id }) => id), ['seguir-leyendo', 'para-leer', 'autores']);
});

test('composes public decades for visitors without exposing user carousels', () => {
  const carousels = compose_home_carousels({
    globalCarousels,
    personalizedCarousels,
    contextualCarousels,
    publicDecadeCarousels,
    recommendationStatus: 'ready',
  });

  assert.equal(carousels.some(({ id }) => id === 'decade-2000'), true);
  assert.equal(carousels.filter(({ id }) => id === 'most-read').length <= 1, true);
});

test('keeps eligible contextual authors and book lists in variable candidates', () => {
  const carousels = compose_home_carousels({
    globalCarousels: [],
    personalizedCarousels: [],
    contextualCarousels: [
      { id: 'autores', kind: 'authors', title: 'Autores para vos', authors: [{ id: 1 }, { id: 2 }, { id: 3 }] },
      { id: 'de-lista', kind: 'books', title: 'De tu lista', books: make_books(40) },
      { id: 'volver-a-leerlo', kind: 'books', title: 'Volver a leerlo', books: make_books(50) },
      { id: 'porque-leiste', kind: 'books', title: 'Porque leiste', books: make_books(60) }
    ],
    userId: 7,
    recommendationStatus: 'ready',
    selectionSeed: 'contextual-test',
  });

  const ids = carousels.map(({ id }) => id);
  assert.ok(ids.includes('seguir-leyendo') === false);
  assert.equal(ids.includes('autores'), true);
  assert.equal(ids.includes('de-lista'), true);
  assert.equal(ids.includes('volver-a-leerlo'), true);
  assert.equal(ids.includes('porque-leiste'), true);
});

test('limits the final result to ten and variables to seven', () => {
  const variables = Array.from({ length: 12 }, (_, index) => ({
    id: `genre-${index}`,
    title: `Genre ${index}`,
    books: make_books(index * 100, 3),
  }));
  const carousels = compose_home_carousels({
    globalCarousels: [],
    personalizedCarousels: variables,
    contextualCarousels: [],
    userId: 7,
    recommendationStatus: 'ready',
    selectionSeed: 'stable-test-seed',
  });

  assert.ok(carousels.length <= 10);
  assert.equal(new Set(carousels.map(({ id }) => id)).size, carousels.length);
});

test('keeps one carousel per semantic identity and stable for one seed', () => {
  const candidates = [
    { id: 'genre-horror', title: 'Horror', books: make_books(1) },
    { id: 'genre-horror', title: 'Horror duplicate', books: make_books(20) },
    { id: 'epoca-1990', title: 'Epoca', books: make_books(30) },
  ];
  const first = compose_home_carousels({
    personalizedCarousels: candidates,
    userId: 7,
    recommendationStatus: 'ready',
    selectionSeed: 'visit-42',
  });
  const second = compose_home_carousels({
    personalizedCarousels: candidates,
    userId: 7,
    recommendationStatus: 'ready',
    selectionSeed: 'visit-42',
  });

  assert.deepEqual(first.map(({ id }) => id), second.map(({ id }) => id));
  assert.equal(first.filter(({ id }) => id === 'genre-horror').length, 1);
});

test('limits duplicate books and author concentration within a carousel', () => {
  const books = [
    { id: 1, id_autor: 10, nombre_autor: 'One' },
    { id: 1, id_autor: 10, nombre_autor: 'One' },
    ...Array.from({ length: 8 }, (_, index) => ({
      id: index + 2,
      id_autor: 10,
      nombre_autor: 'One',
    })),
  ];
  const carousels = compose_home_carousels({
    personalizedCarousels: [{ id: 'para-vos', title: 'Para vos', books }],
    userId: 7,
    recommendationStatus: 'ready',
  });

  const forYou = carousels.find(({ id }) => id === 'para-vos');
  assert.ok(forYou);
  assert.ok(forYou.books.length <= 20);
  assert.equal(new Set(forYou.books.map(({ id }) => id)).size, forYou.books.length);
  assert.ok(forYou.books.every((book) => Number(book.id_autor) === 10) === true);
  assert.equal(forYou.books.length, 3);
});
