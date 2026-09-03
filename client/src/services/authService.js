import api from './api';

export const getToken = () => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

export const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

export const storeAuthSession = (user, token) => {
  try {
    if (token) {
      localStorage.setItem('token', token);
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  } catch {
    // ignore browser storage failures
  }

  return user;
};

export const clearAuth = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {
    // ignore browser storage failures
  }
};

export const loginUser = async (credentials) => {
  const response = await api.post('/nextread/login', credentials);
  const payload = response?.data ?? {};

  if (payload?.token) {
    const normalizedUser = {
      ...(payload || {}),
      ...(credentials?.correo ? { correo: credentials.correo } : {}),
    };

    storeAuthSession(normalizedUser, payload.token);
  }

  return response;
};

export const logoutAndRedirect = (navigate) => {
  clearAuth();
  navigate('/acceso', { replace: true });
};

export const validateSession = async () => {
  try {
    const response = await api.get('/nextread/auth/me');
    const data = response.data;
    storeAuthSession(data, getToken());
    return data;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearAuth();
      throw new Error('unauthorized');
    }
    throw error;
  }
};
