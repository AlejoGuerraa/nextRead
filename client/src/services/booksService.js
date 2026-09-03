import api from './api';

export const getTrendingBooks = async (params = {}) => {
  const response = await api.get('/nextread/tendencias', { params });
  return response.data;
};

export const getBooksByDecade = async () => {
  const response = await api.get('/nextread/libros/por-decada');
  return response.data;
};

export const getDecadesPersonalizadas = async (email) => {
  const response = await api.post('/nextread/decadas-personalizadas', { email });
  return response.data;
};

export const getAuthorMostRead = async (email) => {
  const response = await api.post('/nextread/autorMasLeido', { email });
  return response.data;
};

export const getBooksByUserGenre = async (userId) => {
  const response = await api.get(`/nextread/libros/genero-usuario/${userId}`);
  return response.data;
};

export const getBookById = async (id) => {
  const response = await api.get(`/nextread/libro/${id}`);
  return response.data;
};

export const getRecommendationsForBook = async (userId, bookId) => {
  const response = await api.get(`/nextread/libros/recomendaciones/${userId}/${bookId}`);
  return response.data;
};
