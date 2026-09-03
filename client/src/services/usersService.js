import api from './api';

export const getCurrentUser = async () => {
  const response = await api.get('/nextread/user');
  return response.data;
};

export const searchUsersByUsername = async (username) => {
  const response = await api.get(`/nextread/buscar-usuario?q=${encodeURIComponent(username)}`);
  return response.data;
};

export const getUserFollowers = async (userId) => {
  const response = await api.get(`/nextread/user/${userId}/seguidores`);
  return response.data;
};

export const getUserFollowed = async (userId) => {
  const response = await api.get(`/nextread/user/${userId}/seguidos`);
  return response.data;
};

export const followUser = async (userId) => {
  const response = await api.post(`/nextread/seguir/${userId}`);
  return response.data;
};

export const unfollowUser = async (userId) => {
  const response = await api.post(`/nextread/dejar-seguir/${userId}`);
  return response.data;
};
