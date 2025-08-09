import { api } from "../api/api"

export function useObras() {
  // Crear nueva obra
  const createObra = (data) => api.post("obras/add", data)

  // Listar obras
  const listObras = ({ page = 1, limit = 10, search = "", order = "ASC" } = {}) => {
    const safeLimit = limit === 0 ? 100 : limit
    const params = { page, limit: safeLimit, search, order }
    return api.get("obras/all_obras", { params })
  }

  // Obtener una obra por ID
  const getOneObra = (id) => api.get(`obras/find_obra/${id}`)

  // Eliminar una obra
  const deleteObra = (id) => api.delete(`obras/delete_obra/${id}`)

  // Actualizar una obra
  const updateObra = (id, data) => api.patch(`obras/update_obra/${id}`, data)

  return {
    createObra,
    listObras,
    getOneObra,
    deleteObra,
    updateObra
  }
}


