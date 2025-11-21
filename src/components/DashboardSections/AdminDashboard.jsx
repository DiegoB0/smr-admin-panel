// components/DashboardSections/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, 
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
         ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FiTrendingUp, FiUsers, FiShoppingCart, FiCheck } from 'react-icons/fi';
import { MdOutlineInventory2 } from 'react-icons/md';
import { api } from '../../api/api';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [requisiciones, setRequisiciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [reqRes, prodRes, userRes] = await Promise.all([
          api.get('/requisiciones/all_requisiciones'),
          api.get('/productos/all_productos'),
          api.get('/usuarios/all_users')
        ]);

        console.log('Requisiciones:', reqRes.data.data);
        console.log('Productos:', prodRes.data.data);
        console.log('Usuarios:', userRes.data.data);

        setRequisiciones(reqRes.data.data || []);
        setProductos(prodRes.data.data || []);
        setUsuarios(userRes.data.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Procesar datos para gráficos
 const getChartData = () => {
  const meses = {};
  
  requisiciones.forEach(req => {
    const fecha = new Date(req.fechaSolicitud);
    const mes = fecha.toLocaleString('es-ES', { month: 'short' });
    
    if (!meses[mes]) {
      meses[mes] = { mes, gasto: 0, cantidad: 0 };
    }
    meses[mes].gasto += parseInt(req.cantidad_dinero) || 0;
    meses[mes].cantidad += 1;
  });

  return Object.values(meses).slice(-6);
};

  const getCategoryDistribution = () => {
    const categorias = {};
    
    requisiciones.forEach(req => {
      const tipo = req.requisicionType || 'Otros';
      categorias[tipo] = (categorias[tipo] || 0) + 1;
    });

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];
    let colorIndex = 0;

    return Object.entries(categorias).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[colorIndex++ % colors.length]
    }));
  };

  const getStatusStats = () => {
    const stats = {
      aprobada: 0,
      pagada: 0,
      pendiente: 0
    };

    requisiciones.forEach(req => {
      if (req.status === 'aprobada') stats.aprobada++;
      if (req.status === 'pagada') stats.pagada++;
      if (req.status === 'pendiente') stats.pendiente++;
    });

    return stats;
  };

  const getTopProducts = () => {
    const productCount = {};

    requisiciones.forEach(req => {
      req.items?.forEach(item => {
        const prodName = item.producto?.name || item.descripcion;
        const cantidad = item.cantidadSolicitada || item.cantidad || 0;
        productCount[prodName] = (productCount[prodName] || 0) + cantidad;
      });
    });

    return Object.entries(productCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nombre, cantidad]) => {
        const producto = productos.find(p => p.name === nombre);
        return {
          nombre,
          cantidad,
          stock: Math.floor(Math.random() * 100),
          precio: producto?.precio || '0',
          imagen: '📦'
        };
      });
  };

  const getRecentActivity = () => {
    return requisiciones
      .sort((a, b) => new Date(b.fechaRevision) - new Date(a.fechaRevision))
      .slice(0, 4)
      .map(req => ({
        id: req.id,
        tipo: req.status,
        descripcion: `${req.titulo}`,
        usuario: req.pedidoPor?.name || 'Sistema',
        tiempo: `Hace ${Math.floor((Date.now() - new Date(req.fechaRevision)) / 60000)} min`,
        color: req.status === 'pagada' ? 'green' : req.status === 'aprobada' ? 'blue' : 'orange'
      }));
  };

  const chartData = getChartData();
  const categoryData = getCategoryDistribution();
  const statusStats = getStatusStats();
  const topProducts = getTopProducts();
  const recentActivities = getRecentActivity();

  const statCards = [
    { 
      titulo: 'Requisiciones', 
      valor: requisiciones.length.toString(), 
      cambio: `+${Math.floor(requisiciones.length * 0.12)}`, 
      icon: FiShoppingCart,
      color: 'blue',
      fondo: 'bg-blue-50'
    },
    { 
      titulo: 'Aprobadas', 
      valor: statusStats.aprobada.toString(), 
      cambio: `+${statusStats.aprobada}`, 
      icon: FiCheck,
      color: 'green',
      fondo: 'bg-green-50'
    },
    { 
      titulo: 'Usuarios', 
      valor: usuarios.length.toString(), 
      cambio: `+${usuarios.length}`, 
      icon: FiUsers,
      color: 'purple',
      fondo: 'bg-purple-50'
    },
    { 
      titulo: 'Productos', 
      valor: productos.length.toString(), 
      cambio: `+${productos.length}`, 
      icon: MdOutlineInventory2,
      color: 'red',
      fondo: 'bg-red-50'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 text-lg">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Panel de Control
          </h2>
          <p className="text-gray-500 mt-1">
            Bienvenido de vuelta, aquí está tu resumen
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all 
                       duration-300 ${
              activeTab === 'overview'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Vista General
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all 
                       duration-300 ${
              activeTab === 'detailed'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Análisis Detallado
          </button>
        </div>
      </div>

      {/* Stats Cards mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          const colorMap = {
            blue: 'text-blue-600',
            green: 'text-green-600',
            purple: 'text-purple-600',
            red: 'text-red-600',
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

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Gráficos en grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Area Chart - Tendencias */}
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm 
                          border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiTrendingUp className="text-red-600" />
                Tendencias de Gasto
              </h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={chartData}>
  <defs>
    <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
    </linearGradient>
    <linearGradient id="colorCantidad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
    </linearGradient>
  </defs>
  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
  <XAxis dataKey="mes" stroke="#6b7280" />
  <YAxis yAxisId="left" stroke="#3b82f6" />
  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
  <Tooltip 
    contentStyle={{ 
      backgroundColor: '#fff', 
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}
    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
  />
  <Legend />
  <Area 
    yAxisId="left"
    type="monotone" 
    dataKey="gasto" 
    stroke="#3b82f6" 
    strokeWidth={2}
    fillOpacity={1}
    fill="url(#colorGasto)"
    name="Gasto ($)"
  />
  <Area 
    yAxisId="right"
    type="monotone" 
    dataKey="cantidad" 
    stroke="#10b981" 
    strokeWidth={2}
    fillOpacity={1}
    fill="url(#colorCantidad)"
    name="Cantidad"
  />
</AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sin datos disponibles</p>
              )}
            </div>

            {/* Pie Chart */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border 
                          border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Por Tipo de Requisición
              </h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sin datos disponibles</p>
              )}
            </div>
          </div>

          {/* Top Productos */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Productos Más Solicitados
            </h3>
            {topProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topProducts.map((product, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 
                             rounded-xl border border-gray-200 hover:shadow-lg 
                             transition-all duration-300 hover:scale-105"
                  >
                    <div className="text-4xl mb-4">{product.imagen}</div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      {product.nombre}
                    </h4>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-600">
                        Solicitados: <span className="font-bold text-red-600">
                          {product.cantidad}
                        </span>
                      </span>
                      <span className="text-gray-600">
                        Precio: <span className="font-bold text-green-600">
                          ${product.precio}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Sin productos</p>
            )}
          </div>

          {/* Actividad Reciente */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Actividad Reciente
            </h3>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const colorMap = {
                    green: 'bg-green-100 text-green-800 border-green-300',
                    blue: 'bg-blue-100 text-blue-800 border-blue-300',
                    orange: 'bg-orange-100 text-orange-800 border-orange-300',
                    purple: 'bg-purple-100 text-purple-800 border-purple-300',
                  };
                  
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg 
                               border border-gray-200 hover:bg-gray-100 transition"
                    >
                      <div className={`w-2 h-2 rounded-full 
                                   ${colorMap[activity.color].split(' ')[0]}`} />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {activity.descripcion}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.usuario} • {activity.tiempo}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                                     ${colorMap[activity.color]}`}>
                        {activity.tipo.charAt(0).toUpperCase() + 
                          activity.tipo.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">Sin actividad reciente</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'detailed' && (
        <div className="space-y-8">
          {/* Bar Chart */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border 
                        border-gray-200 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Comparativa Detallada
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
  <CartesianGrid 
    strokeDasharray="3 3" 
    stroke="#e5e7eb" 
  />
  <XAxis dataKey="mes" stroke="#6b7280" />
  <YAxis yAxisId="left" stroke="#3b82f6" />
  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
  <Tooltip 
    contentStyle={{ 
      backgroundColor: '#fff', 
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}
    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
  />
  <Legend />
  <Bar 
    yAxisId="left"
    dataKey="gasto" 
    fill="#3b82f6" 
    radius={[8, 8, 0, 0]}
    animationDuration={800}
    name="Gasto Total ($)"
  />
  <Bar 
    yAxisId="right"
    dataKey="cantidad" 
    fill="#10b981" 
    radius={[8, 8, 0, 0]}
    animationDuration={800}
    name="Cantidad Requisiciones"
  />
</BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">Sin datos disponibles</p>
            )}
          </div>

          {/* Tabla detallada */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Todas las Requisiciones
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 font-bold text-gray-900">
                      Título
                    </th>
                    <th className="text-left py-4 px-6 font-bold text-gray-900">
                      Usuario
                    </th>
                    <th className="text-center py-4 px-6 font-bold text-gray-900">
                      Monto
                    </th>
                    <th className="text-center py-4 px-6 font-bold text-gray-900">
                      Estado
                    </th>
                    <th className="text-left py-4 px-6 font-bold text-gray-900">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requisiciones.slice(0, 10).map((req, idx) => (
                    <tr 
                      key={req.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 
                               transition-colors duration-200 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="py-4 px-6">
                        <span className="font-semibold text-gray-900 line-clamp-1">
                          {req.titulo}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {req.pedidoPor?.name || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-red-600">
                        ${req.cantidad_dinero}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          req.status === 'pagada'
                            ? 'bg-green-100 text-green-800'
                            : req.status === 'aprobada'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {req.status.charAt(0).toUpperCase() + 
                            req.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {new Date(req.fechaSolicitud).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;