import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Package, Ruler, AlignLeft, Pencil, Trash2, Plus } from "lucide-react";
import { useStock } from "../../hooks/useStock";
import Swal from "sweetalert2";

function AlmacenenInventarioPage() {
  const { id } = useParams(); // id del almacén
  const navigate = useNavigate();
  const { listStockProductos, addStock, removeStock } = useStock();

  const [stockProductos, setStockProductos] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await listStockProductos({ almacenId: id });
      setStockProductos(res.data.data);
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudo cargar el inventario", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductosDisponibles = async () => {
    try {
      // Trae TODOS los productos (sin filtrar por almacén)
      const res = await listStockProductos();
      const todosLosProductos = res.data.data || [];

      // Filtra para que solo aparezcan los que NO están en este almacén
      const idsEnInventario = stockProductos.map((p) => p.producto.id);
      const filtrados = todosLosProductos.filter(
        (p) => !idsEnInventario.includes(p.producto.id)
      );

      setProductosDisponibles(filtrados);
    } catch (error) {
      Swal.fire("Error", "No se pudo obtener la lista de productos", "error");
    }
  };

  const handleEditStock = async (producto) => {
    const { value: cantidad } = await Swal.fire({
      title: "Editar cantidad",
      input: "number",
      inputValue: producto.stock,
      inputAttributes: { min: 0 },
      showCancelButton: true,
      confirmButtonText: "Guardar"
    });

    if (cantidad !== undefined) {
      try {
        await addStock({
          almacenId: id,
          productId: producto.producto.id,
          cantidad: Number(cantidad)
        });
        Swal.fire("Actualizado", "Stock modificado correctamente", "success");
        fetchStock();
      } catch (error) {
        Swal.fire("Error", error.message || "No se pudo actualizar el stock", "error");
      }
    }
  };

  const handleRemoveProduct = async (producto) => {
    const confirm = await Swal.fire({
      title: "Eliminar producto",
      text: `¿Eliminar ${producto.producto.name} del inventario?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });

    if (confirm.isConfirmed) {
      try {
        await removeStock({
          almacenId: id,
          productId: producto.producto.id,
          cantidad: producto.stock
        });
        Swal.fire("Eliminado", "Producto eliminado del inventario", "success");
        fetchStock();
      } catch (error) {
        Swal.fire("Error", error.message || "No se pudo eliminar el producto", "error");
      }
    }
  };

  const handleAddProduct = async () => {
    await fetchProductosDisponibles();

    if (productosDisponibles.length === 0) {
      Swal.fire("Aviso", "No hay productos disponibles para agregar", "info");
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: "Agregar Stock",
      html: `
        <select id="prodId" class="swal2-input">
          <option value="">Seleccione un producto</option>
          ${productosDisponibles
            .map((p) => `<option value="${p.producto.id}">${p.producto.name}</option>`)
            .join("")}
        </select>
        <input id="cantidad" type="number" min="1" class="swal2-input" placeholder="Cantidad">
      `,
      focusConfirm: false,
      preConfirm: () => {
        const productId = document.getElementById("prodId").value;
        const cantidad = Number(document.getElementById("cantidad").value);

        if (!productId || cantidad <= 0) {
          Swal.showValidationMessage("Seleccione un producto y cantidad válida");
          return false;
        }

        return { productId, cantidad };
      }
    });

    if (formValues) {
      try {
        await addStock({
          almacenId: id,
          productId: formValues.productId,
          cantidad: formValues.cantidad
        });
        Swal.fire("Agregado", "Producto añadido al inventario", "success");
        fetchStock();
      } catch (error) {
        Swal.fire("Error", error.message || "No se pudo agregar al stock", "error");
      }
    }
  };

  useEffect(() => {
    fetchStock();
  }, [id]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        className="flex gap-2 items-center text-lg text-gray-600 mb-4"
        onClick={() => navigate(`/dashboard/almacenes`)}
      >
        <ChevronLeft />
        REGRESAR
      </button>

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario del Almacén {id}</h1>
          <p className="text-gray-600 mt-1">Lista de productos registrados en este almacén</p>
        </div>
        <button
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          onClick={handleAddProduct}
        >
          <Plus className="w-4 h-4" /> Agregar Stock
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Cargando inventario...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto ID</th>
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
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => handleEditStock(producto)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveProduct(producto)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No hay productos registrados en este almacén.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlmacenenInventarioPage;

