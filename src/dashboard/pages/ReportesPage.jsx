"use client"

import React, { useEffect, useState } from "react"
import { Eye, FileText, CircleX, Timer, Award, CircleCheck, Search } from "lucide-react"
import Swal from "sweetalert2"
import { useDebounce } from "../../hooks/customHooks"
import { useRequisiciones } from "../../hooks/useRequisiciones"
import { useAlmacenes } from "../../hooks/useAlmacenes"
import { useProveedores } from "../../hooks/useProveedores"

function ReportesPage() {
  const { listReportes, approveReporte, rejectReporte, createRequisicion } = useRequisiciones()
  const { listAlmacenes } = useAlmacenes()
  const { listProveedores } = useProveedores()

  const [reportes, setReportes] = useState([])
  const [loading, setLoading] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedReporte, setSelectedReporte] = useState(null)

  const [page, setPage] = useState(1)
  const [limitOption, setLimitOption] = useState("5")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 500)

  const [almacenes, setAlmacenes] = useState([])

  const [proveedores, setProveedores] = useState([])

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  })


  const [isRequisicionModalOpen, setIsRequisicionModalOpen] = useState(false);
  const [selectedPeticionId, setSelectedPeticionId] = useState(null);
  const [requisicionData, setRequisicionData] = useState({
    almacenCargoId: null,
    proveedorId: null,
    hrm: null,
    rcp: null,
    titulo: "",
    concepto: "",
    prioridad: "",
    requisicionType: "product",
  });

  const openRequisicionModal = (peticionId) => {
    setSelectedPeticionId(peticionId);
    setIsRequisicionModalOpen(true);
  };

  const clearForm = () => {
    setRequisicionData({
      almacenCargoId: "",
      hrm: "",
      rcp: "",
      titulo: "",
      concepto: "",
      prioridad: "",
      requisicionType: "product",
    });
    setSelectedPeticionId(null);
  };

  const closeRequisicionModal = () => {
    clearForm();
    setIsRequisicionModalOpen(false);
    setSelectedPeticionId(null);
  };

  const fetchProveedores = () => {
    listProveedores({ page: 1, limit: 100, order: "ASC" })
      .then((res) => {
        console.log(res.data)
        setProveedores(res.data)
      })
      .catch((err) => {
        console.error("Error cargando productos:", err)
      })
  }


  useEffect(() => {
    fetchProveedores()
  }, [])


  const fetchAlmacenes = () => {
    listAlmacenes({ page: 1, limit: 100, order: "ASC" })
      .then((res) => {
        setAlmacenes(res.data.data)
      })
      .catch((err) => {
        console.error("Error cargando productos:", err)
      })
  }


  useEffect(() => {
    fetchAlmacenes()
  }, [])

  const numericFields = new Set([
    "proveedorId",
    "almacenCargoId",
    "hrm",
    "rcp",
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRequisicionData((prev) => ({
      ...prev,
      [name]:
        numericFields.has(name)
          ? value ? parseInt(value, 10) : null
          : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = { ...requisicionData, peticionId: selectedPeticionId };
      await createRequisicion(payload);
      Swal.fire("Éxito", "Requisición creada correctamente", "success");
      fetchReportes()
      closeRequisicionModal();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Error al crear requisición",
        "error"
      );
    }
  };

  const limit =
    limitOption === "all" ? pagination.totalItems || 0 : Number.parseInt(limitOption)

  const fetchReportes = () => {
    setLoading(true)
    listReportes({ page, limit, search: debouncedSearch, order: "ASC" })
      .then((res) => {
        let data = res.data.data
        if (statusFilter !== "ALL") {
          data = data.filter((r) => r.status === statusFilter)
        }
        setReportes(data)
        setPagination(res.data.meta)
      })
      .catch((err) => {
        Swal.fire("Error", err.message || "Error al cargar reportes", "error")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    fetchReportes()
  }, [page, limit, debouncedSearch, statusFilter])

  const handleApprove = async (id) => {
    try {
      await approveReporte(id)
      Swal.fire("Éxito", "Reporte aprobado correctamente", "success")
      fetchReportes()
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "No se pudo aprobar", "error")
    }
  }

  const handleReject = async (id) => {
    try {
      await rejectReporte(id)
      Swal.fire("Éxito", "Reporte rechazado correctamente", "success")
      fetchReportes()
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "No se pudo rechazar", "error")
    }
  }

  const closeDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedReporte(null)
  }

  function formatDate(isoString) {
    if (!isoString) return "-"
    const date = new Date(isoString)
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  // --- Stats Section ---
  const StatsSection = ({ reportes }) => {
    const total = reportes.length
    const pendientes = reportes.filter((r) => r.status === "PENDIENTE").length
    const procesados = reportes.filter((r) => r.status === "PROCESADO").length
    const aprobados = reportes.filter((r) => r.status === "APROBADO").length
    const rechazados = reportes.filter((r) => r.status === "RECHAZADO").length

    const stats = [
      {
        title: "Total Reportes",
        value: total,
        icon: FileText,
        color: "bg-blue-500",
        textColor: "text-blue-600",
      },
      {
        title: "Procesados",
        value: procesados,
        icon: Award,
        color: "bg-gray-500",
        textColor: "text-gray-600",
      },
      {
        title: "Aprobados",
        value: aprobados,
        icon: CircleCheck,
        color: "bg-green-500",
        textColor: "text-green-600",
      },
      {
        title: "Pendientes",
        value: pendientes,
        icon: Timer,
        color: "bg-yellow-500",
        textColor: "text-yellow-600",
      },
      {
        title: "Rechazados",
        value: rechazados,
        icon: CircleX,
        color: "bg-red-500",
        textColor: "text-red-600",
      },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Loading spinner
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Cargando reportes...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Reportes</h1>
          <p className="text-gray-600 mt-1">Administra los reportes enviados por operadores</p>
        </div>
      </div>

      {/* Stats */}
      <StatsSection reportes={reportes} />

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar reportes..."
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
          <option value="PROCESADO">Procesados</option>
          <option value="APROBADO">Aprobados</option>
          <option value="PENDIENTE">Pendientes</option>
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

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Creado por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estatus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Revisado por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha revisión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportes.length > 0 ? (
                  reportes.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(r.fechaCreacion)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{r.creadoPor?.email || "N/A"}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${r.status === "PENDIENTE"
                            ? "bg-yellow-100 text-yellow-800"
                            : r.status === "APROBADO"
                              ? "bg-green-100 text-green-800"
                              : r.status === "PROCESADO"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-red-100 text-red-800"
                            }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{r.revisadoPor?.email || "Pendiente"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.fechaRevision ? formatDate(r.fechaRevision) : "Pendiente"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedReporte(r)
                              setIsDetailModalOpen(true)
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {r.status === "APROBADO" && (
                            <button
                              onClick={() => {
                                openRequisicionModal(r.id)
                                console.log(r.id)
                              }}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Crear requisicion"

                            >
                              <FileText className="w-4 h-4" />

                            </button>
                          )}

                          {r.status === "PENDIENTE" && (
                            <>
                              <button
                                onClick={() => handleApprove(r.id)}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Aprobar"
                              >
                                <CircleCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Rechazar"
                              >
                                <CircleX className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron reportes</h3>
                      <p className="text-gray-600">
                        {searchTerm
                          ? "Intenta ajustar los filtros de búsqueda"
                          : "No hay reportes registrados"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación */}
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

      {isRequisicionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Crear Requisición
              </h2>
              <button
                onClick={closeRequisicionModal}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="titulo"
                  placeholder="Título"
                  value={requisicionData.titulo}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                />
                <input
                  type="text"
                  name="concepto"
                  placeholder="Concepto"
                  value={requisicionData.concepto}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                />
                <input
                  type="text"
                  name="hrm"
                  placeholder="HRM"
                  value={requisicionData.hrm}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                />
                <input
                  type="text"
                  name="rcp"
                  placeholder="RCP"
                  value={requisicionData.rcp}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  name="prioridad"
                  value={requisicionData.prioridad}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="" disabled>-- Selecciona la prioridad --</option>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>

                <select
                  name="almacenCargoId"
                  value={requisicionData.almacenCargoId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="" disabled>-- Selecciona un almacén --</option>
                  {almacenes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                <select
                  name="proveedorId"
                  value={requisicionData.proveedorId ?? ""}  // ensure "" when empty
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="" disabled>
                    -- Selecciona un proveedor --
                  </option>
                  {proveedores.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={closeRequisicionModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {isDetailModalOpen && selectedReporte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Detalle del Reporte</h2>
              <button
                onClick={closeDetailModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-gray-400 hover:text-gray-600 text-xl">&times;</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Observaciones</p>
                  <p className="text-gray-900">{selectedReporte.observaciones || "Sin observaciones"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">RCP</p>
                  <p className="text-gray-900">N/A</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Equipo</p>
                  <p className="text-gray-900">{selectedReporte.equipo || "Sin equipo"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Serie</p>
                  <p className="text-gray-900">N/A</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Marca</p>
                  <p className="text-gray-900">N/A</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Horometro</p>
                  <p className="text-gray-900">N/A</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estatus</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedReporte.status === "PENDIENTE"
                      ? "bg-yellow-100 text-yellow-800"
                      : selectedReporte.status === "APROBADO"
                        ? "bg-green-100 text-green-800"
                        : selectedReporte.status === "PROCESADO"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-red-100 text-red-800"
                      }`}
                  >
                    {selectedReporte.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Revisado por</p>
                  <p className="text-gray-900">{selectedReporte.revisadoPor?.email || "Pendiente"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha creación</p>
                  <p className="text-gray-900">{formatDate(selectedReporte.fechaCreacion)}</p>
                </div>
                {selectedReporte.fechaRevision && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fecha revisión</p>
                    <p className="text-gray-900">{formatDate(selectedReporte.fechaRevision)}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Componente</h3>
                {selectedReporte.items?.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200 border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Componentes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedReporte.items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            N/A
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-600">No hay items registrados en este reporte</p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Fase</h3>
                {selectedReporte.items?.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200 border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Items</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedReporte.items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            N/A
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-600">No hay items registrados en este reporte</p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Refacciones</h3>
                {selectedReporte.items?.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200 border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Producto</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedReporte.items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            {item.producto
                              ? `${item.producto.id} - ${item.producto.name || "Sin nombre"}`
                              : item.productoId}
                          </td>
                          <td className="px-4 py-2">{item.cantidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-600">No hay items registrados en este reporte</p>
                )}
              </div>
            </div>

            {/* Footer */}
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
      )
      }
    </div >
  )
}

export default ReportesPage
