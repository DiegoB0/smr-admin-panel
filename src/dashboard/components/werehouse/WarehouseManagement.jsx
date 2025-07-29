// src/components/warehouse/WarehouseManagement.jsx
import React, { useState } from 'react';
import { useAlmacenes } from '../../../hooks/useAlmacenes';
import LoadingSpinner from './LoadingSpinner';
import WarehouseStats from './WarehouseStats';

const WarehouseManagement = () => {
  const { almacenes, loading, error, handleDelete } = useAlmacenes();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar almacenes
  const filteredAlmacenes = almacenes.filter((almacen) =>
    almacen.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    almacen.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Almacenes</h1>
            <p className="text-gray-600 mt-1">Administra y monitorea todos tus almacenes</p>
          </div>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <span className="mr-2">+</span>
            Nuevo Almacén
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Stats */}
      <WarehouseStats warehouses={almacenes} />

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar almacenes por nombre o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Almacenes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlmacenes.map((almacen) => (
          <div key={almacen.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {almacen.nombre || 'Sin nombre'}
                  </h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <span className="mr-2">📍</span>
                    <span className="text-sm">{almacen.ubicacion || 'Sin ubicación'}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  almacen.estado?.toLowerCase() === 'activo' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {almacen.estado || 'Sin estado'}
                </span>
              </div>

              {/* Detalles */}
              <div className="space-y-2 mb-4">
                {almacen.direccion && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Dirección:</span> {almacen.direccion}
                  </div>
                )}
                {almacen.encargado && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">👤</span>
                    <span>Encargado: {almacen.encargado}</span>
                  </div>
                )}
                {almacen.telefono && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📞</span>
                    <span>{almacen.telefono}</span>
                  </div>
                )}
                {almacen.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">✉️</span>
                    <span>{almacen.email}</span>
                  </div>
                )}
                {almacen.capacidad && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📦</span>
                    <span>Capacidad: {almacen.capacidad} unidades</span>
                  </div>
                )}
              </div>

              {/* Fecha de creación */}
              {almacen.created_at && (
                <div className="text-xs text-gray-500 mb-4">
                  Creado: {new Date(almacen.created_at).toLocaleDateString('es-MX')}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button 
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                  title="Editar almacén"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de eliminar este almacén?')) {
                      handleDelete(almacen.id);
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" 
                  title="Eliminar almacén"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAlmacenes.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron almacenes' : 'No hay almacenes registrados'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Intenta ajustar los términos de búsqueda' 
              : 'Comienza creando tu primer almacén'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default WarehouseManagement;