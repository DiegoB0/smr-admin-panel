"use client"

import { useNavigate } from "react-router-dom"

const QuickActions = ({ userRole }) => {
  const navigate = useNavigate()

  const handleAction = (actionType) => {
    switch (actionType) {
      case "requisicion":
        navigate("/dashboard/requisiciones")
        break
      case "inventario":
        navigate("/dashboard/almacenes")
        break
      case "usuarios":
        navigate("/dashboard/users")
        break
      default:
        alert(`Función ${actionType} en desarrollo`)
    }
  }

  const getActionsForRole = (role) => {
    const baseActions = [
      {
        name: "Nueva Requisición",
        description: "Crear solicitud de materiales",
        icon: "📋",
        color: "bg-blue-500 hover:bg-blue-600",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        action: "requisicion",
      },
      {
        name: "Ver Inventario",
        description: "Consultar productos disponibles",
        icon: "📦",
        color: "bg-green-500 hover:bg-green-600",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        action: "inventario",
      },
    ]

    if (role === "admin" || role === "admin-almacen") {
      return [
        ...baseActions,
        {
          name: "Registrar Entrada",
          description: "Añadir productos al inventario",
          icon: "📥",
          color: "bg-purple-500 hover:bg-purple-600",
          iconBg: "bg-purple-100",
          iconColor: "text-purple-600",
          action: "entrada",
        },
        {
          name: "Registrar Salida",
          description: "Retirar productos del almacén",
          icon: "📤",
          color: "bg-orange-500 hover:bg-orange-600",
          iconBg: "bg-orange-100",
          iconColor: "text-orange-600",
          action: "salida",
        },
        {
          name: "Generar Reporte",
          description: "Generar informes de inventario",
          icon: "📊",
          color: "bg-indigo-500 hover:bg-indigo-600",
          iconBg: "bg-indigo-100",
          iconColor: "text-indigo-600",
          action: "reporte",
        },
        {
          name: "Gestionar Usuarios",
          description: "Administrar acceso y roles de usuarios",
          icon: "👥",
          color: "bg-pink-500 hover:bg-pink-600",
          iconBg: "bg-pink-100",
          iconColor: "text-pink-600",
          action: "usuarios",
        },
      ]
    }

    if (role === "operador") {
      return [
        ...baseActions,
        {
          name: "Registrar Entrada",
          description: "Añadir productos al inventario",
          icon: "📥",
          color: "bg-green-500 hover:bg-green-600",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          action: "entrada",
        },
        {
          name: "Registrar Salida",
          description: "Retirar productos del almacén",
          icon: "📤",
          color: "bg-orange-500 hover:bg-orange-600",
          iconBg: "bg-orange-100",
          iconColor: "text-orange-600",
          action: "salida",
        },
      ]
    }

    return baseActions
  }

  const actions = getActionsForRole(userRole)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Acciones Rápidas</h3>
      <div className="space-y-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleAction(action.action)}
            className="w-full flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
          >
            <div className={`${action.iconBg} ${action.iconColor} p-3 rounded-lg`}>
              <span className="text-xl">{action.icon}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{action.name}</p>
              <p className="text-sm text-gray-600">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default QuickActions
