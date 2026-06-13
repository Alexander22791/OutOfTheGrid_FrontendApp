import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://outofthegrid.onrender.com');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

const LEGACY_ENDPOINT_REWRITES: Array<{
  match: RegExp;
  replace: string;
}> = [
  { match: /^\/catalog$/i, replace: '/catalog/products' },
  { match: /^\/admin\/catalog$/i, replace: '/admin/products' },
  { match: /^\/admin\/plans$/i, replace: '/admin/coupons' },
  { match: /^\/admin\/dashboard$/i, replace: '/admin/stats' },
  { match: /^\/users\/leaderboard$/i, replace: '/leaderboard/monthly' },
  { match: /^\/cities\/leaderboard$/i, replace: '/leaderboard/monthly' },
  { match: /^\/events\/([^/]+)\/attend$/i, replace: '/events/$1/join' },
  { match: /^\/posts\/([^/]+)\/upvote$/i, replace: '/posts/$1/like' },
  { match: /^\/subscribe$/i, replace: '/subscriptions' },
  { match: /^\/unsubscribe$/i, replace: '/subscriptions/unsubscribe' },
];

const METHOD_BASED_REWRITES: Record<string, Array<{ match: RegExp; replace: string }>> = {
  delete: [{ match: /^\/events\/([^/]+)$/i, replace: '/admin/events/$1' }],
};

const normalizeRequestUrl = (rawUrl?: string, method?: string) => {
  if (!rawUrl) return rawUrl;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

  let path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;

  for (const rule of LEGACY_ENDPOINT_REWRITES) {
    if (rule.match.test(path)) {
      path = path.replace(rule.match, rule.replace);
      break;
    }
  }

  const methodRules = METHOD_BASED_REWRITES[(method ?? '').toLowerCase()] ?? [];
  for (const rule of methodRules) {
    if (rule.match.test(path)) {
      path = path.replace(rule.match, rule.replace);
      break;
    }
  }

  if (!path.startsWith('/api/')) {
    path = `/api${path}`;
  }

  return path;
};

// Token helpers
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ message?: string; detail?: string }>(error)) {
    return error.response?.data?.message ?? error.response?.data?.detail ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

// Request interceptor: aggiunge il token JWT a ogni chiamata
api.interceptors.request.use(
  (config) => {
    config.url = normalizeRequestUrl(config.url, config.method);
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: gestisce il 401 (token scaduto)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      useAuthStore.getState().logout();
    } else if (!error.response) {
      console.error('Network Error / Timeout:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
