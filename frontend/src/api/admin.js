import { api } from './client';

export const getReports = () => api.get('/admin/reports');
export const resolveReport = (id) => api.post(`/admin/reports/${id}/resolve`);
export const togglePin = (id) => api.post(`/admin/posts/${id}/pin`);
export const hidePost = (id) => api.post(`/admin/posts/${id}/hide`);
export const getApplications = () => api.get('/admin/applications');
export const approveApplication = (id) => api.post(`/admin/applications/${id}/approve`);
export const rejectApplication = (id) => api.post(`/admin/applications/${id}/reject`);
export const getAuditLogs = () => api.get('/admin/audit-logs');
export const getAdminPosts = (params) => api.get('/admin/posts', { params });
