import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(new Error(message));
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

// Sessions
export const sessionAPI = {
  create: (data) => api.post('/sessions', data),
  getAll: (params) => api.get('/sessions', { params }),
  getById: (id) => api.get(`/sessions/${id}`),
  update: (id, data) => api.patch(`/sessions/${id}`, data),
  end: (id) => api.patch(`/sessions/${id}/end`),
  delete: (id) => api.delete(`/sessions/${id}`),
  getStats: () => api.get('/sessions/stats'),
};

// Transcriptions
export const transcriptionAPI = {
  uploadAudio: (sessionId, formData, onProgress) =>
    api.post(`/transcribe/session/${sessionId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }),
  getById: (id) => api.get(`/transcribe/${id}`),
  getBySession: (sessionId) => api.get(`/transcribe/session/${sessionId}/transcriptions`),
  update: (id, data) => api.patch(`/transcribe/${id}`, data),
  delete: (id) => api.delete(`/transcribe/${id}`),
  export: (id, format) => api.get(`/transcribe/${id}/export/${format}`, { responseType: 'blob' }),
};

// Summaries
export const summaryAPI = {
  generate: (sessionId, data) => api.post(`/summaries/session/${sessionId}/generate`, data),
  getBySession: (sessionId) => api.get(`/summaries/session/${sessionId}`),
  getById: (id) => api.get(`/summaries/${id}`),
  update: (id, data) => api.patch(`/summaries/${id}`, data),
  export: (id, format) => api.get(`/summaries/${id}/export/${format}`, { responseType: 'blob' }),
};

// Patients
export const patientAPI = {
  create: (data) => api.post('/patients', data),
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  getWithHistory: (id) => api.get(`/patients/${id}/history`),
  update: (id, data) => api.patch(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  search: (q) => api.get('/patients/search', { params: { q } }),
  getStats: () => api.get('/patients/stats'),
};

export default api;
