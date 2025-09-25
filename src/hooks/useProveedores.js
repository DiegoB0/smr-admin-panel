import { api } from "../api/api"

export function useProveedores() {
  // Crear nuevo proveedor
  const createProveedor = (data) => api.post("/proveedores/add", data)

  // Listar todos los proveedores
  const listProveedores = ({ page = 1, limit = 10, search = "", order = "ASC" } = {}) => {
    const safeLimit = limit === 0 ? 100 : limit
    const params = { page, limit: safeLimit, search, order }
    return api.get("/proveedores/all_proveedores", { params })
  }

  // Obtener un proveedor por ID (opcional si lo necesitas después)
  const getOneProveedor = (id) => api.get(`/proveedores/find_proveedor/${id}`)

  // Eliminar un proveedor
  const deleteProveedor = (id) => api.delete(`/proveedores/delete_proveedor/${id}`)

  // Actualizar un proveedor
  const updateProveedor = (id, data) => api.patch(`/proveedores/update_proveedor/${id}`, data)

  return {
    createProveedor,
    listProveedores,
    getOneProveedor,
    deleteProveedor,
    updateProveedor,
  }
}
