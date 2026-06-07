import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/config/api';

const PUBLIC_PATH_PREFIXES = [
  '/gallery/',
  '/guest/',
  '/gallery-showcase',
  '/help',
  '/terms',
  '/login',
  '/register',
  '/affiliate/login',
  '/review',
  '/coupon',
];

const isOnPublicPath = () => {
  const path = window.location.pathname;
  if (path === '/') return true;
  return PUBLIC_PATH_PREFIXES.some((p) => path === p || path.startsWith(p));
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload?.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

let isHandlingExpiry = false;

const clearAuthAndRedirect = () => {
  if (isHandlingExpiry) return;
  isHandlingExpiry = true;

  localStorage.removeItem('token');
  localStorage.removeItem('user-storage');

  try {
    const stored = localStorage.getItem('user-storage');
    if (stored) localStorage.removeItem('user-storage');
  } catch {}

  if (!isOnPublicPath()) {
    window.location.replace('/login');
  } else {
    setTimeout(() => {
      isHandlingExpiry = false;
    }, 1000);
  }
};

const attachAuthHeader = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (!token) return config;

  if (isTokenExpired(token)) {
    clearAuthAndRedirect();
    return Promise.reject(
      new axios.Cancel('Token expired')
    ) as unknown as InternalAxiosRequestConfig;
  }

  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${token}`;
  return config;
};

const handleResponseError = (error: AxiosError) => {
  if (axios.isCancel(error)) return Promise.reject(error);
  if (error.response?.status === 401) {
    clearAuthAndRedirect();
  }
  return Promise.reject(error);
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(attachAuthHeader);
api.interceptors.response.use((response) => response, handleResponseError);

export const apiFormData = axios.create({
  baseURL: API_BASE_URL,
});

apiFormData.interceptors.request.use(attachAuthHeader);
apiFormData.interceptors.response.use((response) => response, handleResponseError);

const attachAffiliateAuthHeader = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('affiliate-token');
  if (!token) return config;
  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${token}`;
  return config;
};

export const affiliateApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

affiliateApiClient.interceptors.request.use(attachAffiliateAuthHeader);
affiliateApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('affiliate-token');
        localStorage.removeItem('affiliate-storage');
      } catch {}
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/affiliate/login')) {
        window.location.replace('/affiliate/login');
      }
    }
    return Promise.reject(error);
  }
);
