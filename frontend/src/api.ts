import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8084/api';
export const ASSET_BASE_URL = 'http://localhost:8084';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
