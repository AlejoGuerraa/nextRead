import api from './api';

export const getToken = () => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {
    // ignore browser storage failures
  }
};

export const logoutAndRedirect = (navigate) => {
  clearAuth();
  navigate('/acceso', { replace: true });
};

export const validateSession = async () => {
  try {
    const response = await api.get('/nextread/auth/me');
    const data = response.data;
    try {
      localStorage.setItem('user', JSON.stringify(data));
    } catch {
      // ignore storage failures
    }
    return data;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearAuth();
      throw new Error('unauthorized');
    }
    throw error;
  }
};
