import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  signup: (username, password, email, role = 'supplier') =>
    api.post('/auth/signup', { username, password, email, role }),
  login: (name, password) =>
    api.post('/auth/login', { name, password }),
  createSupplier: (data) =>
    api.post('/auth/create-supplier', data),
  getProfile: () =>
    api.get('/auth/me'),
  updateProfile: (data) =>
    api.put('/auth/profile', data)
};

// Ingredients API calls
export const ingredientsAPI = {
  getAll: (search = '', page = 1, limit = 20) =>
    api.get(`/ingredients?search=${search}&page=${page}&limit=${limit}`),
  getById: (id) =>
    api.get(`/ingredients/${id}`),
  getSuppliers: (id) =>
    api.get(`/ingredients/${id}/suppliers`),
  create: (data) =>
    api.post('/ingredients', data),
  update: (id, data) =>
    api.put(`/ingredients/${id}`, data),
  delete: (id) =>
    api.delete(`/ingredients/${id}`)
};

// Suppliers API calls
export const suppliersAPI = {
  getAll: (search = '', page = 1, limit = 20) =>
    api.get(`/suppliers?search=${search}&page=${page}&limit=${limit}`),
  getById: (id) =>
    api.get(`/suppliers/${id}`),
  getProfile: () =>
    api.get('/suppliers/profile/me'),
  getByIngredient: (ingredientId) =>
    api.get(`/suppliers/by-ingredient/${ingredientId}`),
  create: (data) =>
    api.post('/suppliers', data),
  createSupplier: (data) =>
    api.post('/auth/create-supplier', data),
  update: (id, data) =>
    api.put(`/suppliers/${id}`, data),
  addIngredient: (supplierId, ingredientId) =>
    api.post(`/suppliers/${supplierId}/ingredients/${ingredientId}`),
  removeIngredient: (supplierId, ingredientId) =>
    api.delete(`/suppliers/${supplierId}/ingredients/${ingredientId}`)
};

// Catalog API calls
export const catalogAPI = {
  getAll: (page = 1, limit = 1000) =>
    api.get(`/catalog?page=${page}&limit=${limit}`),
  getById: (id) =>
    api.get(`/catalog/${id}`),
  getBySupplier: (supplierId) =>
    api.get(`/catalog/supplier/${supplierId}`),
  create: (data) =>
    api.post('/catalog', data),
  update: (id, data) =>
    api.put(`/catalog/${id}`, data),
  delete: (id) =>
    api.delete(`/catalog/${id}`)
};

// Inquiries API calls
export const inquiriesAPI = {
  create: (data) =>
    api.post('/inquiries', data),
  getAll: (page = 1, limit = 20) =>
    api.get(`/inquiries?page=${page}&limit=${limit}`),
  getById: (id) =>
    api.get(`/inquiries/${id}`),
  updateStatus: (id, status) =>
    api.put(`/inquiries/${id}/status`, { status })
};

// Orders API calls
export const ordersAPI = {
  // Orders are represented by quotes in the canonical schema. Map order operations to quotes endpoints.
  create: (inquiryId, price) =>
    api.post('/quotes', { inquiry_id: inquiryId, price }),
  getAdminAll: (status = '', page = 1, limit = 20) =>
    api.get(`/quotes?status=${status}&page=${page}&limit=${limit}`),
  getSupplierAll: (status = '', page = 1, limit = 20) =>
    api.get(`/quotes?status=${status}&page=${page}&limit=${limit}`),
  getById: (id) =>
    api.get(`/quotes/${id}`),
  update: (id, status) =>
    api.put(`/quotes/${id}/status`, { status }),
  accept: (id, amt) =>
    api.put(`/quotes/${id}/accept`, { amt })
};

export default api;
