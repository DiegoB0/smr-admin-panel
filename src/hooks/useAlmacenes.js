import { api } from "../api/api"

export function useAlmacenes() {
  /**
   * Create a new almacen.
   * @param {object} data
   * @return {Promise<AxiosResponse>}
   */
  const createAlmacen = (data) => api.post("almacenes/add", data)

  /**
   * Fetch list of almacenes.
   * @param {object} [params] – query params (e.g. { page: 1 })
   * @returns {Promise<AxiosResponse>}
   */
  const listAlmacen = ({ page = 1, limit = 10, search = "", order = "ASC" } = {}) => {
    const safeLimit = limit === 0 ? 100 : limit
    const params = { page, limit: safeLimit, search, order }
    return api.get("almacenes/all_almacenes", { params })
  }

  const listEncargados = (almacenId) =>
    api.get("almacenes/encargados/all_encargados", {
      params: almacenId ? { almacenId } : {}
    });


  const getOneAlmacen = (id) => api.get(`almacenes/find_almacen/${id}`)

  /**
   * Delete an almacen.
   * @param {string|number} id
   * @return {Promise<AxiosResponse>}
   */
  const deleteAlmacen = (id) => api.delete(`almacenes/delete_almacen/${id}`)

  /**
   * Update an almacen.
   * @param {string|number} id
   * @param {object} data
   * @return {Promise<AxiosResponse>}
   */
  const updateAlmacen = (id, data) => api.patch(`almacenes/update_almacen/${id}`, data)

  return {
    createAlmacen,
    listAlmacen,
    listEncargados,
    getOneAlmacen,
    deleteAlmacen,
    updateAlmacen,
  }
}

