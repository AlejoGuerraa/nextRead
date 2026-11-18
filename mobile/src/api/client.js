import axios from 'axios';
import { API_URL } from '../config';

// El token se guarda en memoria (lo setea AuthContext al iniciar / loguear)
let authToken = null;
let onUnauthorized = null;

export const setAuthToken = (token) => {
  authToken = token || null;
};

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    // 401 con token = sesión vencida → cerrar sesión
    if (status === 401 && authToken && typeof onUnauthorized === 'function') {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

/** Mensaje legible a partir de un error de axios */
export function getErrorMessage(error, fallback = 'Ocurrió un error. Intentá de nuevo.') {
  if (!error) return fallback;
  if (error.code === 'ECONNABORTED') return 'La API tardó demasiado en responder.';
  if (!error.response) {
    return `No se pudo conectar con la API (${API_URL}). ¿Está corriendo y estás en la misma red WiFi?`;
  }
  const data = error.response.data || {};
  return data.error || data.message || data.msg || fallback;
}

export default api;
