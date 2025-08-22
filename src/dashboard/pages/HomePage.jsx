import { useSelector } from "react-redux"
import { hasRole } from "../../guards/authGuards"
import { Roles } from "../../guards/authEnums"
import StatsCards from "../../components/StatsCards"
import RecentActivity from "../../components/RecentActivity"
import QuickActions from "../../components/QuickActions"
import InventoryChart from "../../components/InventoryChart"

function HomePage() {
  const user = useSelector((state) => state?.auth?.user)
  const isAdmin = useSelector((s) => hasRole(s, Roles.ADMIN))
  const isOperador = useSelector((s) => hasRole(s, Roles.OPERADOR))
  const isAdminAlmacen = useSelector((s) => hasRole(s, Roles.ADMIN_ALMACEN))
  const isBlogger = useSelector((s) => hasRole(s, Roles.BLOGGER))
  const isAdminWeb = useSelector((s) => hasRole(s, Roles.ADMIN_WEB))

  const getUserRole = () => {
    if (isAdmin) return "admin"
    if (isAdminAlmacen) return "admin-almacen"
    if (isOperador) return "operador"
    if (isBlogger) return "blogger"
    if (isAdminWeb) return "admin-web"
    return "guest"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {user?.name ?? "Carmen Monarrez"}</h1>
            <p className="text-gray-600 mt-1">Panel de Control - Sistema de Gestión de Almacén</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Administrador</div>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard completo para Admins y Admin Almacén */}
          {(isAdmin || isAdminAlmacen) && (
            <div className="space-y-8">
              <StatsCards />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <InventoryChart />
                <QuickActions userRole={getUserRole()} />
              </div>
              <RecentActivity />
            </div>
          )}

          {/* Dashboard para Operadores */}
          {isOperador && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Mis Tareas</p>
                      <p className="text-2xl font-bold text-gray-900">5</p>
                    </div>
                    <div className="bg-blue-500 text-white p-3 rounded-full">📋</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <QuickActions userRole={getUserRole()} />
                <RecentActivity />
              </div>
            </div>
          )}

          {/* Vista simple para otros roles */}
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
  )
}

export default HomePage
