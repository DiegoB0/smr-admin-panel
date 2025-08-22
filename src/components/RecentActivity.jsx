import { getRecentMovements } from "../hooks/mockData"

const RecentActivity = () => {
  const movements = getRecentMovements()

  const getMovementIcon = (type) => {
    switch (type) {
      case "entrada":
        return "📥"
      case "salida":
        return "📤"
      case "requisicion":
        return "📋"
      default:
        return "📊"
    }
  }

  const getMovementColor = (type) => {
    switch (type) {
      case "entrada":
        return "text-green-600 bg-green-100"
      case "salida":
        return "text-red-600 bg-red-100"
      case "requisicion":
        return "text-blue-600 bg-blue-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
      <div className="space-y-3">
        {movements.map((movement) => (
          <div key={movement.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className={`p-2 rounded-full ${getMovementColor(movement.type)}`}>
                {getMovementIcon(movement.type)}
              </span>
              <div>
                <p className="font-medium text-gray-900">{movement.product}</p>
                <p className="text-sm text-gray-600">
                  {movement.type.charAt(0).toUpperCase() + movement.type.slice(1)} - Cantidad: {movement.quantity}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{movement.date}</p>
              <p className="text-sm font-medium text-gray-700">{movement.user}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentActivity