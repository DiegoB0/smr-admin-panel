"use client"
import React from 'react'
import { Search, Download } from "lucide-react"

const RequisicionFilters = ({ filters, onFiltersChange, className = "" }) => {
  const handleChange = (e) => {
    const { name, value } = e.target
    onFiltersChange({ ...filters, [name]: value })
  }

  const exportToCSV = () => {
    // Aquí implementarías la lógica de exportación
    console.log("Exportando a CSV...")
  }

  return (
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            name="estado"
            value={filters.estado}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="completada">Completada</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
          <input
            type="text"
            name="departamento"
            value={filters.departamento}
            onChange={handleChange}
            placeholder="Filtrar por departamento"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
          <input
            type="date"
            name="fechaInicio"
            value={filters.fechaInicio}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
          <input
            type="date"
            name="fechaFin"
            value={filters.fechaFin}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda</label>
          <input
            type="text"
            name="busqueda"
            value={filters.busqueda}
            onChange={handleChange}
            placeholder="Buscar por número o solicitante"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Botón exportar */}
        <div>
          <button
            onClick={exportToCSV}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>
    </div>
  )
}

export default RequisicionFilters
