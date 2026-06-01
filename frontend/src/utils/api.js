const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const normalizeApiBaseUrl = (baseUrl) => {
  const trimmed = trimTrailingSlash(baseUrl || '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const getDefaultApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000/api';
  }

  return `http://${window.location.hostname}:5000/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL || getDefaultApiBaseUrl()
);

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
};
