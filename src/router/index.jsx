import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import AuthLayout from "../auth/layouts/AuthLayout";
import LoginPage from "../auth/LoginPage";

import DashboardLayout from "../dashboard/layouts/DashboardLayout";
import HomePage from "../dashboard/pages/HomePage";
import SettingsPage from "../dashboard/pages/SettingsPage";
import UsersPage from "../dashboard/pages/usuarios/UsersPage";
import BlogPage from "../dashboard/pages/BlogPage";
import TestimonialsPage from "../dashboard/pages/TestimonialsPage";
import ProjectsPage from "../dashboard/pages/ProjectsPage";
import ServicesPage from "../dashboard/pages/ServicesPage";
import NotificationsPage from "../dashboard/pages/NotificationsPage";
import ClientsPage from "../dashboard/pages/ClientsPage";
import EmailsPage from "../dashboard/pages/EmailsPage";
import RequisicionesPage from "../dashboard/pages/RequisicionesPage";
import AlmacenesPage from "../dashboard/pages/AlmacenesPage";
import ProductosPage from "../dashboard/pages/ProductosPage";
import AlmacenenInventarioPage from "../dashboard/pages/AlmacenenInventarioPage";
import ReportesOperadorPage from "../dashboard/pages/ReportesOperadorPage";
import ReportesPage from "../dashboard/pages/ReportesPage";
import ObrasPage from "../dashboard/pages/ObrasPage";
import EquiposPage from "../dashboard/pages/EquiposPage";
import ProveedoresPage from "../dashboard/pages/ProveedoresPage";
import EntradasPage from "../dashboard/pages/EntradasPage";
import SalidasPage from "../dashboard/pages/SalidasPage";
import HistorialPage from "../dashboard/pages/HistorialPage";
import RequisicionesCompraPage from "../dashboard/pages/RequisicionesCompraPage";

function AppRoutes() {
  return (
    <Router>
      <RouteLoader />
    </Router>
  );
}

function RouteLoader() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const RootRedirect = () =>
    isAuthenticated ? (
      <Navigate to="/dashboard" replace />
    ) : (
      <Navigate to="/auth/login" replace />
    );

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          isAuthenticated ? <DashboardLayout /> : <Navigate to="/auth/login" replace />
        }
      >
        <Route index element={<HomePage />} />
        <Route path="blogs" element={<BlogPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="emails" element={<EmailsPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="testimonials" element={<TestimonialsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="requisiciones" element={<RequisicionesPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="obras" element={<ObrasPage />} />
        <Route path="equipos" element={<EquiposPage />} />
        <Route path="almacenes" element={<AlmacenesPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="almacenes/:id" element={<AlmacenenInventarioPage />} />
        <Route path="reportes/operadores" element={<ReportesOperadorPage />} />
        <Route path="proveedores" element={<ProveedoresPage />} />
        <Route path="entradas" element={<EntradasPage />} />
        <Route path="salidas" element={<SalidasPage />} />
        <Route path="historial" element={<HistorialPage />} />
        <Route path="requisiciones/compras" element={<RequisicionesCompraPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;