"use client";

import React, { useEffect, useState } from "react";
import {
  Eye,
  FileText,
  CircleX,
  Timer,
  Award,
  CircleCheck,
  Search,
  ClipboardList,
  Truck,
} from "lucide-react";
import Swal from "sweetalert2";
import { useDebounce } from "../../hooks/customHooks";
import { useRequisiciones } from "../../hooks/useRequisiciones";
import { useAlmacenes } from "../../hooks/useAlmacenes";
import { useProveedores } from "../../hooks/useProveedores";

function ReportesPage() {
  const { listReportes, approveReporte, rejectReporte, createRequisicion } = useRequisiciones();
  const { listAlmacenes } = useAlmacenes();
  const { listProveedores } = useProveedores();

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("5");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [almacenes, setAlmacenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  });
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
        setProveedores(res.data);
      })
      .catch((err) => {
        console.error("Error cargando proveedores:", err);
      });
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchAlmacenes = () => {
    listAlmacenes({ page: 1, limit: 100, order: "ASC" })
      .then((res) => {
        setAlmacenes(res.data.data);
      })
      .catch((err) => {
        console.error("Error cargando almacenes:", err);
      });
  };

  useEffect(() => {
    fetchAlmacenes();
  }, []);

  const numericFields = new Set(["proveedorId", "almacenCargoId", "hrm", "rcp"]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRequisicionData((prev) => ({
      ...prev,
      [name]: numericFields.has(name) ? (value ? parseInt(value, 10) : null) : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = { ...requisicionData, peticionId: selectedPeticionId };
      await createRequisicion(payload);
      Swal.fire("Éxito", "Requisición creada correctamente", "success");
      fetchReportes();
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
    limitOption === "all" ? pagination.totalItems || 0 : Number.parseInt(limitOption);

  const fetchReportes = () => {
    setLoading(true);
    listReportes({ page, limit, search: debouncedSearch, order: "ASC" })
      .then((res) => {
        let data = res.data.data;
        if (statusFilter !== "ALL") {
          data = data.filter((r) => r.status === statusFilter);
        }
        setReportes(data);
        setPagination(res.data.meta);
      })
      .catch((err) => {
        Swal.fire("Error", err.message || "Error al cargar reportes", "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchReportes();
  }, [page, limit, debouncedSearch, statusFilter]);

  const handleApprove = async (id) => {
    try {
      await approveReporte(id);
      Swal.fire("Éxito", "Reporte aprobado correctamente", "success");
      fetchReportes();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "No se pudo aprobar", "error");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectReporte(id);
      Swal.fire("Éxito", "Reporte rechazado correctamente", "success");
      fetchReportes();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "No se pudo rechazar", "error");
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedReporte(null);
  };

  function formatDate(isoString) {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // --- Stats Section ---
  const StatsSection = ({ reportes }) => {
    const total = reportes.length;
    const pendientes = reportes.filter((r) => r.status === "PENDIENTE").length;
    const procesados = reportes.filter((r) => r.status === "PROCESADO").length;
    const aprobados = reportes.filter((r) => r.status === "APROBADO").length;
    const rechazados = reportes.filter((r) => r.status === "RECHAZADO").length;

    const stats = [
      {
        title: "Total Reportes",
        value: total,
        icon: FileText,
        color: "bg-blue-500/90",
        textColor: "text-blue-600",
      },
      {
        title: "Procesados",
        value: procesados,
        icon: Award,
        color: "bg-gray-500/90",
        textColor: "text-gray-600",
      },
      {
        title: "Aprobados",
        value: aprobados,
        icon: CircleCheck,
        color: "bg-green-500/90",
        textColor: "text-green-600",
      },
      {
        title: "Pendientes",
        value: pendientes,
        icon: Timer,
        color: "bg-yellow-500/90",
        textColor: "text-yellow-600",
      },
      {
        title: "Rechazados",
        value: rechazados,
        icon: CircleX,
        color: "bg-red-500/90",
        textColor: "text-red-600",
      },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 h-28 flex items-center transition-all duration-300 hover:shadow-md animate-fade-in"
          >
            <div className="flex items-center justify-between w-full">
              <div>
                <p className={`text-sm font-medium ${stat.textColor} mb-1`}>{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} to-${stat.color.split('-')[1]}-600`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
        </svg>
        <p className="mt-4 text-gray-600">Cargando reportes...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto font-inter">
      {/* Estilo global para la fuente y animaciones */}
      <style jsx global>{`
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          letter-spacing: -0.01em;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        [data-tooltip] {
          position: relative;
        }
        [data-tooltip]:hover:after {
          content: attr(data-tooltip);
          @apply absolute bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 -translate-x-1/2 z-10;
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Reportes</h1>
          <p className="text-gray-600 mt-1">Administra los reportes enviados por operadores</p>
        </div>
        <div />
      </div>

      {/* Stats */}
      <StatsSection reportes={reportes} />

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar reportes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
            aria-label="Buscar reportes"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          aria-label="Filtrar por estatus"
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
          className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          aria-label="Seleccionar elementos por página"
        >
          <option value="5">5 por página</option>
          <option value="10">10 por página</option>
          <option value="20">20 por página</option>
          <option value="all">Mostrar todos</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Fecha creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Creado por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Estatus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Revisado por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Fecha revisión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportes.length > 0 ? (
                  reportes.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 transition-colors duration-200 odd:bg-gray-50 animate-fade-in"
                    >
                      <td className="px-6 py-5 text-sm text-gray-700">{formatDate(r.fechaCreacion)}</td>
                      <td className="px-6 py-5 text-sm text-gray-700">{r.creadoPor?.email || "N/A"}</td>
                      <td className="px-6 py-5 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            r.status === "PENDIENTE"
                              ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800"
                              : r.status === "APROBADO"
                              ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800"
                              : r.status === "PROCESADO"
                              ? "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700"
                              : "bg-gradient-to-r from-red-100 to-red-200 text-red-800"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700">{r.revisadoPor?.email || "Pendiente"}</td>
                      <td className="px-6 py-5 text-sm text-gray-700">
                        {r.fechaRevision ? formatDate(r.fechaRevision) : "Pendiente"}
                      </td>
                      <td className="px-6 py-5 text-sm flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedReporte(r);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          aria-label={`Ver detalles del reporte ${r.id}`}
                          data-tooltip="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {r.status === "APROBADO" && (
                          <button
                            onClick={() => openRequisicionModal(r.id)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            aria-label={`Crear requisición para el reporte ${r.id}`}
                            data-tooltip="Crear requisición"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        {r.status === "PENDIENTE" && (
                          <>
                            <button
                              onClick={() => handleApprove(r.id)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              aria-label={`Aprobar reporte ${r.id}`}
                              data-tooltip="Aprobar reporte"
                            >
                              <CircleCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              aria-label={`Rechazar reporte ${r.id}`}
                              data-tooltip="Rechazar reporte"
                            >
                              <CircleX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No se encontraron reportes
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm
                          ? "Intenta ajustar los filtros de búsqueda"
                          : "No hay reportes registrados"}
                      </p>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        onClick={() => {/* Navegar a crear reporte */}}
                        aria-label="Crear nuevo reporte"
                      >
                        Crear Nuevo Reporte
                      </button>
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
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            aria-label="Ir a la primera página"
          >
            1
          </button>
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={!pagination.hasPreviousPage}
            className="px-4 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            aria-label="Página anterior"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-600">
            Página {pagination.currentPage} de {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            aria-label="Página siguiente"
          >
            Siguiente
          </button>
          <button
            onClick={() => setPage(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            aria-label="Ir a la última página"
          >
            Última
          </button>
        </div>
      )}

      {/* Modal Crear Requisición */}
      {isRequisicionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={closeRequisicionModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 transform animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Crear Requisición</h2>
              <button
                onClick={closeRequisicionModal}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar modal"
              >
                <span className="text-2xl leading-none">&times;</span>
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  aria-label="Título de la requisición"
                />
                <input
                  type="text"
                  name="concepto"
                  placeholder="Concepto"
                  value={requisicionData.concepto}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  aria-label="Concepto de la requisición"
                />
                <input
                  type="text"
                  name="hrm"
                  placeholder="HRM"
                  value={requisicionData.hrm}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  aria-label="HRM"
                />
                <input
                  type="text"
                  name="rcp"
                  placeholder="RCP"
                  value={requisicionData.rcp}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  aria-label="RCP"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  name="prioridad"
                  value={requisicionData.prioridad}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  aria-label="Seleccionar prioridad"
                  required
                >
                  <option value="" disabled>
                    -- Selecciona la prioridad --
                  </option>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
                <select
                  name="almacenCargoId"
                  value={requisicionData.almacenCargoId ?? ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  aria-label="Seleccionar almacén"
                  required
                >
                  <option value="" disabled>
                    -- Selecciona un almacén --
                  </option>
                  {almacenes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <select
                  name="proveedorId"
                  value={requisicionData.proveedorId ?? ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  aria-label="Seleccionar proveedor"
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
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeRequisicionModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                aria-label="Cancelar creación de requisición"

              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                aria-label="Crear requisición"

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={closeDetailModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto transform animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
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
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar modal"
                data-tooltip="Cerrar"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-8">
              <section className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedReporte.status === "APROBADO"
                      ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800"
                      : selectedReporte.status === "PENDIENTE"
                      ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800"
                      : selectedReporte.status === "PROCESADO"
                      ? "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700"
                      : "bg-gradient-to-r from-red-100 to-red-200 text-red-800"
                  }`}
                >
                  {selectedReporte.status}
                </span>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700"
                >
                  Almacén: {selectedReporte.almacen?.name || "N/A"}
                </span>
              </section>
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  Equipo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-xs font-medium text-gray-500">Equipo</p>
                    <p className="text-sm text-gray-900">{selectedReporte.equipo || "Sin equipo"}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-xs font-medium text-gray-500">Horometro</p>
                    <p className="text-sm text-gray-900">{selectedReporte.horometro || "N/A"}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-xs font-medium text-gray-500">Modelo</p>
                    <p className="text-sm text-gray-900">{selectedReporte.modelo || "N/A"}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-xs font-medium text-gray-500">Serie</p>
                    <p className="text-sm text-gray-900">{selectedReporte.serie || "N/A"}</p>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Información general
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-xs font-medium text-gray-500">Observaciones</p>
                    <p className="text-sm text-gray-900">{selectedReporte.observaciones || "Sin observaciones"}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-xs font-medium text-gray-500">Revisado por</p>
                    <p className="text-sm text-gray-900">{selectedReporte.revisadoPor?.email || "Pendiente"}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-xs font-medium text-gray-500">Fecha creación</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedReporte.fechaCreacion)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-xs font-medium text-gray-500">Fecha revisión</p>
                    <p className="text-sm text-gray-900">
                      {selectedReporte.fechaRevision ? formatDate(selectedReporte.fechaRevision) : "N/A"}
                    </p>
                  </div>
                </div>
              </section>
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
                            className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700"
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
                            className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700"
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
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  Refacciones
                </h3>
                {selectedReporte.items?.length ? (
                  <div className="rounded-lg border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Producto
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Cantidad
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedReporte.items.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {item.producto
                                ? `${item.producto.id} - ${item.producto.name || "Sin nombre"}`
                                : item.productoId}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 text-right">{item.cantidad}</td>
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
            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-100 px-6 py-4 rounded-b-xl flex justify-end">
              <button
                onClick={closeDetailModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                aria-label="Cerrar modal"
                data-tooltip="Cerrar"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportesPage;
