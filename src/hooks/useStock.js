import { api } from "../api/api";

export function useStock() {
  /**
   * Agrega stock de un producto a un almacén.
   * @param {object} data - { almacenId, productId, cantidad }
   * @return {Promise<AxiosResponse>}
   */
  const addStock = (data) => api.post("almacenes/products/add_stock", data);

  /**
   * Agrega múltiples productos con stock.
   * @param {Array} stockData - lista de objetos con { almacenId, productId, cantidad }
   * @return {Promise<AxiosResponse>}
   */
  const addMultipleStock = (stockData) =>
    api.post("almacenes/products/add_multiple_stock", { stockData });

  /**
   * Obtiene todos los productos en almacenes.
   * @param {object} [params]
   * @return {Promise<AxiosResponse>}
   */
  const listStockProductos = (params = {}) =>
    api.get("almacenes/products/get_products", { params });

  /**
   * Busca un producto específico dentro del almacén.
   * @param {object} params - por ejemplo: { productId: "prod-001" }
   * @return {Promise<AxiosResponse>}
   */
  const findProductoInStock = (params = {}) =>
    api.get("almacenes/products/find_product", { params });

  /**
   * Elimina stock de un producto.
   * @param {object} data - { almacenId, productId, cantidad }
   * @return {Promise<AxiosResponse>}
   */
  const removeStock = (data) =>
    api.delete("almacenes/products/remove_stock", { data });

  return {
    addStock,
    addMultipleStock,
    listStockProductos,
    findProductoInStock,
    removeStock,
  };
}
