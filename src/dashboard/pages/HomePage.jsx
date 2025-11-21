import { useSelector } from "react-redux";
import { hasRole } from "../../guards/authGuards";
import { Roles } from "../../guards/authEnums";
import AdminDashboard from "../../components/DashboardSections/AdminDashboard";
import AdminAlmacenDashboard from "../../components/DashboardSections/AdminAlmacenDashboard";
import AdminComprasDashboard from "../../components/DashboardSections/AdminComprasDashboard";
import OperadorDashboard from "../../components/DashboardSections/OperadorDashboard";

function HomePage() {
  const user = useSelector((state) => state?.auth?.user);
  const isAdmin = useSelector((s) => hasRole(s, Roles.ADMIN));
  const isOperador = useSelector((s) => hasRole(s, Roles.OPERADOR));
  const isAdminAlmacen = useSelector((s) => hasRole(s, Roles.ADMIN_ALMACEN));
  const isAdminCompras = useSelector((s) => 
    hasRole(s, Roles.ADMIN_COMPRAS)
  );
  const isBlogger = useSelector((s) => hasRole(s, Roles.BLOGGER));
  const isAdminWeb = useSelector((s) => hasRole(s, Roles.ADMIN_WEB));

  const getUserRole = () => {
    if (isAdmin) return "admin";
    if (isAdminAlmacen) return "admin-almacen";
    if (isAdminCompras) return "admin-compras";
    if (isOperador) return "operador";
    if (isBlogger) return "blogger";
    if (isAdminWeb) return "admin-web";
    return "guest";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenido, {user?.name ?? "Usuario"}
            </h1>
            <p className="text-gray-600 mt-1">
              Panel de Control - Sistema de Gestión de Almacén
            </p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {getUserRole().charAt(0).toUpperCase() +
              getUserRole().slice(1)}
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {isAdmin && <AdminDashboard />}
          {isAdminAlmacen && <AdminAlmacenDashboard />}
          {isAdminCompras && <AdminComprasDashboard />}
          {isOperador && <OperadorDashboard userName={user?.name} />}

          {(isBlogger || isAdminWeb) && (
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {isBlogger && "Panel de Blog"}
                  {isAdminWeb && "Panel de Administración Web"}
                </h2>
                <p className="text-gray-600">
                  {isBlogger && "Gestiona el contenido del blog"}
                  {isAdminWeb && "Administra el contenido web"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;