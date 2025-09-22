import { useSelector } from "react-redux";
import { hasRole } from "../../guards/authGuards";
import { Roles } from "../../guards/authEnums";
import StatsCards from "../../components/StatsCards";
import RecentActivity from "../../components/RecentActivity";
import QuickActions from "../../components/QuickActions";

function HomePage() {
  const user = useSelector((state) => state?.auth?.user);
  const isAdmin = useSelector((s) => hasRole(s, Roles.ADMIN));
  const isOperador = useSelector((s) => hasRole(s, Roles.OPERADOR));
  const isAdminAlmacen = useSelector((s) => hasRole(s, Roles.ADMIN_ALMACEN));
  const isBlogger = useSelector((s) => hasRole(s, Roles.BLOGGER));
  const isAdminWeb = useSelector((s) => hasRole(s, Roles.ADMIN_WEB));

  const getUserRole = () => {
    if (isAdmin) return "admin";
    if (isAdminAlmacen) return "admin-almacen";
    if (isOperador) return "operador";
    if (isBlogger) return "blogger";
    if (isAdminWeb) return "admin-web";
    return "guest";
  };

  const renderAdminAlmacenDashboard = () => (
    <div className="space-y-8">
      {/* Ajustar el componente StatsCards para excluir la sección de "Usuarios Activos" */}
      <StatsCards excludeUsers={true} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <QuickActions userRole={getUserRole()} />
      </div>
      <RecentActivity />
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-8">
      <StatsCards />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <QuickActions userRole={getUserRole()} />
      </div>
      <RecentActivity />
    </div>
  );

  const renderOperadorDashboard = () => {
    const reportesPendientes = 3;
    const reportesAprobados = 5;

    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Bienvenido, {user?.name ?? "Operador"}
        </h2>
        <p className="text-lg text-gray-600">
          Aquí puedes gestionar tus reportes de requisiciones
        </p>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Estadísticas de tus reportes
          </h3>
          <div className="flex gap-6">
            <div className="flex-1 bg-blue-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-800">{reportesPendientes}</p>
              <p className="text-blue-600">Reportes Pendientes</p>
            </div>
            <div className="flex-1 bg-green-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-800">{reportesAprobados}</p>
              <p className="text-green-600">Reportes Aprobados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Acciones Rápidas
          </h3>
          <div className="flex gap-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">
              Hacer Reporte
            </button>
          </div>
        </div>
      </div>
    );
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
            {getUserRole().charAt(0).toUpperCase() + getUserRole().slice(1)}
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {isAdmin && renderAdminDashboard()}
          {isAdminAlmacen && renderAdminAlmacenDashboard()}
          {isOperador && renderOperadorDashboard()}

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