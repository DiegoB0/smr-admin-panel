import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./store/store.js";
import "./styles/pdf.css";

import { initAuthAutoLogout, logout } from "./store/features/auth/authSlice";

// Programa auto-logout si hay token válido al iniciar
initAuthAutoLogout(store);

// Escucha 401/419 emitidos desde el interceptor y desloguea
window.addEventListener("force-logout", () => {
  store.dispatch(logout());
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
