// src/components/warehouse/WarehouseStats.jsx
import React from 'react';

const WarehouseStats = ({ warehouses = [] }) => {
  const totalWarehouses = warehouses.length;
  const activeWarehouses = warehouses.filter((w) => w.estado?.toLowerCase() === 'activo').length;

  const stats = [
    {
      title: 'Total Almacenes',
      value: totalWarehouses,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      icon: '📦'
    },
    {
      title: 'Activos',
      value: activeWarehouses,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      icon: '✅'
    },
    {
      title: 'Inactivos',
      value: totalWarehouses - activeWarehouses,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      icon: '❌'
    },
    {
      title: 'Capacidad Total',
      value: warehouses.reduce((sum, w) => sum + (w.capacidad || 0), 0),
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      icon: '📊'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <span className="text-white text-xl">{stat.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WarehouseStats;