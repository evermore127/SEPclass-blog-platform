import { api } from './client';

export const getPosts = (params) => api.get('/posts/', { params });
export const getPost = (id) => api.get(`/posts/${id}`);
export const createPost = (data) => api.post('/posts/', data);
export const updatePost = (id, data) => api.put(`/posts/${id}`, data);
export const deletePost = (id) => api.delete(`/posts/${id}`);
export const likePost = (id) => api.post(`/posts/${id}/like`);
export const favoritePost = (id) => api.post(`/posts/${id}/favorite`);
