"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  ShoppingCart,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  BadgeDollarSign,
  CircleDollarSign,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { debounce } from "lodash"; // Asegúrate de instalar lodash
import { printRequisicion } from "../../utils/printPdf";
import { useRequisiciones } from "../../hooks/useRequisiciones";
import PrintableRequisicion from "./PrintableRequisicion";

const lower = (s) => (s || "").toLowerCase();
const currency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n || 0
  );

const RequisicionesCompraPage = () => {
  const { listRequisiciones, pagarRequisicion } = useRequisiciones();

  // Estado base
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("10");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequisicion, setSelectedRequisicion] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    metodo_pago: "orden de compra",
    observaciones: "",
    fechaEsperada: "",
    submitted: false, // Para manejar validaciones
  });
  const [totalBackendItems, setTotalBackendItems] = useState(0);

  // Debounce para la búsqueda
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
    []
  );

  // Cargar desde backend
  const limit =
    limitOption === "all" ? 1000 : parseInt(limitOption, 10) || 10;

  const fetchApproved = () => {
    setLoading(true);
    const params = {
      page,
      limit,
      order: "DESC",
      search: searchTerm,
    };
    if (limitOption === "all") {
      delete params.limit;
    }
    listRequisiciones(params)
      .then((res) => {
        const data = res?.data?.data || [];
        const total = res?.data?.pagination?.total || data.length;
        setAllItems(data);
        setTotalBackendItems(total);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Error al cargar requisiciones.";
        Swal.fire("Error", Array.isArray(msg) ? msg.join(", ") : msg, "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApproved();
  }, [page, limitOption, searchTerm]);

  // Filtrado client-side
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((r) => {
      return (
        String(r.rcp ?? "").toLowerCase().includes(q) ||
        String(r.titulo ?? "").toLowerCase().includes(q) ||
        String(r.concepto ?? "").toLowerCase().includes(q)
      );
    });
  }, [allItems, searchTerm]);

  // Paginación
  const totalItems = limitOption === "all" ? filtered.length : totalBackendItems;
  const effectiveLimit =
    limitOption === "all" ? filtered.length || 0 : parseInt(limitOption, 10);
  const totalPages = effectiveLimit
    ? Math.max(1, Math.ceil(totalItems / effectiveLimit))
    : 1;

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [totalPages]);

  const currentPage = Math.min(page, totalPages);
  const start = effectiveLimit ? (currentPage - 1) * effectiveLimit : 0;
  const end = effectiveLimit ? start + effectiveLimit : totalItems;
  const pageItems =
    limitOption === "all" ? filtered : filtered.slice(start, end);

  // Estadísticas
  const stats = useMemo(() => {
    const total = filtered.length;
    const pendientes = filtered.filter((r) => lower(r.status) === "pendiente").length;
    const aprobadas = filtered.filter((r) =>
      ["aprobada", "aprobado"].includes(lower(r.status))
    ).length;
    const pagadas = filtered.filter((r) => lower(r.status) === "pagada").length;
    const rechazadas = filtered.filter((r) => lower(r.status) === "rechazada").length;
    const monto = filtered.reduce((acc, r) => {
      const n = typeof r.cantidad_dinero === "number" ? r.cantidad_dinero : 0;
      return acc + n;
    }, 0);
    return { total, pendientes, aprobadas, pagadas, rechazadas, monto };
  }, [filtered]);

  // Acciones
  const openPurchaseModal = (req) => {
    setSelectedRequisicion(req);
    setPurchaseForm({
      metodo_pago: "orden de compra",
      observaciones: "",
      fechaEsperada: "",
      submitted: false,
    });
    setIsPurchaseModalOpen(true);
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setSelectedRequisicion(null);
  };

  const handleMarkPurchased = async () => {
    setPurchaseForm((prev) => ({ ...prev, submitted: true }));
    if (!selectedRequisicion) {
      Swal.fire("Error", "No se seleccionó ninguna requisición", "error");
      return;
    }
    if (!purchaseForm.fechaEsperada) {
      Swal.fire("Error", "La fecha esperada es obligatoria", "error");
      return;
    }
    const allowedMetodos = ["orden de compra", "pago", "pago sin factura", "-"];
    if (!allowedMetodos.includes(purchaseForm.metodo_pago)) {
      Swal.fire("Error", "Método de pago no válido", "error");
      return;
    }

    const payload = {
      metodo_pago: purchaseForm.metodo_pago,
      observaciones: purchaseForm.observaciones || "",
      fechaEsperada: purchaseForm.fechaEsperada,
    };

    try {
      setLoading(true);
      await pagarRequisicion(selectedRequisicion.id, payload);
      Swal.fire("Listo", "Requisición marcada como pagada", "success");
      setAllItems((prev) =>
        prev.map((x) => (x.id === selectedRequisicion.id ? { ...x, status: "pagada" } : x))
      );
      closePurchaseModal();
      fetchApproved();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo marcar como pagada";
      Swal.fire("Error", Array.isArray(msg) ? msg.join(", ") : msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (r) => {
    setSelectedRequisicion(r);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRequisicion(null);
  };

  const getStatusStyles = (status) => {
    switch (lower(status)) {
      case "pendiente":
        return {
          bg: "bg-gradient-to-r from-yellow-100 to-yellow-200",
          text: "text-yellow-800",
          border: "border-yellow-200",
          label: "Pendiente",
          icon: <Filter className="w-3 h-3" />,
        };
      case "aprobado":
        return {
          bg: "bg-gradient-to-r from-blue-100 to-blue-200",
          text: "text-blue-800",
          border: "border-blue-200",
          label: "Aprobada",
          icon: <CheckCircle2 className="w-3 h-3" />,
        };
      case "pagada":
        return {
          bg: "bg-gradient-to-r from-green-100 to-green-200",
          text: "text-green-800",
          border: "border-green-200",
          label: "Pagada",
          icon: <CheckCircle2 className="w-3 h-3" />,
        };
      case "rechazada":
        return {
          bg: "bg-gradient-to-r from-red-100 to-red-200",
          text: "text-red-800",
          border: "border-red-200",
          label: "Rechazada",
          icon: <XCircle className="w-3 h-3" />,
        };
      default:
        return {
          bg: "bg-gradient-to-r from-gray-100 to-gray-200",
          text: "text-gray-800",
          border: "border-gray-200",
          label: status || "N/A",
          icon: null,
        };
    }
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <svg
          className="animate-spin h-12 w-12 text-blue-600"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
        </svg>
        <p className="mt-4 text-gray-600">Cargando requisiciones...</p>
      </div>
    </div>
  );

  const StatCard = ({ title, value, color, icon }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 h-28 flex items-center transition-all duration-300 hover:shadow-md animate-fade-in">
      <div className="flex items-center justify-between w-full">
        <div className="pr-4">
          <p className={`text-sm font-medium ${color.text} mb-1`}>{title}</p>
          <p className={`text-2xl font-bold ${color.text}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${color.bg.replace('/90', '')} to-${color.bg.split('-')[1]}-600`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const Detail = ({ label, value }) => (
    <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value || "N/A"}</p>
    </div>
  );

  const Th = ({ children }) => (
    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {children}
    </th>
  );

  const Td = ({ children, align = "left" }) => (
    <td className={`px-6 py-5 text-sm text-gray-700 text-${align}`}>
      {children}
    </td>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto font-inter">
      {/* Estilo global para la fuente */}
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
          <BadgeDollarSign className="w-4 h-4" />
          <span>Total a considerar: {currency(stats.monto)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
        <StatCard
          title="Total requisiciones"
          value={stats.total}
          color={{ text: "text-blue-600", bg: "bg-blue-500/90" }}
          icon={<FileText className="w-8 h-8 text-white" />}
        />
        <StatCard
          title="Aprobadas"
          value={stats.aprobadas}
          color={{ text: "text-green-600", bg: "bg-green-500/90" }}
          icon={<CheckCircle2 className="w-8 h-8 text-white" />}
        />
        <StatCard
          title="Pagadas"
          value={stats.pagadas}
          color={{ text: "text-blue-500", bg: "bg-blue-600/90" }}
          icon={<CircleDollarSign className="w-8 h-8 text-white" />}
        />
        <StatCard
          title="Monto total"
          value={currency(stats.monto)}
          color={{ text: "text-indigo-600", bg: "bg-indigo-500/90" }}
          icon={<BadgeDollarSign className="w-8 h-8 text-white" />}
        />
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por RCP, título, concepto..."
            onChange={(e) => debouncedSetSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
            aria-label="Buscar requisiciones"
          />
        </div>
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

      {/* Tabla */}
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
                  <Th>RCP</Th>
                  <Th>Fecha</Th>
                  <Th>Título</Th>
                  <Th>Concepto</Th>
                  <Th>Estatus</Th>
                  <Th>Monto</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.length > 0 ? (
                  pageItems.map((r) => {
                    const statusStyles = getStatusStyles(r.status);
                    const canMarkAsPurchased = ["aprobada", "aprobado"].includes(lower(r.status));
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-gray-50 transition-colors duration-200 odd:bg-gray-50 animate-fade-in"
                      >
                        <Td>{r.rcp ?? "N/A"}</Td>
                        <Td>
                          {r.fechaSolicitud
                            ? new Date(r.fechaSolicitud).toLocaleDateString()
                            : "N/A"}
                        </Td>
                        <Td>{r.titulo || "N/A"}</Td>
                        <Td className="truncate max-w-sm">{r.concepto || "—"}</Td>
                        <Td>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles.bg} ${statusStyles.text}`}
                          >
                            {statusStyles.icon}
                            {statusStyles.label}
                          </span>
                        </Td>
                        <Td align="right">
                          {typeof r.cantidad_dinero === "number"
                            ? currency(r.cantidad_dinero)
                            : "N/A"}
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openDetailModal(r)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              aria-label={`Ver detalles de la requisición ${r.rcp || 'N/A'}`}
                              data-tooltip="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canMarkAsPurchased ? (
                              <button
                                onClick={() => openPurchaseModal(r)}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                Marcar
                              </button>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg ${statusStyles.bg} ${statusStyles.text} ${statusStyles.border}`}
                              >
                                {statusStyles.icon}
                                {statusStyles.label}
                              </span>
                            )}
                          </div>
                        </Td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay requisiciones
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Cuando existan requisiciones, aparecerán aquí.
                      </p>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        onClick={() => {/* Navegar a crear requisición */}}
                      >
                        Crear Nueva Requisición
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
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 hover:bg-gray-800 transition-colors"
            aria-label="Ir a la primera página"
          >
            1
          </button>
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 hover:bg-gray-800 transition-colors"
            aria-label="Página anterior"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 hover:bg-gray-800 transition-colors"
            aria-label="Página siguiente"
          >
            Siguiente
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 hover:bg-gray-800 transition-colors"
            aria-label="Ir a la última página"
          >
            Última
          </button>
        </div>
      )}

      {/* Modal Detalles */}
      {isDetailModalOpen && selectedRequisicion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={closeDetailModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full sm:max-w-3xl h-full sm:max-h-[92vh] overflow-y-auto transform animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
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
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar modal de detalles"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-8">
              <section className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200">
                  RCP: {selectedRequisicion.rcp || "N/A"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(selectedRequisicion.status).bg} ${getStatusStyles(selectedRequisicion.status).text} ${getStatusStyles(selectedRequisicion.status).border}`}
                >
                  {getStatusStyles(selectedRequisicion.status).icon}
                  {getStatusStyles(selectedRequisicion.status).label}
                </span>
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Información general
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Detail label="Título" value={selectedRequisicion.titulo} />
                  <Detail
                    label="Fecha"
                    value={
                      selectedRequisicion.fechaSolicitud
                        ? new Date(
                            selectedRequisicion.fechaSolicitud
                          ).toLocaleDateString()
                        : "N/A"
                    }
                  />
                  <Detail
                    label="Concepto"
                    value={selectedRequisicion.concepto || "N/A"}
                  />
                  <Detail
                    label="Monto"
                    value={currency(selectedRequisicion.cantidad_dinero)}
                  />
                  <Detail
                    label="Prioridad"
                    value={selectedRequisicion.prioridad || "N/A"}
                  />
                  <Detail
                    label="Almacén Destino"
                    value={selectedRequisicion.almacenDestino?.name || "N/A"}
                  />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Items
                </h3>
                {selectedRequisicion.items?.length > 0 ? (
                  <div className="rounded-lg border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          <Th>Descripción / Producto</Th>
                          <Th>Cantidad</Th>
                          <Th>Unidad</Th>
                          <Th>Precio Unitario</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedRequisicion.items.map((it, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <Td>{it.descripcion || it.producto?.name || "N/A"}</Td>
                            <Td>{it.cantidadSolicitada ?? "N/A"}</Td>
                            <Td>{it.producto?.unidad ?? "N/A"}</Td>
                            <Td align="right">
                              {typeof it.producto?.precio === "string"
                                ? currency(parseFloat(it.producto.precio))
                                : "N/A"}
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600">No hay items registrados.</p>
                )}
              </section>
            </div>

            {/* Contenido oculto para exportar */}
            <PrintableRequisicion requisicion={selectedRequisicion} />

            {/* Footer modal */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-100 px-6 py-4 rounded-b-xl flex flex-wrap gap-2 justify-end">
              <button
                onClick={() =>
                  printRequisicion(
                    `req-print-${selectedRequisicion.id}`,
                    `RCP${selectedRequisicion.rcp || selectedRequisicion.id}`
                  )
                }
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                aria-label="Imprimir o guardar como PDF"
              >
                Imprimir / Guardar PDF
              </button>
              <button
                onClick={closeDetailModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                aria-label="Cerrar modal"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Marcar como Pagada */}
      {isPurchaseModalOpen && selectedRequisicion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={closePurchaseModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full sm:max-w-md h-full sm:max-h-[92vh] overflow-y-auto transform animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Marcar como Pagada
                  </h2>
                  <p className="text-xs text-gray-500">
                    RCP: {selectedRequisicion.rcp || "N/A"}
                  </p>
                </div>
              </div>
              <button
                onClick={closePurchaseModal}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar modal de pago"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <select
                  value={purchaseForm.metodo_pago}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, metodo_pago: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  aria-label="Seleccionar método de pago"
                >
                  <option value="orden de compra">Orden de Compra</option>
                  <option value="pago">Pago</option>
                  <option value="pago sin factura">Pago sin Factura</option>
                  <option value="-">-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={purchaseForm.observaciones}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, observaciones: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  rows="4"
                  placeholder="Ingresa observaciones"
                  aria-label="Observaciones"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Esperada
                </label>
                <input
                  type="date"
                  value={purchaseForm.fechaEsperada}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, fechaEsperada: e.target.value })
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm ${
                    purchaseForm.submitted && !purchaseForm.fechaEsperada
                      ? "border-red-500"
                      : "border-gray-200"
                  }`}
                  required
                  aria-label="Fecha esperada"
                />
                {purchaseForm.submitted && !purchaseForm.fechaEsperada && (
                  <p className="text-xs text-red-500 mt-1">La fecha es obligatoria</p>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-100 px-6 py-4 rounded-b-xl flex gap-2 justify-end">
              <button
                onClick={closePurchaseModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                aria-label="Cancelar"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkPurchased}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2"
                disabled={loading}
                aria-label="Confirmar pago"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                    />
                  </svg>
                ) : (
                  "Confirmar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequisicionesCompraPage;
