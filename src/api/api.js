import axios from 'axios';

const API_KEY = import.meta.env.VITE_API_KEY;

const BASE_URL = import.meta.env.VITE_BACKEND_URL

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const jwt = localStorage.getItem('auth_token')
  if(jwt) {
    config.headers.Authorization = `Bearer ${jwt}`
  }

  config.headers['x-api-key'] = API_KEY;

  return config;
})


