import api from './api';
export const loginRequest = (data) => api.post('/auth/login', data);
