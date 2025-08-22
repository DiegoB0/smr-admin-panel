const InventoryChart = () => {
  const data = [
    { mes: "Ene", entradas: 120, salidas: 80 },
    { mes: "Feb", entradas: 150, salidas: 95 },
    { mes: "Mar", entradas: 180, salidas: 110 },
    { mes: "Abr", entradas: 140, salidas: 125 },
    { mes: "May", entradas: 200, salidas: 145 },
    { mes: "Jun", entradas: 175, salidas: 130 },
  ]

  const maxValue = Math.max(...data.map((item) => Math.max(item.entradas, item.salidas)))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Movimientos de Inventario</h3>
      <div className="space-y-6">
        {data.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="flex justify-between text-sm font-medium text-gray-700">
              <span>{item.mes}</span>
            </div>
            <div className="space-y-2">
              {/* Barra de Entradas */}
              <div className="flex items-center space-x-3">
                <div className="w-16 text-xs text-gray-600">Entradas</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ width: `${(item.entradas / maxValue) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{item.entradas}</span>
                  </div>
                </div>
              </div>
              {/* Barra de Salidas */}
              <div className="flex items-center space-x-3">
                <div className="w-16 text-xs text-gray-600">Salidas</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ width: `${(item.salidas / maxValue) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{item.salidas}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default InventoryChart