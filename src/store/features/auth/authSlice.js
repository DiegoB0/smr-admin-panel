import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import { api } from "../../../api/api";

let logoutTimerId = null;

// Utils
function decodeSafe(raw) {
  try {
    return raw ? jwtDecode(raw) : null;
  } catch {
    return null;
  }
}
function msUntilExp(rawToken) {
  const dec = decodeSafe(rawToken);
  if (!dec?.exp) return 0;
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, (dec.exp - now) * 1000);
}

// en vez de pasar dispatch, pasamos una función para ejecutar el logout
function scheduleAutoLogout(triggerLogout, token) {
  if (logoutTimerId) clearTimeout(logoutTimerId);
  const ms = msUntilExp(token);
  if (ms <= 0) {
    triggerLogout();
    return;
  }
  logoutTimerId = setTimeout(() => {
    triggerLogout();
  }, ms);
}

// Thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, thunkAPI) => {
    try {
      const { data } = await api.post("auth/login", credentials);
      return data; // debe contener access_token
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Login failed";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Initial state (validate saved token)
const saved = localStorage.getItem("auth_token");
const valid = saved && msUntilExp(saved) > 0;
const dec = valid ? decodeSafe(saved) : null;

if (valid) {
  api.defaults.headers.common.Authorization = `Bearer ${saved}`;
}

const initialState = {
  token: valid ? saved : null,
  user: valid
    ? {
        id: dec.sub,
        email: dec.email,
        name: dec.name,
        roles: (dec.roles || []).map((r) => r.toLowerCase()),
        permissions: (dec.permissions || []).map((p) => p.toLowerCase()),
      }
    : null,
  isAuthenticated: !!valid,
  status: "idle",
  error: null,
};

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("auth_token");
      delete api.defaults.headers.common.Authorization;
      if (logoutTimerId) clearTimeout(logoutTimerId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        const token = payload.access_token;

        const stillValid = msUntilExp(token) > 0;
        if (!stillValid) {
          state.isAuthenticated = false;
          state.error = "Token inválido o expirado";
          return;
        }

        state.token = token;
        state.isAuthenticated = true;
        localStorage.setItem("auth_token", token);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;

        const d = decodeSafe(token);
        state.user = {
          id: d.sub,
          email: d.email,
          name: d.name,
          roles: (d.roles || []).map((r) => r.toLowerCase()),
          permissions: (d.permissions || []).map((p) => p.toLowerCase()),
        };

        // Programa auto-logout usando una callback que despacha logout luego
        scheduleAutoLogout(() => {
          // no tenemos dispatch aquí, así que emitimos un evento y que main lo maneje
          window.dispatchEvent(new Event("force-logout"));
        }, token);
      })
      .addCase(login.rejected, (state, { payload, error }) => {
        state.status = "failed";
        state.error = payload || error.message;
        state.isAuthenticated = false;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;

// Inicializador: programa auto-logout si ya hay token válido
export function initAuthAutoLogout(store) {
  const token = store.getState().auth.token;
  if (!token) return;
  scheduleAutoLogout(() => {
    store.dispatch(logout());
  }, token);
}