import { createSlice } from '@reduxjs/toolkit';
import api from '../api/api';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('auth_token') || null,
    user: null,
    isAuthenticated: !!localStorage.getItem('auth_token'),
  },
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('auth_token', action.payload.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('auth_token');
      delete api.defaults.headers.common['Authorization'];
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
