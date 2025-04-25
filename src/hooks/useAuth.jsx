import api from '../api/api';
import { setCredentials, logout } from '../store/authSlice';

export const login = async ({ email, password }, dispatch) => {
  try {
    const response = await api.post('/api/login', { email, password });
    const { token, user } = response.data;

    // Dispatch to Redux
    dispatch(setCredentials({ token, user }));

    return { success: true, data: response.data };

  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Unknown error' };
  }
};

export const logoutUser = (dispatch) => {

  dispatch(logout());
};
