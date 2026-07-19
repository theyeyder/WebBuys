import api from './api';
const url = '/facturas';
export const listar = () => api.get(url);
export const crear = (data) => api.post(url, data);
export const actualizar = (id, data) => api.put(url + '/' + id, data);
export const eliminar = (id) => api.delete(url + '/' + id);
