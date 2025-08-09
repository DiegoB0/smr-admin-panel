import { api } from "../api/api"

export function useObras() {
  const createObra = (data) => api.post("obras/add", data)


  const listObras = ({ page = 1, limit = 10, search = "", order = "ASC" } = {}) => {
    const safeLimit = limit === 0 ? 100 : limit
    const params = {
      page,
      limit: safeLimit,
      search,
      order,
    };
    return api.get("obras/all_obras", { params })
  }

  const listAllowedObras = ({ page = 1, limit = 10, search = "", order = "ASC", almacenId } = {}) => {
    const safeLimit = limit === 0 ? 100 : limit
    const params = {
      page,
      limit: safeLimit,
      search,
      order,
      ...(almacenId ? { almacenId } : {}),
    };
    return api.get("obras/allowed_obras", { params })
  }

  const getOneObra = (id) => api.get(`obras/find_obras/${id}`)

  const deleteObra = (id) => api.delete(`obras/delete_obras/${id}`)

  const updateObra = (id, data) => api.patch(`obras/update_obras/${id}`, data)

  return {
    createObra,
    listObras,
    listAllowedObras,
    getOneObra,
    deleteObra,
    updateObra
  }
}

