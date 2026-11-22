const MAX_CAROUSELS = 10;
const MAX_VARIABLE_CAROUSELS = 7;
const MAX_BOOKS_PER_CAROUSEL = 20;
const MAX_BOOKS_PER_AUTHOR = 3;
const MIN_CAROUSEL_ITEMS = 3;

function get_semantic_id(carousel) {
  if (typeof carousel.id === 'string' && carousel.id.trim()) return carousel.id.trim();
  return `carousel:${String(carousel.title || '')}`;
}

function normalize_group_key(value) {
  return String(value)
    .normalize('NFC')
    .trim()
    .toLocaleLowerCase('es');
}

function get_author_key(book) {
  const authorId = Number(book.id_autor);
  if (Number.isSafeInteger(authorId) && authorId > 0) return `id:${authorId}`;
  const authorName = normalize_group_key(book.nombre_autor || '');
  return authorName ? `name:${authorName}` : `unknown:${book.id}`;
}

function limit_books(books) {
  const seenIds = new Set();
  const authorCounts = new Map();
  const result = [];

  for (const book of Array.isArray(books) ? books : []) {
    if (!book) continue;
    const bookId = Number(book.id);
    if (Number.isSafeInteger(bookId) && seenIds.has(bookId)) continue;

    const authorKey = get_author_key(book);
    const authorCount = authorCounts.get(authorKey) || 0;
    if (authorCount >= MAX_BOOKS_PER_AUTHOR) continue;

    if (Number.isSafeInteger(bookId)) seenIds.add(bookId);
    authorCounts.set(authorKey, authorCount + 1);
    result.push(book);
    if (result.length >= MAX_BOOKS_PER_CAROUSEL) break;
  }

  return result;
}

function normalize_carousel(carousel) {
  if (!carousel || typeof carousel !== 'object') return null;

  if (carousel.kind === 'authors') {
    const authors = (Array.isArray(carousel.authors) ? carousel.authors : [])
      .filter((author) => author && Number.isSafeInteger(Number(author.id)));
    if (authors.length < MIN_CAROUSEL_ITEMS) return null;
    return { ...carousel, authors };
  }

  const books = limit_books(carousel.books);
  if (books.length < MIN_CAROUSEL_ITEMS) return null;
  return { ...carousel, books };
}

function hash_seed(value) {
  const text = String(value || 'home');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rank_candidates(candidates, seed) {
  const base = hash_seed(seed);
  return candidates
    .map((carousel, index) => {
      const id = get_semantic_id(carousel);
      let hash = base;
      for (let characterIndex = 0; characterIndex < id.length; characterIndex += 1) {
        hash ^= id.charCodeAt(characterIndex);
        hash = Math.imul(hash, 16777619);
      }
      return { carousel, rank: (hash + index) >>> 0 };
    })
    .sort((left, right) => left.rank - right.rank || get_semantic_id(left.carousel).localeCompare(get_semantic_id(right.carousel)));
}

export function compose_home_carousels({
  globalCarousels = [],
  personalizedCarousels = [],
  contextualCarousels = [],
  publicDecadeCarousels = [],
  userId,
  recommendationStatus,
  selectionSeed,
}) {
  const normalizedGlobal = globalCarousels.map(normalize_carousel).filter(Boolean);
  const normalizedPersonalized = personalizedCarousels.map(normalize_carousel).filter(Boolean);
  const normalizedContextual = contextualCarousels.map(normalize_carousel).filter(Boolean);
  const normalizedDecades = publicDecadeCarousels.map(normalize_carousel).filter(Boolean);

  const fixed = [];
  if (userId && recommendationStatus === 'ready') {
    const forYou = normalizedPersonalized.find((carousel) => get_semantic_id(carousel) === 'para-vos');
    if (forYou) fixed.push(forYou);
  }

  if (userId) {
    const following = normalizedContextual.find((carousel) => get_semantic_id(carousel) === 'seguir-leyendo');
    if (following) fixed.push(following);
  }

  const fixedIds = new Set(fixed.map(get_semantic_id));
  const variableCandidates = [];
  const variableIds = new Set();

  const add_variable = (carousel) => {
    if (!carousel) return;
    const id = get_semantic_id(carousel);
    if (fixedIds.has(id) || variableIds.has(id)) return;
    variableIds.add(id);
    variableCandidates.push(carousel);
  };

  for (const carousel of normalizedGlobal) add_variable(carousel);

  if (userId) {
    if (recommendationStatus === 'ready') {
      for (const carousel of normalizedPersonalized) add_variable(carousel);
    }
    for (const carousel of normalizedContextual) add_variable(carousel);
  } else {
    for (const carousel of normalizedDecades) add_variable(carousel);
  }

  const seed = selectionSeed || (userId ? `user:${userId}` : 'visitor');
  const variables = rank_candidates(variableCandidates, seed)
    .slice(0, MAX_VARIABLE_CAROUSELS)
    .map(({ carousel }) => carousel);

  return [...fixed, ...variables].slice(0, MAX_CAROUSELS);
}
