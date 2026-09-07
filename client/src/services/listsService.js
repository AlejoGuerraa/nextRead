import api from './api';

export const createList = async (nombre) => {
  const response = await api.post('/nextread/listas', { nombre });
  return response.data;
};

export const addBookToList = async (listName, bookId) => {
  const response = await api.post(`/nextread/listas/${encodeURIComponent(listName)}/libro/${bookId}`, {});
  return response.data;
};

export const renameList = async (listName, newName) => {
  const response = await api.patch(`/nextread/listas/${encodeURIComponent(listName)}`, { nombre: newName });
  return response.data;
};

export const deleteList = async (listName) => {
  const response = await api.delete(`/nextread/listas/${encodeURIComponent(listName)}`);
  return response.data;
};

export const removeBookFromList = async (listName, bookId) => {
  const response = await api.delete(`/nextread/listas/${encodeURIComponent(listName)}/libro/${bookId}`);
  return response.data;
};
