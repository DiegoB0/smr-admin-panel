"use client"

import React, { useEffect, useState } from "react"
import {
  Eye, FileText, CircleX, Timer, Award, CircleCheck, Search,
  ClipboardList,
  Truck
} from "lucide-react"
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


  function Th({ children }) {
    return (
      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
        {children}
      </th>
    );
  }

  function Td({ children }) {
    return <td className="px-4 py-2 text-sm text-gray-900">{children}</td>;
  }

  function Detail({ label, value }) {
    return (
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-900">{value ?? "N/A"}</p>
      </div>
    );
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={closeDetailModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 text-blue-600">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Detalle del Reporte</h2>
                  <p className="text-xs text-gray-500">Vista resumen con información clave</p>
                </div>
              </div>
              <button
                onClick={closeDetailModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-8">
              {/* Badges */}
              <section className="flex flex-wrap items-center gap-2">

                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${selectedReporte.status === "APROBADO"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : selectedReporte.status === "PENDIENTE"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : selectedReporte.status === "PROCESADO"
                        ? "bg-gray-50 text-gray-700 border-gray-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                >
                  {selectedReporte.status}
                </span>

                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200">
                  Almacén: {selectedReporte.almacen?.name || "N/A"}
                </span>
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  Equipo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Detail label="Equipo" value={selectedReporte.equipo || "Sin equipo"} />
                  <Detail label="Horometro" value={selectedReporte.horometro || "N/A"} />
                  <Detail label="Modelo" value={selectedReporte.modelo || "N/A"} />
                  <Detail label="Serie" value={selectedReporte.serie || "N/A"}
                  />
                </div>
              </section>

              {/* Información general */}
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Información general
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Detail label="Observaciones" value={selectedReporte.observaciones || "Sin observaciones"} />
                  <Detail label="Revisado por" value={selectedReporte.revisadoPor?.email || "Pendiente"} />
                  <Detail label="Fecha creación" value={formatDate(selectedReporte.fechaCreacion)} />
                  <Detail
                    label="Fecha revisión"
                    value={selectedReporte.fechaRevision ? formatDate(selectedReporte.fechaRevision) : "N/A"}
                  />
                </div>
              </section>

              {/* Componentes y Fases */}
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Clasificación</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Componentes</p>
                    {selectedReporte.componentes?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedReporte.componentes.map((c, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">Sin componentes</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Fases</p>
                    {selectedReporte.fases?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedReporte.fases.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">Sin fases</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Items */}
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  Refacciones
                </h3>
                {selectedReporte.items?.length ? (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <Th>Producto</Th>
                          <Th>Cantidad</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedReporte.items.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <Td>
                              {item.producto
                                ? `${item.producto.id} - ${item.producto.name || "Sin nombre"}`
                                : item.productoId}
                            </Td>
                            <Td>{item.cantidad}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600">No hay items registrados en este reporte</p>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 px-6 py-4 rounded-b-xl flex flex-wrap gap-2 justify-end">
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


    </div >
  )
}

export default ReportesPage
