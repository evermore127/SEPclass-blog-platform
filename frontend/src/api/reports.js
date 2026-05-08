import { api } from './client';

export const createReport = (data) => api.post('/reports/', data);
