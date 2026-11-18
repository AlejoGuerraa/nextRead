// Todos los endpoints de la API de NextRead usados por la app.
// Las rutas son exactamente las definidas en api/index.js
import api from './client';

const data = (promise) => promise.then((res) => res.data);
const enc = encodeURIComponent;

// ---------------------- AUTH ----------------------
export const authApi = {
  login: (correo, contrasena) => data(api.post('/nextread/login', { correo, contrasena })),
  register: (payload) => data(api.post('/nextread/register', payload)),
  me: () => data(api.get('/nextread/auth/me')),
  checkEmail: (correo) => data(api.get('/nextread/check-email', { params: { correo } })),
  checkUsername: (usuario) => data(api.get('/nextread/check-username', { params: { usuario } })),
  forgotPassword: (email) => data(api.post('/api/forgot-password', { email })),
};

// ---------------------- USUARIO ----------------------
export const usersApi = {
  getMe: () => data(api.get('/nextread/user')),
  editProfile: (payload) => data(api.patch('/nextread/user/editar', payload)),
  search: (q) => data(api.get('/nextread/buscar-usuario', { params: { q } })),
  getPublic: (id) => data(api.get(`/nextread/user/public/${id}`)),
  followers: (id) => data(api.get(`/nextread/user/${id}/seguidores`)),
  following: (id) => data(api.get(`/nextread/user/${id}/seguidos`)),
  follow: (id) => data(api.post(`/nextread/seguir/${id}`)),
  unfollow: (id) => data(api.post(`/nextread/dejar-seguir/${id}`)),
  changePassword: (currentPwd, newPwd) =>
    data(api.patch('/nextread/user/change-password', { currentPwd, newPwd })),
  changeEmailRequest: (newEmail) => data(api.post('/nextread/user/change-email-request', { newEmail })),
  deleteAccountRequest: () => data(api.post('/nextread/user/delete-account-request')),
  deleteAccountConfirm: (token) => data(api.post('/nextread/user/delete-account-confirm', { token })),
};

// ---------------------- CATÁLOGO ----------------------
export const catalogApi = {
  iconos: () => data(api.get('/nextread/iconos')),
  banners: () => data(api.get('/nextread/banners')),
  autores: () => data(api.get('/nextread/autores')),
  autor: (id, params = {}) => data(api.get(`/nextread/autor/${id}`, { params })),
};

// ---------------------- LIBROS ----------------------
export const booksApi = {
  all: () => data(api.get('/nextread/libros')),
  getById: (id) => data(api.get(`/nextread/libro/${id}`)),
  search: (search) => data(api.get('/nextread/buscar', { params: { search } })),
  trending: () => data(api.get('/nextread/tendencias')),
  globalCarousels: () => data(api.get('/nextread/carruseles/globales')),
  byDecade: () => data(api.get('/nextread/libros/por-decada')),
  personalizedCarousels: () => data(api.get('/nextread/recomendaciones/carruseles')),
  contextualCarousels: () => data(api.get('/nextread/recomendaciones/contextuales')),
  similar: (userId, bookId) => data(api.get(`/nextread/libros/recomendaciones/${userId}/${bookId}`)),
  // tipo: 'favoritos' | 'enLectura' | 'paraLeer' | 'leido'
  addToShelf: (tipo, bookId) => data(api.post(`/nextread/usuario/${tipo}/${bookId}`)),
  removeFromShelf: (tipo, bookId) => data(api.delete(`/nextread/usuario/${tipo}/${bookId}`)),
};

// ---------------------- RESEÑAS ----------------------
export const reviewsApi = {
  list: (bookId) => data(api.get(`/nextread/resenas/${bookId}`)),
  // { puntuacion?: 1-5, comentario?: string }
  save: (bookId, payload) => data(api.post(`/nextread/resena/${bookId}`, payload)),
  like: (reviewId) => data(api.post(`/nextread/resena/${reviewId}/like`)),
  unlike: (reviewId) => data(api.delete(`/nextread/resena/${reviewId}/like`)),
  reply: (reviewId, comentario) => data(api.post(`/nextread/resena/${reviewId}/respuestas`, { comentario })),
  remove: (reviewId) => data(api.delete(`/nextread/resena/${reviewId}`)),
};

// ---------------------- LISTAS PERSONALIZADAS ----------------------
export const listsApi = {
  create: (nombre, isPrivate = false) => data(api.post('/nextread/listas', { nombre, isPrivate })),
  addBook: (nombre, bookId) => data(api.post(`/nextread/listas/${enc(nombre)}/libro/${bookId}`, {})),
  removeBook: (nombre, bookId) => data(api.delete(`/nextread/listas/${enc(nombre)}/libro/${bookId}`)),
  update: (nombre, payload) => data(api.patch(`/nextread/listas/${enc(nombre)}`, payload)),
  remove: (nombre) => data(api.delete(`/nextread/listas/${enc(nombre)}`)),
};

// ---------------------- NOTIFICACIONES ----------------------
export const notificationsApi = {
  markAllRead: () => data(api.post('/nextread/notificaciones/marcar-leidas')),
  remove: (id) => data(api.delete(`/nextread/notificaciones/${id}`)),
  removeAll: () => data(api.delete('/nextread/notificaciones')),
};
