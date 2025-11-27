import { api } from "../api/api";

export function useStock() {

  const addStock = (data) => api.post("almacenes/products/add_stock", data);

  const addMultipleStock = (data) =>
    api.post("almacenes/products/add_multiple_stock", data);

  const listStockProductos = (params = {}) =>
    api.get("almacenes/products/get_products", { params });

  const findProductoInStock = (params = {}) =>
    api.get("almacenes/products/find_product", { params });

  const removeStock = ({ almacenId, productId, cantidad, prestadaPara }) =>
    api.delete("almacenes/products/remove_stock", {
      params: { almacenId, productId, cantidad, prestadaPara }
    });

  const uploadExcelStock = (file, almacenId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('almacenId', almacenId);
    return api.post("almacenes/products/upload-excel", formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const getJobStatus = (jobId) =>
    api.get(`almacenes/jobs/${jobId}`);

  return {
    addStock,
    addMultipleStock,
    listStockProductos,
    findProductoInStock,
    removeStock,
    uploadExcelStock,
    getJobStatus,
  };
}
