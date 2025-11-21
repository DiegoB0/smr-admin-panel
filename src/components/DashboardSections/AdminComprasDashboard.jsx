// components/DashboardSections/AdminComprasDashboard.jsx
import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, 
         CartesianGrid, Tooltip, ResponsiveContainer, PieChart, 
         Pie, Cell, Legend } from 'recharts';
import { FiShoppingCart, FiTruck, FiDollarSign, FiCheck, FiClock } from 'react-icons/fi';
import { api } from '../../api/api';

function AdminComprasDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [requisicionesAprobadas, setRequisicionesAprobadas] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [reqRes, almacenesRes] = await Promise.all([
          api.get('/requisiciones/aproved_requisiciones'),
          api.get('/almacenes/all_almacenes')
        ]);

        console.log('Requisiciones aprobadas:', reqRes.data.data);
        console.log('Almacenes:', almacenesRes.data.data);

        setRequisicionesAprobadas(reqRes.data.data || []);
        setAlmacenes(almacenesRes.data.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Cargar entradas para cada almacén
  useEffect(() => {
    const fetchEntradas = async () => {
      try {
        const entradasPromises = almacenes.map(almacen =>
          api.get(`/entradas/${almacen.id}`).catch(() => ({ data: { data: [] } }))
        );
        const results = await Promise.all(entradasPromises);
        
        const todasLasEntradas = results.reduce((acc, res) => [
          ...acc,
          ...(res.data.data || [])
        ], []);
        
        setEntradas(todasLasEntradas);
      } catch (error) {
        console.error('Error fetching entradas:', error);
      }
    };

    if (almacenes.length > 0) {
      fetchEntradas();
    }
  }, [almacenes]);

  // Datos para gráfica comparativa de almacenes
  const getAlmacenesComparativa = () => {
    return almacenes.map(almacen => {
      let gastoPagado = 0;
      let gastoPendiente = 0;

      requisicionesAprobadas.forEach(req => {
        const monto = parseInt(req.cantidad_dinero) || 0;
        if (req.almacenDestino?.id === almacen.id) {
          if (req.status === 'pagada') {
            gastoPagado += monto;
          } else {
            gastoPendiente += monto;
          }
        }
      });

      return {
        name: almacen.name.split(' ')[0], // Nombre corto
        pagadas: gastoPagado,
        pendientes: gastoPendiente,
        almacenId: almacen.id
      };
    }).filter(a => a.pagadas > 0 || a.pendientes > 0);
  };

  // Procesar datos generales
  const getChartData = () => {
    const meses = {};
    
    requisicionesAprobadas.forEach(req => {
      const fecha = new Date(req.fechaSolicitud);
      const mes = fecha.toLocaleString('es-ES', { month: 'short' });
      
      if (!meses[mes]) {
        meses[mes] = { mes, pagadas: 0, pendientes: 0 };
      }
      
      if (req.status === 'pagada') {
        meses[mes].pagadas += parseInt(req.cantidad_dinero) || 0;
      } else {
        meses[mes].pendientes += parseInt(req.cantidad_dinero) || 0;
      }
    });

    return Object.values(meses).slice(-6);
  };

  const getStatusStats = () => {
    let pagadas = 0;
    let pendientes = 0;
    let totalGasto = 0;

    requisicionesAprobadas.forEach(req => {
      const monto = parseInt(req.cantidad_dinero) || 0;
      totalGasto += monto;
      
      if (req.status === 'pagada') {
        pagadas += monto;
      } else {
        pendientes += monto;
      }
    });

    return { pagadas, pendientes, totalGasto };
  };

  const getProductosPendientes = () => {
    const pendientes = [];
    
    entradas.forEach(entrada => {
      entrada.items?.forEach(item => {
        if (item.cantidadRecibida < item.cantidadEsperada) {
          pendientes.push({
            id: item.id,
            producto: item.producto?.name,
            faltante: item.cantidadEsperada - item.cantidadRecibida,
            recibida: item.cantidadRecibida,
            esperada: item.cantidadEsperada,
            fechaEsperada: entrada.fechaEsperada,
            almacen: entrada.almacenDestino?.name
          });
        }
      });
    });

    return pendientes;
  };

  const handlePagar = async (id) => {
    try {
      await api.patch(`/requisiciones/${id}/pagar`, {
        metodo_pago: 'orden de compra',
        observaciones: 'Pagado desde dashboard',
        fechaEsperada: new Date().toISOString().split('T')[0]
      });
      
      // Actualizar datos
      setRequisicionesAprobadas(prev => 
        prev.map(req => 
          req.id === id ? { ...req, status: 'pagada' } : req
        )
      );
    } catch (error) {
      console.error('Error pagando requisición:', error);
    }
  };

  const chartData = getChartData();
  const almacenesData = getAlmacenesComparativa();
  const stats = getStatusStats();
  const productosPendientes = getProductosPendientes();

  const statCards = [
    { 
      titulo: 'Órdenes Totales', 
      valor: requisicionesAprobadas.length.toString(), 
      cambio: `+${requisicionesAprobadas.length}`, 
      icon: FiShoppingCart,
      color: 'blue',
      fondo: 'bg-blue-50'
    },
    { 
      titulo: 'Pagadas', 
      valor: `$${stats.pagadas}`, 
      cambio: '+2', 
      icon: FiCheck,
      color: 'green',
      fondo: 'bg-green-50'
    },
    { 
      titulo: 'Pendientes', 
      valor: `$${stats.pendientes}`, 
      cambio: '+1', 
      icon: FiClock,
      color: 'yellow',
      fondo: 'bg-yellow-50'
    },
    { 
      titulo: 'Gasto Total', 
      valor: `$${stats.totalGasto}`, 
      cambio: '+5%', 
      icon: FiDollarSign,
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Gestión de Compras
          </h2>
          <p className="text-gray-500 mt-1">
            Controla tus compras y pagos
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
            General
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
            Detallado
          </button>
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
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comparativa por Almacén */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border 
                          border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Comparativa por Almacén
              </h3>
              {almacenesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={almacenesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="pagadas" fill="#10b981" name="Pagadas" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="pendientes" fill="#f59e0b" name="Pendientes" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sin datos disponibles</p>
              )}
            </div>

            {/* Tendencias */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border 
                          border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Pagadas vs Pendientes
              </h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="pagadas" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                      name="Pagadas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pendientes" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', r: 4 }}
                      name="Pendientes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sin datos disponibles</p>
              )}
            </div>
          </div>

          {/* Productos Pendientes */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FiTruck className="text-red-600" />
              Productos Pendientes de Recibir
            </h3>
            {productosPendientes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left py-4 px-6 font-bold text-gray-900">
                        Producto
                      </th>
                      <th className="text-center py-4 px-6 font-bold text-gray-900">
                        Recibida
                      </th>
                      <th className="text-center py-4 px-6 font-bold text-gray-900">
                        Esperada
                      </th>
                      <th className="text-center py-4 px-6 font-bold text-gray-900">
                        Faltante
                      </th>
                      <th className="text-left py-4 px-6 font-bold text-gray-900">
                        Almacén
                      </th>
                      <th className="text-left py-4 px-6 font-bold text-gray-900">
                        Fecha Esperada
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosPendientes.map((item, idx) => (
                      <tr 
                        key={item.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 
                                 transition-colors duration-200 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="py-4 px-6 font-semibold text-gray-900">
                          {item.producto}
                        </td>
                        <td className="py-4 px-6 text-center text-gray-700">
                          {item.recibida}
                        </td>
                        <td className="py-4 px-6 text-center text-gray-700">
                          {item.esperada}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-3 py-1 rounded-full bg-red-100 
                                       text-red-800 font-bold text-sm">
                            {item.faltante}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {item.almacen}
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {new Date(item.fechaEsperada).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">✓ Todos los productos han sido recibidos</p>
            )}
          </div>

          {/* Órdenes Aprobadas */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Órdenes para Pagar
            </h3>
            {requisicionesAprobadas.length > 0 ? (
              <div className="space-y-4">
                {requisicionesAprobadas
                  .filter(req => req.status !== 'pagada')
                  .slice(0, 5)
                  .map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-4 bg-gray-50 
                               rounded-lg border border-gray-200 hover:bg-gray-100 
                               transition"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {req.titulo}
                        </p>
                        <p className="text-sm text-gray-500">
                          Solicitado por: {req.pedidoPor?.name} | Almacén: {req.almacenDestino?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-gray-900">
                          ${req.cantidad_dinero}
                        </p>
                        <button
                          onClick={() => handlePagar(req.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg 
                                   font-semibold hover:bg-green-700 transition"
                        >
                          Marcar Pagada
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500">No hay órdenes pendientes de pago</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'detailed' && (
        <div className="space-y-8">
          {/* Bar Chart Comparativa Detallada */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border 
                        border-gray-200 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Análisis por Almacén (Detallado)
            </h3>
            {almacenesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={almacenesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="pagadas" fill="#10b981" name="Pagadas" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pendientes" fill="#f59e0b" name="Pendientes" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">Sin datos disponibles</p>
            )}
          </div>

          {/* Tabla de todas las órdenes */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Todas las Órdenes Aprobadas
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 font-bold text-gray-900">
                      Título
                    </th>
                    <th className="text-left py-4 px-6 font-bold text-gray-900">
                      Almacén
                    </th>
                    <th className="text-left py-4 px-6 font-bold text-gray-900">
                      Solicitado por
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
                  {requisicionesAprobadas.map((req, idx) => (
                    <tr 
                      key={req.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 
                               transition-colors duration-200 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="py-4 px-6 font-semibold text-gray-900 line-clamp-1">
                        {req.titulo}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {req.almacenDestino?.name}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {req.pedidoPor?.name}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-red-600">
                        ${req.cantidad_dinero}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          req.status === 'pagada'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
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

export default AdminComprasDashboard;