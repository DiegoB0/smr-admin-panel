"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  AlertTriangle,
  Eye,
  CircleX,
  CircleCheck,
  Search,
  Plus,
  Trash2,
  ClipboardList,
} from "lucide-react";
import { useRequisiciones } from "../../hooks/useRequisiciones";
import Swal from "sweetalert2";
import { useDebounce } from "../../hooks/customHooks";
import { exportRequisicionPDF } from "../../utils/exportPdf";
import { printRequisicion } from "../../utils/printPdf";
import { useAuthFlags } from "../../hooks/useAuth";
import { useProveedores } from "../../hooks/useProveedores"
import { useAlmacenes } from "../../hooks/useAlmacenes";

const RequisicionesPage = () => {
  const {
    listRequisiciones,
    createServiceRequisicion,
    approveRequisicion,
    rejectRequisicion,
  } = useRequisiciones();
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

  const [proveedores, setProveedores] = useState([])

  const [almacenes, setAlmacenes] = useState([])

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequisicion, setSelectedRequisicion] = useState(null);

  // Modal de creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    rcp: "",
    titulo: "",
    prioridad: "alta",
    concepto: "",
    almacenCargoId: "",
    proveedorId: "",
    requisicionType: "service",
    items: [
      {
        cantidad: "",
        unidad: "",
        descripcion: "",
        precio_unitario: "",
      },
    ],
  });
  // Admin flags
  const { isAdmin } = useAuthFlags();

  const { listProveedores } = useProveedores()
  const { listAlmacenes } = useAlmacenes()

  // Pestañas de historial para admin
  const [adminTab, setAdminTab] = useState("all"); // all | aprobadas | rechazadas
  const limit =
    limitOption === "all" ? pagination.totalItems || 0 : parseInt(limitOption, 10);

  const fetchRequisiciones = () => {
    setLoading(true);
    listRequisiciones({ page, limit, order: "DESC", search: debouncedSearch })
      .then((res) => {
        let data = res.data.data;
        if (statusFilter !== "ALL") {
          data = data.filter(
            (r) => (r.status || "").toLowerCase() === statusFilter.toLowerCase()
          );
        }
        setRequisiciones(data);
        setPagination(res.data.meta);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err.message ||
          "Error al cargar requisiciones";
        Swal.fire("Error", Array.isArray(msg) ? msg.join(", ") : msg, "error");
      })
      .finally(() => setLoading(false));
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

  useEffect(() => {
    fetchRequisiciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, statusFilter]);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);
  useEffect(() => {
    setPage(1);
  }, [limitOption]);

  const openDetailModal = (requisicion) => {
    setSelectedRequisicion(requisicion);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRequisicion(null);
  };

  // Acciones aprobar/rechazar
  const handleApprove = async (id) => {
    try {
      const confirm = await Swal.fire({
        title: "Aprobar requisición",
        text: "¿Confirmas aprobar esta requisición?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, aprobar",
        cancelButtonText: "Cancelar",
      });
      if (!confirm.isConfirmed) return;

      await approveRequisicion(id);
      Swal.fire("Éxito", "Requisición aprobada", "success");
      fetchRequisiciones();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "No se pudo aprobar";
      Swal.fire("Error", Array.isArray(msg) ? msg.join(", ") : msg, "error");
    }
  };

  const handleReject = async (id) => {
    try {
      const { isConfirmed } = await Swal.fire({
        title: "Rechazar requisición",
        text: "¿Confirmas rechazar esta requisición?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Rechazar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;

      await rejectRequisicion(id /*, { motivo } si tu API lo soporta */);
      Swal.fire("Listo", "Requisición rechazada", "success");
      fetchRequisiciones();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "No se pudo rechazar";
      Swal.fire("Error", Array.isArray(msg) ? msg.join(", ") : msg, "error");
    }
  };

  // Metrics
  const lower = (s) => (s || "").toLowerCase();
  const pendingCount = requisiciones.filter(
    (r) => lower(r.status) === "pendiente"
  ).length;
  const rechazadosCount = requisiciones.filter((r) =>
    ["rechazado", "rechazada"].includes(lower(r.status))
  ).length;
  const aprobadoCount = requisiciones.filter((r) =>
    ["aprobado", "aprobada"].includes(lower(r.status))
  ).length;


  // Data a render según pestaña de admin
  const filteredByAdminTab = !isAdmin
    ? requisiciones
    : adminTab === "aprobadas"
      ? requisiciones.filter((r) =>
        ["aprobado", "aprobada"].includes(lower(r.status))
      )
      : adminTab === "rechazadas"
        ? requisiciones.filter((r) =>
          ["rechazado", "rechazada"].includes(lower(r.status))
        )
        : requisiciones;


  const r = selectedRequisicion || null;

  function formatDate(value) {
    if (!value) return "N/A";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
  }

  function humanizeTipo(tipo) {
    if (tipo === "service") return "Servicio";
    if (tipo === "product") return "Refacciones";
    return "N/A";
  }

  function statusClasses(status) {
    switch (status) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "aprobado":
        return "bg-green-100 text-green-800";
      case "rechazado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

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
            <p className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </p>
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

  // Helpers items
  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { cantidad: "", unidad: "", descripcion: "", precio_unitario: "" },
      ],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData((prev) => {
      const next = [...prev.items];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, items: next };
    });
  };

  // Total estimado (UI)
  const totalEstimado = formData.items.reduce((acc, it) => {
    const q = Number(it.cantidad) || 0;
    const p = Number(it.precio_unitario) || 0;
    return acc + q * p;
  }, 0);
  const Detail = ({ label, value }) => (
    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value || "N/A"}</p>
    </div>
  );

  const Th = ({ children }) => (
    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {children}
    </th>
  );

  const Td = ({ children }) => (
    <td className="px-4 py-2 text-sm text-gray-700">{children}</td>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Requisiciones
          </h1>
          <p className="text-gray-600 mt-1">Administra todas las requisiciones</p>
        </div>
        <div />
      </div>

      <StatsSection />

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
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
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Crear Requisición
        </button>
      </div>
      {/* Pestañas de historial para Admin */}
      {isAdmin && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setAdminTab("all")}
            className={`px-3 py-1.5 rounded-lg border ${adminTab === "all"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300"
              }`}
          >
            Todas
          </button>
          <button
            onClick={() => setAdminTab("aprobadas")}
            className={`px-3 py-1.5 rounded-lg border ${adminTab === "aprobadas"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300"
              }`}
          >
            Aprobadas ({aprobadoCount})
          </button>
          <button
            onClick={() => setAdminTab("rechazadas")}
            className={`px-3 py-1.5 rounded-lg border ${adminTab === "rechazadas"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300"
              }`}
          >
            Rechazadas ({rechazadosCount})
          </button>
        </div>
      )}
      {/* Tabla */}
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
                    Tipo de requisición
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredByAdminTab.length > 0 ? (
                  filteredByAdminTab.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.rcp || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.fechaSolicitud
                          ? new Date(r.fechaSolicitud).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.titulo || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.prioridad || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${lower(r.status) === "pendiente"
                            ? "bg-yellow-100 text-yellow-800"
                            : ["aprobado", "aprobada"].includes(lower(r.status))
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {r.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {typeof r.cantidad_dinero === "number"
                          ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(r.cantidad_dinero)
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.requisicionType === "service"
                          ? "Servicio"
                          : r.requisicionType === "product"
                            ? "Producto"
                            : r.requisicionType === "consumibles"
                              ? "Consumibles"
                              : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm flex space-x-2">
                        <button
                          onClick={() => openDetailModal(r)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isAdmin && lower(r.status) === "pendiente" && (
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
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No se encontraron requisiciones
                      </h3>
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

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-green-50 text-green-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Nueva Requisición de Servicio
                  </h2>
                  <p className="text-xs text-gray-500">
                    Completa los campos para crear la requisición
                  </p>
                </div>

              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                const payload = {
                  ...formData,
                  rcp:
                    formData.rcp === "" || formData.rcp === null
                      ? null
                      : Number(formData.rcp),
                  almacenCargoId:
                    formData.almacenCargoId === "" ||
                      formData.almacenCargoId === null
                      ? null
                      : Number(formData.almacenCargoId),
                  proveedorId:
                    formData.proveedorId === "" ||
                      formData.proveedorId === null ? null : Number(formData.proveedorId),
                  items: formData.items.map((it) => ({
                    ...it,
                    cantidad:
                      it.cantidad === "" || it.cantidad === null
                        ? null
                        : Number(it.cantidad),
                    precio_unitario:
                      it.precio_unitario === "" || it.precio_unitario === null
                        ? null
                        : Number(it.precio_unitario),
                  })),
                };

                if (
                  !payload.almacenCargoId ||
                  Number.isNaN(payload.almacenCargoId) ||
                  payload.almacenCargoId <= 0
                ) {
                  Swal.fire(
                    "Error",
                    "almacenCargoId debe ser un número positivo",
                    "error"
                  );
                  return;
                }

                const invalidItem = payload.items.find(
                  (it) =>
                    !it.cantidad ||
                    Number.isNaN(it.cantidad) ||
                    Number(it.cantidad) <= 0 ||
                    !it.precio_unitario ||
                    Number.isNaN(it.precio_unitario) ||
                    Number(it.precio_unitario) < 0
                );
                if (invalidItem) {
                  Swal.fire(
                    "Error",
                    "Verifica cantidad (> 0) y precio_unitario (>= 0) en los items",
                    "error"
                  );
                  return;
                }

                try {
                  await createServiceRequisicion(payload);
                  Swal.fire(
                    "Éxito",
                    "Requisición creada correctamente",
                    "success"
                  );
                  setIsCreateModalOpen(false);
                  fetchRequisiciones();
                } catch (err) {
                  const msg =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Error al crear requisición";
                  Swal.fire(
                    "Error",
                    Array.isArray(msg) ? msg.join(", ") : msg,
                    "error"
                  );
                }
              }}
              className="px-6 py-5 space-y-8"
            >
              {/* Sección: Datos generales */}
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  Datos generales
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* RCP */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RCP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 12345"
                      value={formData.rcp}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          rcp: e.target.value === "" ? "" : Number(e.target.value),
                        }))
                      }
                      required
                      min={1}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Número de requisición de compra.
                    </p>
                  </div>

                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Mantenimiento de bomba hidráulica"
                      value={formData.titulo}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, titulo: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                  </div>

                  {/* Prioridad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridad <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.prioridad}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, prioridad: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>

                  {/* Almacén Cargo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID Almacén Cargo <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="almacenCargoId"
                      value={formData.almacenCargoId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          almacenCargoId:
                            e.target.value === "" ? "" : Number(e.target.value),
                        }))
                      }
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
                    <p className="text-xs text-gray-500 mt-1">
                      Almacén que cubrirá el gasto.
                    </p>
                  </div>


                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proveedor <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="proveedorId"
                      value={formData.proveedorId === null ? "" : String(formData.proveedorId)}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, proveedorId: e.target.value }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="" disabled>
                        -- Selecciona un proveedor --
                      </option>
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Concepto */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Concepto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Descripción general del servicio solicitado"
                      value={formData.concepto}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, concepto: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                  </div>

                  {/* Tipo (fijo service) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de requisición
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        Servicio
                      </span>
                      <p className="text-xs text-gray-500">
                        Este formulario está configurado para requisiciones de
                        servicio.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Sección: Items */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-green-600" />
                    Items del servicio
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar item
                  </button>
                </div>

                {formData.items.length === 0 && (
                  <p className="text-sm text-gray-500 mb-2">
                    Agrega al menos un item para describir el servicio.
                  </p>
                )}

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="relative border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      {/* Botón eliminar item */}
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute -top-3 -right-3 p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 shadow"
                        title="Eliminar item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            value={item.cantidad}
                            onChange={(e) =>
                              updateItem(index, "cantidad", e.target.value)
                            }
                            required
                            min={1}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          />
                        </div>

                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unidad <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. hr, día, pieza"
                            value={item.unidad}
                            onChange={(e) =>
                              updateItem(index, "unidad", e.target.value)
                            }
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Describe el servicio (ej. mantenimiento correctivo)"
                            value={item.descripcion}
                            onChange={(e) =>
                              updateItem(index, "descripcion", e.target.value)
                            }
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          />
                        </div>

                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio unitario <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={item.precio_unitario}
                            onChange={(e) =>
                              updateItem(index, "precio_unitario", e.target.value)
                            }
                            required
                            min={0}
                            step="0.01"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Moneda: USD (ajusta si tu backend usa otra).
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 -mx-6 px-6 py-4 rounded-b-xl flex items-center justify-end gap-2">
                <span className="mr-auto text-sm text-gray-700">
                  Total estimado:{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(totalEstimado)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {isDetailModalOpen && selectedRequisicion && (
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
                  <h2 className="text-lg font-semibold text-gray-900">
                    Detalles de la Requisición
                  </h2>
                  <p className="text-xs text-gray-500">
                    Vista resumen con información clave
                  </p>
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
              {/* Encabezado con badges */}
              <section className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200">
                  RCP: {selectedRequisicion.rcp || "N/A"}
                </span>

                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200">
                  {selectedRequisicion.requisicionType === "service"
                    ? "Servicio"
                    : selectedRequisicion.requisicionType === "product"
                      ? "Producto"
                      : "Tipo N/A"}
                </span>

                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${["aprobado", "aprobada"].includes(lower(selectedRequisicion.status))
                    ? "bg-green-50 text-green-700 border-green-200"
                    : lower(selectedRequisicion.status) === "pendiente"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-red-50 text-red-700 border-red-200"
                    }`}
                >
                  {selectedRequisicion.status || "Sin status"}
                </span>
              </section>

              {/* Grid datos principales */}
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Información general
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Detail label="Título" value={selectedRequisicion.titulo} />
                  <Detail label="HRM" value={selectedRequisicion.hrm} />
                  <Detail
                    label="Concepto"
                    value={selectedRequisicion.concepto || "Sin concepto"}
                  />
                  <Detail
                    label="Método de pago"
                    value={selectedRequisicion.metodo_pago}
                  />
                  <Detail label="Prioridad" value={selectedRequisicion.prioridad} />
                  <Detail
                    label="Fecha creación"
                    value={
                      selectedRequisicion.fechaSolicitud
                        ? new Date(
                          selectedRequisicion.fechaSolicitud
                        ).toLocaleDateString()
                        : "N/A"
                    }
                  />
                  <Detail
                    label="Fecha revisión"
                    value={
                      selectedRequisicion.fechaRevision
                        ? new Date(
                          selectedRequisicion.fechaRevision
                        ).toLocaleDateString()
                        : "N/A"
                    }
                  />
                </div>
              </section>

              {/* Relacionados */}
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Relacionados
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Detail label="Pedido por" value={selectedRequisicion.pedidoPor?.name} />
                  <Detail label="Revisado por" value={selectedRequisicion.revisadoPor?.name} />
                  <Detail
                    label="Almacén Destino"
                    value={selectedRequisicion.almacenDestino?.name}
                  />
                  <Detail label="Almacén Cargo" value={selectedRequisicion.almacenCargo?.name} />
                </div>
              </section>

              {/* Equipo */}
              <section className="print:break-inside-avoid">

                <h3 className="text-sm font-medium text-gray-700 mb-3">Equipo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Detail label="Equipo" value={selectedRequisicion.equipo?.equipo} />
                  <Detail
                    label="No. Económico"
                    value={selectedRequisicion.equipo?.no_economico}
                  />
                </div>
              </section>

              {/* Items */}
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  Items
                </h3>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{selectedRequisicion.requisicionType === "service" ? "Servicio" : "product" ? "Refacciones" : "Consumibles"}</h3>
                  {selectedRequisicion.items?.length > 0 ? (
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {selectedRequisicion.requisicionType === "product" ? (
                              <>
                                <Th>Producto ID</Th>
                                <Th>Descripción</Th>
                                <Th>Unidad</Th>
                                <Th>Cantidad</Th>
                                <Th>Precio Unitario</Th>
                              </>
                            ) : (
                              <>
                                <Th>Descripción</Th>
                                <Th>Cantidad</Th>
                                <Th>Unidad</Th>
                                <Th>Precio Unitario</Th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedRequisicion.items.map((item, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              {selectedRequisicion.requisicionType === "product" ? (
                                <>
                                  <Td>{item.producto?.id || "N/A"}</Td>
                                  <Td>{item.producto?.name || "Sin nombre"}</Td>
                                  <Td>{item.producto?.unidad || "Sin unidad"}</Td>
                                  <Td>{item.cantidadSolicitada ?? item.cantidad ?? "N/A"}</Td>
                                  <Td>{item.producto?.precio || "N/A"}</Td>
                                </>
                              ) : (
                                <>
                                  <Td>{item.descripcion || "N/A"}</Td>
                                  <Td>{item.cantidad || "N/A"}</Td>
                                  <Td>{item.unidad || "N/A"}</Td>
                                  <Td>
                                    {typeof item.precio_unitario === "number" ||
                                      (typeof item.precio_unitario === "string" &&
                                        item.precio_unitario !== "")
                                      ? item.precio_unitario
                                      : "N/A"}
                                  </Td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      No hay items registrados en esta requisición
                    </p>
                  )}

                </div>
              </section>
            </div>
            {/* Contenido oculto para exportar (layout imprimible) */}
            <div id={`req-print-${selectedRequisicion.id}`} className="hidden">
              <div className="pdf-card">{/* tu layout imprimible aquí */}</div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 px-6 py-4 rounded-b-xl flex flex-wrap gap-2 justify-end">
              <button
                onClick={() =>
                  exportRequisicionPDF(
                    `req-print-${selectedRequisicion.id}`,
                    `RCP${selectedRequisicion.rcp || selectedRequisicion.id}.pdf`
                  )
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Descargar PDF
              </button>
              <button
                onClick={() =>
                  printRequisicion(
                    `req-print-${selectedRequisicion.id}`,
                    `RCP${selectedRequisicion.rcp || selectedRequisicion.id}`
                  )
                }
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Imprimir / Guardar PDF
              </button>
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
