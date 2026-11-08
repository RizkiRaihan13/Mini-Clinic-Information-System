import axios, { AxiosError } from 'axios';
import { dispatchLocalApi, resetDemoDb } from './localClinicDb';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const USE_REMOTE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

const localAdapter = async (config) => {
  const result = dispatchLocalApi({
    method: config.method || 'GET',
    url: config.url || '/',
    params: config.params || {},
    data: config.data,
    headers: config.headers || {},
  });

  const response = {
    data: result.body,
    status: result.status,
    statusText: result.status >= 200 && result.status < 300 ? 'OK' : 'Error',
    headers: { 'content-type': 'application/json' },
    config,
  };

  if (result.status >= 200 && result.status < 300) {
    return response;
  }

  throw new AxiosError(
    result.body?.message || `Request failed with status code ${result.status}`,
    result.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    null,
    response
  );
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  ...(USE_REMOTE_BACKEND ? {} : { adapter: localAdapter }),
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clinic_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global 401 token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('clinic_token');
      localStorage.removeItem('clinic_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { resetDemoDb };
export default api;
