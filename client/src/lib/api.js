import axios from 'axios';

const TOKEN_KEY = 'mis.token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE || ''}/api`,
});

api.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err.response?.status;
    if (status === 401 && tokenStore.get()) {
      tokenStore.set(null);
      if (!location.pathname.startsWith('/login')) {
        location.assign('/login?expired=1');
      }
    }
    return Promise.reject(err);
  }
);

export const apiError = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.error || err?.message || fallback;

// Absolute URL for a stored upload path like "/uploads/avatars/x.png".
export const fileUrl = (p) => (p ? `${import.meta.env.VITE_API_BASE || ''}${p}` : '');

// Authorized study file (image/pdf) — fetched as a blob so the bearer header applies.
export async function fetchStudyBlob(studyId, { download = false } = {}) {
  const res = await api.get(`/studies/${studyId}/file`, {
    params: download ? { download: 1 } : {},
    responseType: 'blob',
  });
  return res.data;
}
