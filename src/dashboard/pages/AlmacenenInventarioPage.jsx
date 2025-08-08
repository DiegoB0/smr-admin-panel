import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Package, Tag, Ruler, AlignLeft } from "lucide-react";
import { useStock } from "../../hooks/useStock";
import Swal from "sweetalert2";

function AlmacenenInventarioPage() {
  const { id } = useParams(); // id del almacén
  const navigate = useNavigate();
  const { listStockProductos } = useStock();

  const [stockProductos, setStockProductos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await listStockProductos({ almacenId: id });
      console.log(res);
      setStockProductos(res.data.data);
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudo cargar el inventario", "error");
    } finally {
      setLoading(false);
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

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventario del Almacén {id}</h1>
        <p className="text-gray-600 mt-1">Lista de productos registrados en este almacén</p>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
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
