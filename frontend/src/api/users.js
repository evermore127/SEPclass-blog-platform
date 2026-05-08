import { api } from './client';

export const register = (data) => api.post('/users/register', data);
export const login = (data) => api.post('/users/login', data);
export const getMe = () => api.get('/users/me');
export const updateMe = (data) => api.put('/users/me', data);
export const uploadAvatar = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/users/me/avatar', fd);
};
export const getUser = (id) => api.get(`/users/${id}`);
