// components/DashboardSections/OperadorDashboard.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, 
         Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FiFileText, FiCheckCircle, FiClock, FiTrendingUp } from 'react-icons/fi';

function OperadorDashboard({ userName }) {
  const reportesData = [
    { semana: 'Sem 1', pendientes: 3, aprobados: 8, rechazados: 1 },
    { semana: 'Sem 2', pendientes: 2, aprobados: 10, rechazados: 0 },
    { semana: 'Sem 3', pendientes: 5, aprobados: 6, rechazados: 2 },
    { semana: 'Sem 4', pendientes: 3, aprobados: 9, rechazados: 1 },
  ];

  const statCards = [
    { 
      titulo: 'Reportes Totales', 
      valor: '28', 
      cambio: '+4', 
      icon: FiFileText,
      color: 'blue',
      fondo: 'bg-blue-50'
    },
    { 
      titulo: 'Aprobados', 
      valor: '23', 
      cambio: '+2', 
      icon: FiCheckCircle,
      color: 'green',
      fondo: 'bg-green-50'
    },
    { 
      titulo: 'Pendientes', 
      valor: '3', 
      cambio: '+1', 
      icon: FiClock,
      color: 'yellow',
      fondo: 'bg-yellow-50'
    },
    { 
      titulo: 'Tasa de Aprobación', 
      valor: '85%', 
      cambio: '+5%', 
      icon: FiTrendingUp,
      color: 'purple',
      fondo: 'bg-purple-50'
    },
  ];

  const recentReports = [
    { id: 1, titulo: 'Reporte de Obra A', estado: 'Aprobado', fecha: '12/11/2025', cantidad: 5 },
    { id: 2, titulo: 'Reporte de Obra B', estado: 'Pendiente', fecha: '11/11/2025', cantidad: 3 },
    { id: 3, titulo: 'Reporte de Obra C', estado: 'Aprobado', fecha: '10/11/2025', cantidad: 8 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Bienvenido, {userName ?? "Operador"}
          </h2>
          <p className="text-gray-500 mt-1">
            Panel de reportes y requisiciones
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          const colorMap = {
            blue: 'text-blue-600',
            green: 'text-green-600',
            yellow: 'text-yellow-600',
            purple: 'text-purple-600',
          };
          
          return (
            <div
              key={idx}
              className={`${stat.fondo} p-6 rounded-2xl border border-gray-200 
                         hover:shadow-lg hover:border-gray-300 transition-all 
                         duration-300 transform hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    {stat.titulo}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.valor}
                  </p>
                  <p className="text-green-600 text-sm font-semibold mt-2">
                    {stat.cambio}
                  </p>
                </div>
                <Icon className={`${colorMap[stat.color]} text-4xl opacity-20`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border 
                      border-gray-200 hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Reportes por Semana
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="semana" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px'
                }}
              />
              <Bar dataKey="aprobados" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pendientes" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="rechazados" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border 
                      border-gray-200 hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Tendencia de Aprobaciones
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="semana" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="aprobados" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reportes Recientes */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Reportes Recientes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-6 font-bold text-gray-900">
                  Título
                </th>
                <th className="text-left py-4 px-6 font-bold text-gray-900">
                  Estado
                </th>
                <th className="text-center py-4 px-6 font-bold text-gray-900">
                  Cantidad
                </th>
                <th className="text-left py-4 px-6 font-bold text-gray-900">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report, idx) => {
                const statusColors = {
                  'Aprobado': 'bg-green-100 text-green-800',
                  'Pendiente': 'bg-yellow-100 text-yellow-800',
                  'Rechazado': 'bg-red-100 text-red-800',
                };
                
                return (
                  <tr 
                    key={report.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 
                             transition-colors duration-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {report.titulo}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-4 py-2 rounded-lg text-sm font-bold 
                                     ${statusColors[report.estado]}`}>
                        {report.estado}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-gray-900">
                      {report.cantidad}
                    </td>
                    <td className="py-4 px-6 text-gray-700">
                      {report.fecha}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 rounded-2xl 
                    text-white shadow-lg">
        <h3 className="text-xl font-bold mb-4">Acciones Rápidas</h3>
        <button className="bg-white text-red-600 px-6 py-3 rounded-lg font-bold 
                         hover:bg-gray-100 transition-colors">
          + Crear Nuevo Reporte
        </button>
      </div>
    </div>
  );
}

export default OperadorDashboard;