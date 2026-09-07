import api from './api';

export const markNotificationsAsRead = async () => {
  const response = await api.post('/nextread/notificaciones/marcar-leidas');
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await api.delete(`/nextread/notificaciones/${id}`);
  return response.data;
};

export const deleteAllNotifications = async () => {
  const response = await api.delete('/nextread/notificaciones');
  return response.data;
};

export const getPublicUserById = async (id) => {
  const response = await api.get(`/nextread/user/public/${id}`);
  return response.data;
};
