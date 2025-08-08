import { api } from '../api/api';

export function useProductos() {
  /**
   * Create a new product.
   * @param {object} data
   * @return {Promise<AxiosResponse>}
   */
  const createProducto = (data) => api.post('productos/add', data);

  /**
   * Fetch list of products.
   * @param {object} [params]
   * @returns {Promise<AxiosResponse>}
   */
  const listProductos = ({
    page = 1,
    limit = 10,
    search = '',
    order = 'ASC'
  }) => {
    const params = { page, limit, search, order };
    return api.get('productos/all_productos', { params });
  };

  /**
   * Fetch a single product by id.
   * @param {string|number} id
   * @return {Promise<AxiosResponse>}
   */
  const getOneProducto = (id) => api.get(`productos/find_producto/${id}`);

  /**
   * Delete a product.
   * @param {string|number} id
   * @return {Promise<AxiosResponse>}
   */
  const deleteProducto = (id) => api.delete(`productos/delete_producto/${id}`);

  /**
   * Update a product.
   * @param {string|number} id
   * @param {object} data
   * @return {Promise<AxiosResponse>}
   */
  const updateProducto = (id, data) => api.patch(`productos/update_producto/${id}`, data);

  return {
    createProducto,
    listProductos,
    getOneProducto,
    deleteProducto,
    updateProducto,
  };
}
