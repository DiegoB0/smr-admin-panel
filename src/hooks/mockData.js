// Interfaces y tipos de datos
export const mockData = {
  // Datos de productos
  products: [
    { id: 1, name: "Cemento Portland", stock: 150, minStock: 50, category: "Construcción" },
    { id: 2, name: "Varilla 3/8", stock: 25, minStock: 30, category: "Acero" },
    { id: 3, name: "Arena", stock: 200, minStock: 100, category: "Agregados" },
    { id: 4, name: "Grava", stock: 180, minStock: 80, category: "Agregados" },
    { id: 5, name: "Ladrillo", stock: 500, minStock: 200, category: "Construcción" },
  ],

  // Datos de usuarios
  users: [
    { id: 1, name: "Carmen Monarrez", role: "ADMIN", email: "carmen@empresa.com" },
    { id: 2, name: "Juan Pérez", role: "OPERADOR", email: "juan@empresa.com" },
    { id: 3, name: "María García", role: "ADMIN_ALMACEN", email: "maria@empresa.com" },
  ],

  // Movimientos recientes
  movements: [
    { id: 1, type: "ENTRADA", product: "Tornillos 1/4", quantity: 50, date: "2024-01-15", user: "Juan Pérez" },
    { id: 2, type: "SALIDA", product: "Filtros CAT", quantity: 10, date: "2024-01-14", user: "María García" },
    { id: 3, type: "REQUISICION", product: "Arandelas", quantity: 25, date: "2024-01-13", user: "Carmen Monarrez" },
    { id: 4, type: "ENTRADA", product: "Aerosoles", quantity: 100, date: "2024-01-12", user: "Juan Pérez" },
    { id: 5, type: "SALIDA", product: "Bandas", quantity: 30, date: "2024-01-11", user: "María García" },
  ],
}

// Funciones para obtener datos
export const getStats = () => {
  const totalProducts = mockData.products.length
  const totalUsers = mockData.users.length
  const totalMovements = mockData.movements.length
  const lowStockProducts = mockData.products.filter((p) => p.stock <= p.minStock).length

  return {
    totalProducts,
    totalUsers,
    totalEquipment: 15, // Dato simulado
    totalMovements,
    lowStockProducts,
    pendingRequisitions: 3, // Dato simulado
  }
}

export const getRecentMovements = () => {
  return mockData.movements.slice(0, 5)
}

export const getLowStockProducts = () => {
  return mockData.products.filter((p) => p.stock <= p.minStock)
}

export const getInventoryChartData = () => {
  return [
    { month: "Ene", entradas: 120, salidas: 80 },
    { month: "Feb", entradas: 150, salidas: 95 },
    { month: "Mar", entradas: 180, salidas: 110 },
    { month: "Abr", entradas: 200, salidas: 130 },
    { month: "May", entradas: 170, salidas: 120 },
    { month: "Jun", entradas: 190, salidas: 140 },
  ]
}
