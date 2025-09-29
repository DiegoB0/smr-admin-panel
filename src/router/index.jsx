import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import LoginPage from "../auth/LoginPage";
import AuthLayout from "../auth/layouts/AuthLayout";
import HomePage from "../dashboard/pages/HomePage";
import SettingsPage from "../dashboard/pages/SettingsPage";
import DashboardLayout from "../dashboard/layouts/DashboardLayout";
import { NotFoundPage } from "../components/NotFoundPage";
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

function AppRoutes() {
  return (
    <Router>
      <RouteLoader />
    </Router>
  );
}

function RouteLoader() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
      </Route>

      <Route path="/dashboard" element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/auth/login" />}>
        <Route index element={isAuthenticated ? <HomePage /> : <Navigate to="/auth/login" />} />
        <Route path="blogs" element={isAuthenticated ? <BlogPage /> : <Navigate to="/auth/login" />} />
        <Route path="users" element={isAuthenticated ? <UsersPage /> : <Navigate to="/auth/login" />} />
        <Route path="emails" element={isAuthenticated ? <EmailsPage /> : <Navigate to="/auth/login" />} />
        <Route path="clients" element={isAuthenticated ? <ClientsPage /> : <Navigate to="/auth/login" />} />
        <Route path="notifications" element={isAuthenticated ? <NotificationsPage /> : <Navigate to="/auth/login" />} />
        <Route path="testimonials" element={isAuthenticated ? <TestimonialsPage /> : <Navigate to="/auth/login" />} />
        <Route path="projects" element={isAuthenticated ? <ProjectsPage /> : <Navigate to="/auth/login" />} />
        <Route path="services" element={isAuthenticated ? <ServicesPage /> : <Navigate to="/auth/login" />} />
        <Route path="settings" element={isAuthenticated ? <SettingsPage /> : <Navigate to="/auth/login" />} />
        <Route path="requisiciones" element={isAuthenticated ? <RequisicionesPage /> : <Navigate to={"/auth/login"} />}></Route>
        <Route path="reportes" element={isAuthenticated ? <ReportesPage /> : <Navigate to={"/auth/login"} />}></Route>
        <Route path="obras" element={isAuthenticated ? <ObrasPage /> : <Navigate to={"/auth/login"} />}></Route>
        <Route path="equipos" element={isAuthenticated ? <EquiposPage /> : <Navigate to={"/auth/login"} />}></Route>
        <Route path="almacenes" element={isAuthenticated ? <AlmacenesPage /> : <Navigate to="/auth/login" />} />
        <Route path="productos" element={isAuthenticated ? <ProductosPage /> : <Navigate to="/auth/login" />} />
        <Route path="almacenes/:id" element={isAuthenticated ? <AlmacenenInventarioPage /> : <Navigate to="/auth/login" />} />
        <Route path="reportes/operadores" element={isAuthenticated ? <ReportesOperadorPage /> : <Navigate to={"/auth/login"} />}></Route>
        <Route path="proveedores" element={isAuthenticated ? <ProveedoresPage /> : <Navigate to={"/auth/login"} />}></Route>
        <Route path="entradas" element={isAuthenticated ? <EntradasPage /> : <Navigate to={"/auth/login"} />}></Route>
        <Route path="salidas" element={isAuthenticated ? <SalidasPage /> : <Navigate to={"/auth/login"} />}></Route>
        <Route path="historial" element={isAuthenticated ? <HistorialPage /> : <Navigate to={"/auth/login"} />}></Route>

      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}


export default AppRoutes;

