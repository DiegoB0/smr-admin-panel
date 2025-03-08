import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '../auth/LoginPage';
import AuthLayout from '../auth/layouts/AuthLayout';

import { HomePage } from '../dashboard/pages/HomePage';

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Redirect unauthenticated users to the login page */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
        </Route>

        {/* Protect the dashboard route */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated() ? (
              <HomePage />
            ) : (
              <Navigate to="/auth/login" />
            )
          }
        />

        {/* Catch-all route for 404 */}
        <Route path="*" element={<Navigate to="/auth/login" />} />
      </Routes>
    </Router>
  );
}

function isAuthenticated() {
  const token = localStorage.getItem('auth_token');
  return token ? true : false;
}

export default AppRoutes;

