import { api } from './client';

export const uploadImage = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/upload/image', form);
};
