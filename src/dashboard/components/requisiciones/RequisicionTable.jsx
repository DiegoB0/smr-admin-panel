"use client"
import React from 'react'
import { Edit, Trash2, AlertCircle } from "lucide-react"

const RequisicionTable = ({ requisiciones, onEdit, onDelete }) => {
  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: "bg-yellow-100 text-yellow-800",
      aprobada: "bg-blue-100 text-blue-800",
      completada: "bg-green-100 text-green-800",
      rechazada: "bg-red-100 text-red-800",
    }

    return badges[estado] || "bg-gray-100 text-gray-800"
  }

  const getPrioridadBadge = (prioridad) => {
    const badges = {
      alta: "bg-red-100 text-red-800",
      media: "bg-yellow-100 text-yellow-800",
      baja: "bg-green-100 text-green-800",
    }

    return badges[prioridad] || "bg-gray-100 text-gray-800"
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  if (requisiciones.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay requisiciones</h3>
        <p className="text-gray-500">No se encontraron requisiciones con los filtros aplicados.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Departamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Solicitante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prioridad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requisiciones.map((requisicion) => (
              <tr key={requisicion.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {requisicion.numero}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {requisicion.fecha}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {requisicion.departamento}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {requisicion.solicitante}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      requisicion.estado === 'aprobada'
                        ? 'bg-green-100 text-green-800'
                        : requisicion.estado === 'completada'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {requisicion.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      requisicion.prioridad === 'alta'
                        ? 'bg-red-100 text-red-800'
                        : requisicion.prioridad === 'media'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {requisicion.prioridad}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${requisicion.total.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => onEdit(requisicion)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(requisicion.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RequisicionTable
