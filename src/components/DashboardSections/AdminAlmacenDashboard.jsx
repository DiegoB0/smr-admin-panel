// components/DashboardSections/AdminAlmacenDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, 
         CartesianGrid, Tooltip, ResponsiveContainer, PieChart, 
         Pie, Cell, Legend } from 'recharts';
import { FiPackage, FiTruck, FiShoppingCart, FiBox } from 'react-icons/fi';
import { api } from '../../api/api';

function AdminAlmacenDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [productos, setProductos] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const [loading, setLoading] = useState(true);

  const almacenId = 5; // Durango Taller - cambiar cuando tengas el endpoint

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [prodRes, entradasRes, salidasRes] = await Promise.all([
          api.get('/productos/all_productos'),
          api.get(`/entradas/${almacenId}`),
          api.get(`/salidas/almacen/${almacenId}`)
        ]);

        console.log('Productos:', prodRes.data.data);
        console.log('Entradas:', entradasRes.data.data);
        console.log('Salidas:', salidasRes.data.data);

        setProductos(prodRes.data.data || []);
        setEntradas(entradasRes.data.data || []);
        setSalidas(salidasRes.data.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calcular stats
  const getTotalInventario = () => {
    return productos.reduce((total, prod) => total + (prod.stock || 0), 0);
  };

  const getTotalEntradas = () => {
    let total = 0;
    entradas.forEach(entrada => {
      entrada.items?.forEach(item => {
        total += item.cantidadRecibida || 0;
      });
    });
    return total;
  };

  const getTotalSalidas = () => {
    let total = 0;
    salidas.forEach(salida => {
      salida.items?.forEach(item => {
        total += item.cantidadRetirada || 0;
      });
    });
    return total;
  };

  // Gráfica de movimientos por mes
  const getMovimientosChart = () => {
    const meses = {};

    // Entradas
    entradas.forEach(entrada => {
      const fecha = new Date(entrada.fechaCreacion);
      const mes = fecha.toLocaleString('es-ES', { month: 'short' });

      if (!meses[mes]) {
        meses[mes] = { mes, entradas: 0, salidas: 0 };
      }

      entrada.items?.forEach(item => {
        meses[mes].entradas += item.cantidadRecibida || 0;
      });
    });

    // Salidas
    salidas.forEach(salida => {
      const fecha = new Date(salida.fecha);
      const mes = fecha.toLocaleString('es-ES', { month: 'short' });

      if (!meses[mes]) {
        meses[mes] = { mes, entradas: 0, salidas: 0 };
      }

      salida.items?.forEach(item => {
        meses[mes].salidas += item.cantidadRetirada || 0;
      });
    });

    return Object.values(meses).slice(-6);
  };

  // Movimiento de Inventario por Producto
  const getMovimientoProductos = () => {
    const movimientos = {};

    // Contar entradas por producto
    entradas.forEach(entrada => {
      entrada.items?.forEach(item => {
        const prodName = item.producto?.name;
        if (prodName) {
          if (!movimientos[prodName]) {
            movimientos[prodName] = { name: prodName, entradas: 0, salidas: 0 };
          }
          movimientos[prodName].entradas += item.cantidadRecibida || 0;
        }
      });
    });

    // Contar salidas por producto
    salidas.forEach(salida => {
      salida.items?.forEach(item => {
        const prodName = item.producto?.name;
        if (prodName) {
          if (!movimientos[prodName]) {
            movimientos[prodName] = { name: prodName, entradas: 0, salidas: 0 };
          }
          movimientos[prodName].salidas += item.cantidadRetirada || 0;
        }
      });
    });

    // Ordenar por total de movimiento y retornar top 6
    return Object.values(movimientos)
      .sort((a, b) => (b.entradas + b.salidas) - (a.entradas + a.salidas))
      .slice(0, 6);
  };

  // Productos con bajo stock
  const getProductosBajoStock = () => {
    return productos
      .filter(prod => prod.stock < 50)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);
  };

  // Últimas salidas
  const getUltimasSalidas = () => {
    return salidas
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 5)
      .map(salida => ({
        id: salida.id,
        fecha: new Date(salida.fecha).toLocaleDateString(),
        autoriza: salida.authoriza?.name,
        recibida: salida.recibidaPor,
        items: salida.items
      }));
  };

  // Últimas entradas
  const getUltimasEntradas = () => {
    return entradas
      .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
      .slice(0, 5)
      .map(entrada => ({
        id: entrada.id,
        fecha: new Date(entrada.fechaCreacion).toLocaleDateString(),
        creadoPor: entrada.creadoPor?.name,
        items: entrada.items
      }));
  };

  const movimientosChart = getMovimientosChart();
  const movimientoProductos = getMovimientoProductos();
  const productosBajoStock = getProductosBajoStock();
  const ultimasSalidas = getUltimasSalidas();
  const ultimasEntradas = getUltimasEntradas();

  const totalInventario = getTotalInventario();
  const totalEntradas = getTotalEntradas();
  const totalSalidas = getTotalSalidas();

  const statCards = [
    {
      titulo: 'Total Inventario',
      valor: totalInventario.toString(),
      cambio: `+${totalSalidas}`,
      icon: FiPackage,
      color: 'blue',
      fondo: 'bg-blue-50'
    },
    {
      titulo: 'Total Entradas',
      valor: totalEntradas.toString(),
      cambio: `+${entradas.length}`,
      icon: FiTruck,
      color: 'green',
      fondo: 'bg-green-50'
    },
    {
      titulo: 'Total Salidas',
      valor: totalSalidas.toString(),
      cambio: `+${salidas.length}`,
      icon: FiShoppingCart,
      color: 'red',
      fondo: 'bg-red-50'
    },
    {
      titulo: 'Productos',
      valor: productos.length.toString(),
      cambio: `${productosBajoStock.length} bajo stock`,
      icon: FiBox,
      color: 'yellow',
      fondo: 'bg-yellow-50'
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
            Administración de Almacén
          </h2>
          <p className="text-gray-500 mt-1">
            Gestiona tu inventario y movimientos
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
            red: 'text-red-600',
            yellow: 'text-yellow-600',
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
          {/* Acciones Rápidas */}
<div className="bg-gradient-to-r from-slate-700 to-slate-800 p-8 rounded-2xl 
              text-white shadow-lg">
  <h3 className="text-xl font-bold mb-4">Acciones Rápidas</h3>
  <div className="flex flex-wrap gap-3">
    <button 
      onClick={() => navigate(`/dashboard/salidas/${almacenId}`)}
      className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-bold 
                 transition-colors">
      + Registrar Salida
    </button>
    <button 
      onClick={() => navigate('/dashboard/requisiciones')}
      className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-bold 
                 transition-colors">
      📋 Crear Requisición
    </button>
    <button 
      onClick={() => navigate(`/dashboard/entradas/${almacenId}`)}
      className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-bold 
                 transition-colors">
      📥 Ver Entradas
    </button>
  </div>
</div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Movimientos por Mes */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border 
                          border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Entradas vs Salidas
              </h3>
              {movimientosChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={movimientosChart}>
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
                    <Bar 
                      dataKey="entradas" 
                      fill="#10b981" 
                      radius={[8, 8, 0, 0]}
                      name="Entradas"
                    />
                    <Bar 
                      dataKey="salidas" 
                      fill="#ef4444" 
                      radius={[8, 8, 0, 0]}
                      name="Salidas"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sin datos disponibles</p>
              )}
            </div>

            {/* Movimiento de Inventario por Producto */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border 
                          border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Movimiento de Inventario
              </h3>
              {movimientoProductos.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={movimientoProductos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="entradas" 
                      fill="#10b981" 
                      radius={[8, 8, 0, 0]}
                      name="Entradas"
                    />
                    <Bar 
                      dataKey="salidas" 
                      fill="#ef4444" 
                      radius={[8, 8, 0, 0]}
                      name="Salidas"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sin datos disponibles</p>
              )}
            </div>
          </div>

          {/* Productos bajo stock */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              ⚠️ Productos con Bajo Stock
            </h3>
            {productosBajoStock.length > 0 ? (
              <div className="space-y-3">
                {productosBajoStock.map((prod, idx) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-4 bg-gray-50 
                             rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {prod.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Precio: ${prod.precio}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-2xl">
                        {prod.stock}
                      </p>
                      <p className="text-xs text-gray-500">
                        {prod.unidad}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-600 font-semibold">
                ✓ Todo el stock está en buen estado
              </p>
            )}
          </div>

          {/* Últimas salidas */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Últimas Salidas
            </h3>
            {ultimasSalidas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left py-4 px-6 font-bold text-gray-900">
                        Fecha
                      </th>
                      <th className="text-left py-4 px-6 font-bold text-gray-900">
                        Autoriza
                      </th>
                      <th className="text-left py-4 px-6 font-bold text-gray-900">
                        Recibida por
                      </th>
                      <th className="text-center py-4 px-6 font-bold text-gray-900">
                        Productos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimasSalidas.map((salida, idx) => (
                      <tr 
                        key={salida.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 
                                 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="py-4 px-6 text-gray-700">
                          {salida.fecha}
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-900">
                          {salida.autoriza}
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {salida.recibida || 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-3 py-1 rounded-full bg-red-100 
                                       text-red-800 font-bold text-sm">
                            {salida.items.length} items
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No hay salidas registradas</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'detailed' && (
        <div className="space-y-8">
          {/* Tendencias */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border 
                        border-gray-200 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Tendencias Mensuales Detalladas
            </h3>
            {movimientosChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={movimientosChart}>
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
                    dataKey="entradas" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="Entradas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="salidas" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 4 }}
                    name="Salidas"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">Sin datos disponibles</p>
            )}
          </div>

          {/* Todos los productos */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Inventario Completo
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 font-bold text-gray-900">
                      Producto
                    </th>
                    <th className="text-left py-4 px-6 font-bold text-gray-900">
                      Descripción
                    </th>
                    <th className="text-center py-4 px-6 font-bold text-gray-900">
                      Stock
                    </th>
                    <th className="text-left py-4 px-6 font-bold text-gray-900">
                      Unidad
                    </th>
                    <th className="text-center py-4 px-6 font-bold text-gray-900">
                      Precio
                    </th>
                    <th className="text-left py-4 px-6 font-bold text-gray-900">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod, idx) => (
                    <tr 
                      key={prod.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 
                               transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="py-4 px-6 font-semibold text-gray-900">
                        {prod.name}
                      </td>
                      <td className="py-4 px-6 text-gray-700 line-clamp-1">
                        {prod.description}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-gray-900">
                        {prod.stock}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {prod.unidad}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-red-600">
                        ${prod.precio}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          prod.stock > 50
                            ? 'bg-green-100 text-green-800'
                            : prod.stock > 20
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {prod.stock > 50 
                            ? '✓ Óptimo' 
                            : prod.stock > 20 
                            ? '⚠ Bajo' 
                            : '🔴 Crítico'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Todas las entradas */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Historial de Entradas
            </h3>
            {ultimasEntradas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left py-4 px-6 font-bold text-gray-900">
                        Fecha
                      </th>
                      <th className="text-left py-4 px-6 font-bold text-gray-900">
                        Creado por
                      </th>
                      <th className="text-left py-4 px-6 font-bold text-gray-900">
                        Productos
                      </th>
                      <th className="text-center py-4 px-6 font-bold text-gray-900">
                        Cantidad
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimasEntradas.map((entrada, idx) => {
                      const totalItems = entrada.items.reduce(
                        (sum, item) => sum + (item.cantidadRecibida || 0), 
                        0
                      );
                      return (
                        <tr 
                          key={entrada.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 
                                   transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="py-4 px-6 text-gray-700">
                            {entrada.fecha}
                          </td>
                          <td className="py-4 px-6 font-semibold text-gray-900">
                            {entrada.creadoPor}
                          </td>
                          <td className="py-4 px-6 text-gray-700">
                            {entrada.items
                              .map(item => item.producto?.name)
                              .join(', ')}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-3 py-1 rounded-full bg-green-100 
                                         text-green-800 font-bold text-sm">
                              {totalItems}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No hay entradas registradas</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAlmacenDashboard;