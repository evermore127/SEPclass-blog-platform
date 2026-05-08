import { api } from './client';

export const getComments = (postId) => api.get('/comments/', { params: { post_id: postId } });
export const createComment = (data) => api.post('/comments/', data);
export const deleteComment = (id) => api.delete(`/comments/${id}`);
