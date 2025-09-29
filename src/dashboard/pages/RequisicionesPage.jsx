"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  AlertTriangle,
  Eye,
  CircleX,
  CircleCheck,
  Search,
} from "lucide-react";
import { useRequisiciones } from "../../hooks/useRequisiciones";
import Swal from "sweetalert2";
import { useDebounce } from "../../hooks/customHooks";

const RequisicionesPage = () => {
  const { listRequisiciones } = useRequisiciones();
  const [requisiciones, setRequisiciones] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("10");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequisicion, setSelectedRequisicion] = useState(null);

  const fetchRequisiciones = () => {
    setLoading(true);
    const limit = limitOption === "all" ? pagination.totalItems || 0 : parseInt(limitOption);
    listRequisiciones({ page, limit, order: "DESC", search: debouncedSearch })
      .then((res) => {
        let data = res.data.data;
        if (statusFilter !== "ALL") {
          data = data.filter((r) => r.status.toLowerCase() === statusFilter.toLowerCase());
        }
        setRequisiciones(data);
        setPagination(res.data.meta);
      })
      .catch((err) => {
        Swal.fire(
          "Error",
          err.message || "Error al cargar requisiciones",
          "error"
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequisiciones();
  }, [page, limitOption, debouncedSearch, statusFilter]);

  const openDetailModal = (requisicion) => {
    setSelectedRequisicion(requisicion);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRequisicion(null);
  };

  const pendingCount = requisiciones.filter(
    (r) => r.status === "pendiente"
  ).length;

  const rechazadosCount = requisiciones.filter(
    (r) => r.status === "rechazada"
  ).length;

  const aprobadoCount = requisiciones.filter(
    (r) => r.status === "aprobada"
  ).length;

  const StatsSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              Total Requisiciones
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {pagination.totalItems}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500">
            <FileText className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600 mb-1">Aprobadas</p>
            <p className="text-2xl font-bold text-green-600">{aprobadoCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-600 mb-1">Rechazadas</p>
            <p className="text-2xl font-bold text-red-600">{rechazadosCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

    </div>
  );

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Cargando requisiciones...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Requisiciones
          </h1>
          <p className="text-gray-600 mt-1">
            Administra todas las requisiciones
          </p>
        </div>
      </div>

      <StatsSection />

      {/* Filters Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar requisiciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ALL">Todos</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="APROBADO">Aprobados</option>
          <option value="RECHAZADO">Rechazados</option>
        </select>

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

      <div className="flex justify-end mb-4">
        <button
          onClick={() => console.log("Create Requisicion")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Crear Requisicion
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    RCP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha Solicitud
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo de requisicion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requisiciones.length > 0 ? (
                  requisiciones.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.rcp || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(r.fechaSolicitud).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.titulo || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.prioridad}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${r.status === "pendiente"
                            ? "bg-yellow-100 text-yellow-800"
                            : r.status === "aprobado"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.cantidad_dinero
                          ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(r.cantidad_dinero)
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {
                          r.requisicionType === "service" ? "Servicio" : "product" ? "Producto" : "N/A"
                        }
                      </td>
                      <td className="px-6 py-4 text-sm flex space-x-2">
                        <button
                          onClick={() => openDetailModal(r)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => console.log("Aprobar", r.id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Aprobar"
                        >
                          <CircleCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => console.log("Rechazar", r.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Rechazar"
                        >
                          <CircleX className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron requisiciones</h3>
                      <p className="text-gray-600">
                        {searchTerm
                          ? "Intenta ajustar los filtros de búsqueda"
                          : "No hay requisiciones registradas"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
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

      {isDetailModalOpen && selectedRequisicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalles de la Requisición
              </h2>
              <button
                onClick={closeDetailModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-gray-400 hover:text-gray-600 text-xl">
                  &times;
                </span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">RCP</p>
                  <p className="text-gray-900">
                    {selectedRequisicion.rcp || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">HRM</p>
                  <p className="text-gray-900">
                    {selectedRequisicion.hrm || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Título</p>
                  <p className="text-gray-900">
                    {selectedRequisicion.titulo || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo de requisicion</p>
                  <p className="text-gray-900">
                    {
                      selectedRequisicion.requisicionType
                        === "service"
                        ? "Servicio"
                        : "product"
                          ? "Refacciones"
                          : "N/A"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-gray-900">
                    <span
                      className={` py-1 rounded-full text-sm font-semibold ${selectedRequisicion.status === "pendiente"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedRequisicion.status === "aprobado"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {selectedRequisicion.status}
                    </span>

                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Proveedor</p>
                  <p className="text-gray-900">
                    N/A
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Concepto</p>
                  <p className="text-gray-900">
                    {selectedRequisicion.concepto || "Sin concepto"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Metodo de pago</p>
                  <p className="text-gray-900">
                    {
                      selectedRequisicion.metodo_pago
                        ? "Sin pagar"
                        : "N/A"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Equipo
                  </p>
                  <p className="text-gray-900">
                    {selectedRequisicion.equipo?.equipo || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    no. Economico (Equipo)
                  </p>
                  <p className="text-gray-900">
                    {selectedRequisicion.equipo?.no_economico || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Almacen Destino
                  </p>
                  <p className="text-gray-900">
                    {selectedRequisicion.almacenDestino?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Con cargo a
                  </p>
                  <p className="text-gray-900">
                    {selectedRequisicion.almacenCargo?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Pedido Por</p>
                  <p className="text-gray-900">
                    {selectedRequisicion.pedidoPor?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Revisado Por</p>
                  <p className="text-gray-900">
                    {selectedRequisicion.revisadoPor?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha creacion</p>
                  <p className="text-gray-900">
                    {new Date(selectedRequisicion.fechaSolicitud).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha revision</p>
                  <p className="text-gray-900">
                    {selectedRequisicion.fechaRevision
                      ? new Date(selectedRequisicion.fechaRevision).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{selectedRequisicion.requisicionType === "service" ? "Servicio" : "product" ? "Refacciones" : "Consumibles"}</h3>
                {selectedRequisicion.items?.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200 border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        {selectedRequisicion.requisicionType === 'product' ? (
                          <>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                              Producto
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                              Cantidad
                            </th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                              Descripción
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                              Cantidad
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                              Unidad
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                              Precio Unitario
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedRequisicion.items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {selectedRequisicion.requisicionType === 'product' ? (
                            <>
                              <td className="px-4 py-2">
                                {item.producto?.name || 'Sin nombre'}
                              </td>
                              <td className="px-4 py-2">{item.cantidadSolicitada}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-2">{item.descripcion}</td>
                              <td className="px-4 py-2">{item.cantidad}</td>
                              <td className="px-4 py-2">{item.unidad}</td>
                              <td className="px-4 py-2">{item.precio_unitario}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-600">
                    No hay items registrados en esta requisición
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
              <button
                onClick={closeDetailModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequisicionesPage;
