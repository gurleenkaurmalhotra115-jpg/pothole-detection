import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const complaintsAPI = {
  // Submit new pothole complaint
  create: (formData) =>
    api.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Fetch all complaints with optional filters
  getAll: (params = {}) =>
    api.get('/complaints', { params }),

  // Get single complaint
  getById: (id) =>
    api.get(`/complaints/${id}`),

  // Update status
  updateStatus: (id, status, note = '') =>
    api.put(`/complaints/${id}/status`, { status, note }),

  // Upload after image for verification
  verify: (id, formData) =>
    api.post(`/complaints/${id}/verify`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const getImageUrl = (filename) =>
  filename ? `${BASE_URL}/complaints/uploads/${filename}` : null;

export default api;
