import api from './api';

export const createList = async (nombre) => {
  const response = await api.post('/nextread/listas', { nombre });
  return response.data;
};

export const addBookToList = async (listName, bookId) => {
  const response = await api.post(`/nextread/listas/${encodeURIComponent(listName)}/libro/${bookId}`, {});
  return response.data;
};
