import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (email, password) =>
    api.post("/auth/register", { email, password }),
  login: (email, password) => api.post("/auth/login", { email, password }),
};

// Task Lists API
export const taskListAPI = {
  getAll: () => api.get("/tasklists"),
  getById: (id) => api.get(`/tasklists/${id}`),
  create: (title) => api.post("/tasklists", { title }),
  update: (id, title) => api.put(`/tasklists/${id}`, { title }),
  delete: (id) => api.delete(`/tasklists/${id}`),
};

// Tasks API
export const taskAPI = {
  getAll: (taskListId) => api.get(`/tasks/${taskListId}`),
  create: (taskListId, data) => api.post(`/tasks/${taskListId}`, data),
  update: (taskListId, taskId, data) =>
    api.put(`/tasks/${taskListId}/${taskId}`, data),
  updateStatus: (taskListId, taskId, status) =>
    api.patch(`/tasks/${taskListId}/${taskId}/status`, { status }),
  delete: (taskListId, taskId) => api.delete(`/tasks/${taskListId}/${taskId}`),
};

// Shares API
export const shareAPI = {
  getShares: (taskListId) => api.get(`/shares/${taskListId}`),
  create: (taskListId, email, permission) =>
    api.post(`/shares/${taskListId}`, { email, permission }),
  updatePermission: (taskListId, shareId, permission) =>
    api.put(`/shares/${taskListId}/${shareId}`, { permission }),
  removeAccess: (taskListId, shareId) =>
    api.delete(`/shares/${taskListId}/${shareId}`),
};

export default api;
