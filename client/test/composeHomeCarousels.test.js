import assert from 'node:assert/strict';
import test from 'node:test';
import { compose_home_carousels } from '../src/hooks/composeHomeCarousels.js';

const globalCarousels = [{ id: 'most-read', books: [{ id: 1 }] }];
const personalizedCarousels = [{ id: 'for-you', books: [{ id: 2 }] }];
const contextualCarousels = [{ id: 'authors', kind: 'authors', authors: [{ id: 3 }] }];
const publicDecadeCarousels = [{ id: 'decade-2000', books: [{ id: 4 }] }];

test('composes authenticated sources in stable order and omits empty rows', () => {
  const carousels = compose_home_carousels({
    globalCarousels,
    personalizedCarousels: [...personalizedCarousels, { id: 'empty', books: [] }],
    contextualCarousels,
    publicDecadeCarousels,
    userId: 7,
    recommendationStatus: 'ready',
  });

  assert.deepEqual(carousels.map(({ id }) => id), ['most-read', 'for-you', 'authors']);
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

  assert.deepEqual(carousels.map(({ id }) => id), ['most-read', 'authors']);
});

test('preserves successful sources when personalized recommendations fail', () => {
  const carousels = compose_home_carousels({
    globalCarousels: [],
    contextualCarousels,
    userId: 7,
    recommendationStatus: 'error',
  });

  assert.deepEqual(carousels.map(({ id }) => id), ['authors']);
});

test('composes public decades for visitors without exposing user carousels', () => {
  const carousels = compose_home_carousels({
    globalCarousels,
    personalizedCarousels,
    contextualCarousels,
    publicDecadeCarousels,
    recommendationStatus: 'ready',
  });

  assert.deepEqual(carousels.map(({ id }) => id), ['most-read', 'decade-2000']);
});
