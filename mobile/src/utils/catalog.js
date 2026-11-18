// Catálogo completo (GET /nextread/libros) en memoria + "algoritmos" de recomendación
// que corren en el celular a partir de tu perfil. Se usa en Inicio, Búsqueda y Descubrir.
import { booksApi, catalogApi } from '../api/endpoints';
import { customListsToArray, parseList, splitTastes } from './helpers';

let cache = null;
let pending = null;

/** "Fantasía Oscura" → "fantasia oscura" (sin tildes ni mayúsculas) */
export const norm = (v) =>
  String(v || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** "Chainsaw Man - 3" → { serie: 'Chainsaw Man', tomo: 3 } */
export function seriesOf(book) {
  const m = String(book?.titulo || '').match(/^(.*?)\s*-\s*(\d+)\s*$/);
  return m ? { serie: m[1].trim(), tomo: Number(m[2]) } : { serie: book?.titulo || '', tomo: 0 };
}

export async function getCatalog(force = false) {
  if (cache && !force) return cache;
  if (pending) return pending;
  pending = (async () => {
    const [books, authors] = await Promise.all([booksApi.all(), catalogApi.autores().catch(() => [])]);
    const authorById = new Map((authors || []).map((a) => [Number(a.id), a]));
    const list = (Array.isArray(books) ? books : []).map((b) => {
      const generos = parseList(b.generos);
      const tags = parseList(b.tags);
      return {
        ...b,
        generos,
        tags,
        Autor: b.Autor || authorById.get(Number(b.id_autor)) || null,
        _keys: new Set([...generos, ...tags, b.tipo].map(norm)),
        _serie: seriesOf(b),
      };
    });
    cache = { books: list, authors: authors || [], authorById };
    pending = null;
    return cache;
  })().catch((e) => {
    pending = null;
    throw e;
  });
  return pending;
}

export const isManga = (b) => norm(b.tipo) === 'manga';

/** Deja un solo tomo por serie (el primero que haya) para no llenar todo de Chainsaw Man */
export function onePerSeries(books) {
  const seen = new Set();
  return books.filter((b) => {
    const key = norm(b._serie?.serie || b.titulo);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const byRanking = (a, b) => Number(b.ranking || 0) - Number(a.ranking || 0);

/** Mezcla estable por día: cambia todos los días pero no en cada render */
export function dailyShuffle(list, salt = 0) {
  const day = Math.floor(Date.now() / 86400000) + salt;
  return [...list]
    .map((item, i) => ({ item, k: Math.sin((Number(item.id) || i) * 9301 + day * 49297) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.item);
}

export const matchesGenre = (book, genre) => {
  const g = norm(genre);
  if (book._keys.has(g)) return true;
  // "Fantasía" también matchea "Fantasía oscura"
  for (const k of book._keys) if (k.includes(g)) return true;
  return false;
};

/** Ids de todos los libros con los que el usuario ya interactuó */
export function interactedIds(profile) {
  if (!profile) return new Set();
  const ids = [
    ...(profile.libros_leidos || []),
    ...(profile.libros_favoritos || []),
    ...(profile.libros_en_lectura || []),
    ...(profile.libros_para_leer || []),
    ...customListsToArray(profile.listas).flatMap((l) => l.libros),
  ].map((b) => Number(typeof b === 'object' ? b?.id : b));
  return new Set(ids.filter(Number.isFinite));
}

/** Géneros y autores que le gustan al usuario: lo que eligió + lo que más lee */
export function userTastes(profile, catalog) {
  const genres = splitTastes(profile?.genero_preferido);
  const authors = splitTastes(profile?.autor_preferido);
  const liked = [...(profile?.libros_favoritos || []), ...(profile?.libros_leidos || [])];

  const genreCount = new Map();
  const authorCount = new Map();
  liked.forEach((b) => {
    const full = catalog.books.find((x) => Number(x.id) === Number(b.id)) || b;
    parseList(full.generos).forEach((g) => genreCount.set(g, (genreCount.get(g) || 0) + 1));
    const name = full.Autor?.nombre || b.nombre_autor;
    if (name) authorCount.set(name, (authorCount.get(name) || 0) + 1);
  });
  const topGenres = [...genreCount.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  const topAuthors = [...authorCount.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a);

  const uniq = (arr) => {
    const seen = new Set();
    return arr.filter((x) => {
      const k = norm(x);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };
  return { genres: uniq([...genres, ...topGenres]), authors: uniq([...authors, ...topAuthors]) };
}

const take = (list, n = 15) => list.slice(0, n);

/**
 * Arma carruseles extra para Inicio. Cada uno: { id, title, subtitle?, books }
 */
export function buildLocalCarousels(catalog, profile) {
  const seen = interactedIds(profile);
  const fresh = catalog.books.filter((b) => !seen.has(Number(b.id)));
  const out = [];

  if (profile) {
    const tastes = userTastes(profile, catalog);

    tastes.genres.slice(0, 3).forEach((g, i) => {
      const books = onePerSeries(dailyShuffle(fresh.filter((b) => matchesGenre(b, g)).sort(byRanking).slice(0, 30), i));
      if (books.length >= 3) out.push({ id: `genero-${norm(g)}`, title: `Porque te gusta ${g.toLowerCase()}`, books: take(books) });
    });

    tastes.authors.slice(0, 2).forEach((name) => {
      const books = onePerSeries(fresh.filter((b) => norm(b.Autor?.nombre) === norm(name)).sort(byRanking));
      if (books.length >= 2) out.push({ id: `autor-${norm(name)}`, title: `Más de ${name}`, books: take(books) });
    });

    // Década favorita según lo que leíste
    const decades = new Map();
    (profile.libros_leidos || []).forEach((b) => {
      const y = Number(b.anio);
      if (y > 0) decades.set(Math.floor(y / 10) * 10, (decades.get(Math.floor(y / 10) * 10) || 0) + 1);
    });
    const topDecade = [...decades.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topDecade) {
      const books = onePerSeries(fresh.filter((b) => Math.floor(Number(b.anio) / 10) * 10 === topDecade).sort(byRanking));
      if (books.length >= 3) out.push({ id: `decada-fav`, title: `Tu década: los ${String(topDecade).slice(2)}`, books: take(books) });
    }
  }

  return out;
}

/** Carruseles de "Explorar" (para todos, también invitados) */
export function buildExploreCarousels(catalog, profile) {
  const seen = interactedIds(profile);
  const fresh = catalog.books.filter((b) => !seen.has(Number(b.id)));
  const nonManga = fresh.filter((b) => !isManga(b));
  return [
    { id: 'mejor-valorados', title: 'Los mejor valorados', books: take(onePerSeries([...fresh].sort(byRanking))) },
    { id: 'mangas', title: 'Mangas para empezar', subtitle: 'El primer tomo de cada serie', books: take(onePerSeries(fresh.filter(isManga).sort((a, b) => a._serie.tomo - b._serie.tomo)).sort(byRanking)) },
    { id: 'clasicos', title: 'Clásicos que no te podés perder', books: take(nonManga.filter((b) => Number(b.anio) < 1950).sort(byRanking)) },
    { id: 'cortos', title: 'Para leer en una tarde', subtitle: 'Cuentos, poesía, teatro y novelas cortas', books: take(dailyShuffle(nonManga.filter((b) => ['cuento', 'novela corta', 'poesia', 'teatro'].includes(norm(b.tipo))))) },
    { id: 'joyas', title: 'Joyas para descubrir', subtitle: 'Una selección distinta cada día', books: take(onePerSeries(dailyShuffle(fresh.filter((b) => Number(b.ranking) >= 4), 7))) },
    { id: 'modernos', title: 'Publicados desde el 2000', books: take(onePerSeries(fresh.filter((b) => Number(b.anio) >= 2000).sort(byRanking))) },
  ].filter((c) => c.books.length >= 3);
}

// Categorías de la pantalla de búsqueda
export const CATEGORIES = [
  { key: 'populares', title: 'Lo más popular', icon: 'flame', color: '#1A374D', filter: () => true, sort: 'ranking' },
  { key: 'mangas', title: 'Mangas', icon: 'flash', color: '#5A6FA8', filter: isManga },
  { key: 'novelas', title: 'Novelas', icon: 'book', color: '#406882', filter: (b) => ['novela'].includes(norm(b.tipo)) },
  { key: 'cortos', title: 'Cuentos y novelas cortas', icon: 'reader', color: '#3C8D7A', filter: (b) => ['cuento', 'novela corta'].includes(norm(b.tipo)) },
  { key: 'poesia', title: 'Poesía y teatro', icon: 'musical-notes', color: '#C27A9B', filter: (b) => ['poesia', 'teatro'].includes(norm(b.tipo)) },
  { key: 'ensayos', title: 'Ensayos, memorias y reportajes', icon: 'newspaper', color: '#6998AB', filter: (b) => ['ensayo', 'memorias', 'reportaje'].includes(norm(b.tipo)) },
  { key: 'clasicos', title: 'Clásicos (antes de 1950)', icon: 'library', color: '#2F5670', filter: (b) => !isManga(b) && Number(b.anio) < 1950 },
  { key: 'terror', title: 'Terror y suspenso', icon: 'skull', color: '#33475B', filter: (b) => ['terror', 'thriller', 'misterio', 'policial', 'horror'].some((g) => matchesGenre(b, g)) },
  { key: 'fantasia', title: 'Fantasía y aventura', icon: 'planet', color: '#4F8FA0', filter: (b) => ['fantasia', 'aventura', 'sobrenatural', 'ciencia ficcion'].some((g) => matchesGenre(b, g)) },
  { key: 'romance', title: 'Romance y drama', icon: 'heart', color: '#D9779F', filter: (b) => ['romance', 'drama', 'amor'].some((g) => matchesGenre(b, g)) },
];
