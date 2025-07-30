import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import { api } from '../../../api/api';

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, thunkAPI) => {
    try {
      const { data } = await api.post('auth/login', credentials);
      return data

    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Login failed";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const token = localStorage.getItem('auth_token');

let user = null;

// Rehidrate the user in case there's token
if (token) {

  api.defaults.headers.common.Authorization = `Bearer ${token}`

  let {
    sub: id,
    email,
    name,
    roles = [],
    permissions = []
  } = jwtDecode(token)

  user = {
    id,
    email,
    name,
    roles: roles.map(r => r.toLowerCase()),
    permissions: permissions.map(p => p.toLowerCase())
  };

}

const initialState = {
  token: token || null,
  user: user,
  isAuthenticated: Boolean(token),
  status: 'idle',
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null,
        state.user = null,
        state.isAuthenticated = false,
        state.status = 'idle',
        state.error = null,
        localStorage.removeItem('auth_token'),
        delete api.defaults.headers.common.Authorization
    }
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.status = 'loading',
          state.error = null
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.status = 'succeeded'
        const token = payload.access_token
        state.token = token
        state.isAuthenticated = true
        localStorage.setItem('auth_token', token)
        api.defaults.headers.common.Authorization = `Bearer ${token}`

        let {
          sub: id,
          email,
          name,
          roles = [],
          permissions = []
        } = jwtDecode(token)
        roles = roles.map(r => r.toLowerCase())
        permissions = permissions.map(p => p.toLowerCase())
        state.user = { id, email, name, roles, permissions }

      })
      .addCase(login.rejected, (state, { payload, error }) => {
        state.status = 'failed'
        state.error = payload || error.message
      })

  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
