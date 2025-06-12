import React from 'react'
import { Clock, CheckCircle, XCircle } from "lucide-react"

const RequisicionStats = ({ requisiciones }) => {
  const stats = {
    total: requisiciones.length,
    pendientes: requisiciones.filter((r) => r.estado === "pendiente").length,
    aprobadas: requisiciones.filter((r) => r.estado === "aprobada").length,
    completadas: requisiciones.filter((r) => r.estado === "completada").length,
    rechazadas: requisiciones.filter((r) => r.estado === "rechazada").length,
  }

  const statCards = [
    {
      title: "Total",
      value: stats.total,
      icon: Clock,
      color: "bg-gray-500",
      bgColor: "bg-gray-50",
    },
    {
      title: "Pendientes",
      value: stats.pendientes,
      icon: Clock,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Aprobadas",
      value: stats.aprobadas,
      icon: CheckCircle,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Completadas",
      value: stats.completadas,
      icon: CheckCircle,
      color: "bg-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Rechazadas",
      value: stats.rechazadas,
      icon: XCircle,
      color: "bg-red-500",
      bgColor: "bg-red-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={index} className={`${stat.bgColor} p-4 rounded-lg border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-2 rounded-full`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RequisicionStats
