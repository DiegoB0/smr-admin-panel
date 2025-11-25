import { api } from "../api/api";

export function useStock() {

  const addStock = (data) => api.post("almacenes/products/add_stock", data);

  const addMultipleStock = (data) =>
    api.post("almacenes/products/add_multiple_stock", data);

  const listStockProductos = (params = {}) =>
    api.get("almacenes/products/get_products", { params });

  const findProductoInStock = (params = {}) =>
    api.get("almacenes/products/find_product", { params });

  const removeStock = ({ almacenId, productId, cantidad }) =>
    api.delete("almacenes/products/remove_stock", {
      params: { almacenId, productId, cantidad }
    });

  return {
    addStock,
    addMultipleStock,
    listStockProductos,
    findProductoInStock,
    removeStock,
  };
}
