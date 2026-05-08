import { api } from './client';

export const getSections = () => api.get('/sections/');
export const getSection = (id) => api.get(`/sections/${id}`);
export const applySection = (data) => api.post('/sections/apply', data);
