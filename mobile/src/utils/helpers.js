import { ASSETS_URL } from '../config';
import { colors } from '../theme';

/** Convierte "/portadasLibros/Cortazar/Rayuela.jpg" en una URL absoluta */
export function assetUrl(path) {
  if (!path || typeof path !== 'string') return null;
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${ASSETS_URL}${encodeURI(clean)}`;
}

export const bookCover = (book) => assetUrl(book?.url_portada || book?.portada);

export const authorName = (book) => book?.Autor?.nombre || book?.nombre_autor || 'Autor desconocido';

export const userAvatar = (user) => assetUrl(user?.iconoData?.simbolo || user?.icono);

export const userBanner = (user) => assetUrl(user?.bannerData?.url || user?.banner);

export function pastelFor(seed) {
  const n = Math.abs(Number(seed) || String(seed || '').length);
  return colors.pastels[n % colors.pastels.length];
}

export function parseList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const idOf = (item) => (item && typeof item === 'object' ? item.id ?? item.id_libro ?? item.book_id : item);

export const isBookIn = (books, bookId) =>
  Array.isArray(books) && books.some((b) => Number(idOf(b)) === Number(bookId));

/** Listas personalizadas: { nombre: { libros: [...], isPrivate } } → array */
export function customListsToArray(listas) {
  if (!listas || typeof listas !== 'object') return [];
  if (Array.isArray(listas)) return listas;
  return Object.entries(listas).map(([nombre, entry]) => ({
    nombre,
    libros: Array.isArray(entry) ? entry : entry?.libros || [],
    isPrivate: Boolean(entry?.isPrivate),
  }));
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeAgo(value) {
  const d = new Date(value);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (!Number.isFinite(diff)) return '';
  if (diff < 60) return 'recién';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`;
  return formatDate(value);
}

export const ratingValue = (book) => {
  const r = Number(book?.average_rating ?? book?.ranking ?? 0);
  return Number.isFinite(r) ? Math.round(r * 10) / 10 : 0;
};

// Géneros que más aparecen en el catálogo real (api/data/libros)
export const GENEROS = [
  'Aventura', 'Fantasía', 'Fantasía oscura', 'Sobrenatural', 'Acción', 'Drama', 'Romance',
  'Terror', 'Misterio', 'Thriller', 'Policial', 'Psicológico', 'Histórico', 'Épico',
  'Artes marciales', 'Ciencia Ficción', 'Clásico', 'Comedia', 'Humor negro',
  'Recuentos de la vida', 'Realismo Mágico', 'Filosófico', 'Existencialismo', 'Gótico',
  'Absurdo', 'Poesía', 'Teatro', 'Cuento', 'Ensayo', 'Manga',
];

/** "Terror, Fantasía" → ['Terror', 'Fantasía'] (así se guardan varios gustos en un campo) */
export const splitTastes = (value) =>
  String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
