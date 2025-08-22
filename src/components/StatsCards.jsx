import { getStats, getLowStockProducts } from "../hooks/mockData"

const StatsCards = () => {
  const stats = getStats()
  const lowStockProducts = getLowStockProducts()

  const cards = [
    {
      title: "Total Productos",
      value: "1,247",
      change: "+12% desde el mes pasado",
      changeColor: "text-green-600",
      icon: "📦",
      iconColor: "text-blue-600",
    },
    {
      title: "Usuarios Activos",
      value: "23",
      change: "+3 desde el mes pasado",
      changeColor: "text-green-600",
      icon: "👥",
      iconColor: "text-green-600",
    },
    {
      title: "Equipos",
      value: "89",
      change: "-2 desde el mes pasado",
      changeColor: "text-red-600",
      icon: "🔧",
      iconColor: "text-gray-600",
    },
    {
      title: "Movimientos Hoy",
      value: "47",
      change: "+18% desde el mes pasado",
      changeColor: "text-green-600",
      icon: "📊",
      iconColor: "text-orange-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-2">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className={`text-xs ${card.changeColor}`}>{card.change}</p>
            </div>
            <div className={`${card.iconBg} ${card.iconColor} p-3 rounded-lg`}>
              <span className="text-xl">{card.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards