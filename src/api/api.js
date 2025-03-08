import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:8000',
});

api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('auth_token')}`;

export default api

