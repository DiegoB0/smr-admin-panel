import axios from "axios";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const jwt = localStorage.getItem("auth_token");
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  config.headers["x-api-key"] = API_KEY;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 419) {
      window.dispatchEvent(new Event("force-logout"));
    }
    return Promise.reject(error);
  }
);


