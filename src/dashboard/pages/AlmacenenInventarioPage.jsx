import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Package,
  Ruler,
  AlignLeft,
  Plus,
  Minus,
  Search,
  Layers,
  BarChart2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useStock } from "../../hooks/useStock";
import { useDebounce } from "../../hooks/customHooks";
import { useProductos } from "../../hooks/useProductos";
import Swal from "sweetalert2";

function AlmacenenInventarioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listStockProductos, addStock, removeStock } = useStock();
  const { listProductos } = useProductos();

  const [stockProductos, setStockProductos] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Paginación y búsqueda
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  });
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("5");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const limit =
    limitOption === "all" ? pagination.totalItems || 0 : Number(limitOption);

  // Modal agregar stock
  const [isStockFormOpen, setIsStockFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [cantidad, setCantidad] = useState("");

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await listStockProductos({
        almacenId: id,
        page,
        limit,
        search: debouncedSearchTerm,
      });
      setStockProductos(res.data.data);
      if (res.data.meta) {
        setPagination(res.data.meta);
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.message || "No se pudo cargar el inventario",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProductosDisponibles = async () => {
    try {
      // Traer todos los productos
      const resAll = await listProductos();
      const todosLosProductos = resAll.data.data || [];
      console.log(todosLosProductos)

      // Traer productos que ya están en este almacén
      const resStock = await listStockProductos({ almacenId: id });
      const productosEnInventario = resStock.data.data || [];

      // Obtener IDs de productos que ya están en inventario
      const idsEnInventario = productosEnInventario.map((p) => p.producto.id);

      // Filtrar para que solo aparezcan los que NO están en inventario
      const filtrados = todosLosProductos.filter(
        (p) => !idsEnInventario.includes(p.id)
      );

      setProductosDisponibles(filtrados);
    } catch (error) {
      console.log(error)
      Swal.fire("Error", "No se pudo obtener la lista de productos", "error");
    }
  };

  const handleChangeStock = async (producto, action) => {
    const { value: cantidad } = await Swal.fire({
      title: `${action === "add" ? "Sumar" : "Restar"} stock`,
      input: "number",
      inputAttributes: { min: 1 },
      showCancelButton: true,
    });

    if (!cantidad || cantidad <= 0) return;

    try {
      if (action === "add") {
        await addStock({
          almacenId: id,
          productId: producto.producto.id,
          cantidad: Number(cantidad),
        });
      } else {
        await removeStock({
          almacenId: id,
          productId: producto.producto.id,
          cantidad: Number(cantidad),
        });
      }

      Swal.fire("Éxito", "Stock actualizado correctamente", "success");
      fetchStock();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response.data.message || "No se pudo actualizar el stock",
        "error"
      );
    }
  };

  const openStockModal = async () => {
    await fetchProductosDisponibles();
    setIsStockFormOpen(true);
  };

  const closeStockModal = () => {
    setSelectedProduct("");
    setCantidad("");
    setIsStockFormOpen(false);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct || cantidad <= 0) {
      Swal.fire("Error", "Seleccione un producto y cantidad válida", "error");
      return;
    }
    try {
      await addStock({
        almacenId: id,
        productId: selectedProduct,
        cantidad: Number(cantidad),
      });
      Swal.fire("Agregado", "Producto añadido al inventario", "success");
      fetchStock();
      closeStockModal();
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudo agregar al stock", "error");
    }
  };

  // Estadísticas
  const totalStock = stockProductos.reduce((sum, p) => sum + p.stock, 0);
  const productoMax = stockProductos.reduce(
    (max, p) => (p.stock > (max?.stock || 0) ? p : max),
    null
  );
  const productoMin = stockProductos.reduce(
    (min, p) =>
      p.stock < (min?.stock || Infinity) && p.stock > 0 ? p : min,
    null
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchStock();
  }, [id, page, limit, debouncedSearchTerm]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button className="flex gap-2 items-center"
            onClick={() => navigate(`/dashboard/almacenes/`)}
          >
            <span className="text-gray-500">
              <ChevronLeft />
            </span>
            <h1 className="text-gray-600 uppercase  text-lg">
              Regresar</h1>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            Inventario del Almacén {id}
          </h1>
          <p className="text-gray-600 mt-1">
            Lista de productos registrados en este almacén
          </p>
        </div>
        <button
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          onClick={openStockModal}
        >
          <Plus className="w-4 h-4" /> Agregar Stock
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              Total Productos
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {pagination.totalItems}
            </p>
          </div>
          <Layers className="w-6 h-6 text-blue-600" />
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              Stock Total
            </p>
            <p className="text-2xl font-bold text-green-600">{totalStock}</p>
          </div>
          <BarChart2 className="w-6 h-6 text-green-600" />
        </div>
        {productoMax && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Más Stock
              </p>
              <p className="text-lg font-bold text-purple-600">
                {productoMax.producto.name} ({productoMax.stock})
              </p>
            </div>
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
        )}
        {productoMin && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Menos Stock
              </p>
              <p className="text-lg font-bold text-red-600">
                {productoMin.producto.name} ({productoMin.stock})
              </p>
            </div>
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={limitOption}
          onChange={(e) => setLimitOption(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="5">5 por página</option>
          <option value="10">10 por página</option>
          <option value="20">20 por página</option>
          <option value="all">Mostrar todos</option>
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-8 text-gray-600">
          Cargando inventario...
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <Package className="w-4 h-4 inline mr-1" /> Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <AlignLeft className="w-4 h-4 inline mr-1" /> Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <Ruler className="w-4 h-4 inline mr-1" /> Unidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cantidad en Stock
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockProductos.length > 0 ? (
                    stockProductos.map((producto) => (
                      <tr key={producto.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto?.producto?.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto?.producto?.name || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {producto?.producto?.description || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto?.producto?.unidad || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                          {producto.stock || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium flex gap-2 justify-center">
                          <button
                            className="text-green-500 hover:text-green-700"
                            onClick={() => handleChangeStock(producto, "add")}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            className="text-yellow-500 hover:text-yellow-700"
                            onClick={() => handleChangeStock(producto, "remove")}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No hay productos registrados en este almacén.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setPage((prev) => prev - 1)}
                disabled={!pagination.hasPreviousPage}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                Anterior
              </button>

              <span className="px-4 py-2 text-gray-600">
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal agregar stock */}
      {isStockFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={closeStockModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Agregar Stock
              </h2>
              <button
                onClick={closeStockModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-gray-400 hover:text-gray-600 text-xl">
                  &times;
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="" disabled>
                    — Selecciona un producto —
                  </option>
                  {productosDisponibles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Cantidad"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeStockModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlmacenenInventarioPage;
