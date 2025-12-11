"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  FileText,
  ShoppingCart,
  CheckCircle2,
  Search,
  ClipboardList,
  Filter,
  Eye,
  BadgeDollarSign,
  CircleDollarSign,
  XCircle,
  X,
  Check
} from "lucide-react";
import Swal from "sweetalert2";
import { debounce } from "lodash";
import { printRequisicion } from "../../utils/printPdf";
import { useRequisiciones } from "../../hooks/useRequisiciones";
import { useDebounce } from "../../hooks/customHooks";
import PrintableRequisicion from "./PrintableRequisicion";

const lower = (s) => (s || "").toLowerCase();
const currency = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n || 0);

const RequisicionesCompraPage = () => {
  const { markAsPaid, getStats, listAprovedRequisiciones } = useRequisiciones();

  // Estado base
  const [allItems, setAllItems] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("10");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [stats, setStats] = useState({
    pagada: 0,
    aprobada: 0,
    pendiente: 0,
    rechazada: 0,
    total: 0,
  });


  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequisicion, setSelectedRequisicion] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  const [selectedItemQuantities, setSelectedItemQuantities] = useState({});
  const updateItemQuantity = (itemId, quantity) => {
    setSelectedItemQuantities((prev) => ({
      ...prev,
      [itemId]: parseInt(quantity) || 0,
    }));
  };

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    metodo_pago: "orden de compra",
    observaciones: "",
    fechaEsperada: "",
    submitted: false,
  });


  // Cargar desde backend
  const limit =
    limitOption === "all" ? 1000 : parseInt(limitOption, 10) || 10;

  const fetchApproved = () => {
    setLoading(true);
    const params = {
      page,
      limit,
      order: "DESC",
      search: debouncedSearch,
      status: statusFilter,
    };
    if (limitOption === "all") {
      delete params.limit;
    }
    listAprovedRequisiciones(params)
      .then((res) => {
        setAllItems(res?.data?.data || []);
        setPagination(res?.data?.meta || {
          currentPage: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          totalItems: 0,
        });
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

  const fetchStats = () => {
    getStats()
      .then((res) => {
        setStats(res.data)
      })
      .catch((err) => {
        console.error("Error loading stats:", err);
      });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchApproved();
  }, [page, limitOption, debouncedSearch, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limitOption]);


  // Acciones
  const openPurchaseModal = (req) => {
    setSelectedRequisicion(req);
    setSelectedItemIds([]);
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
    if (selectedItemIds.length === 0) {
      Swal.fire("Error", "Selecciona al menos un item", "error");
      return;
    }

    const allowedMetodos = [
      "orden de compra",
      "pago",
      "pago sin factura",
      "-",
    ];
    if (!allowedMetodos.includes(purchaseForm.metodo_pago)) {
      Swal.fire("Error", "Método de pago no válido", "error");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        requisicionType: selectedRequisicion.requisicionType,
        items: selectedItemIds.map((itemId) => ({
          id: itemId,
          cantidadPagada: selectedItemQuantities[itemId] || 0,
        })),
        metodo_pago: purchaseForm.metodo_pago,
        observaciones: purchaseForm.observaciones,
        fecha_esperada: purchaseForm.fechaEsperada,
      };

      console.log('Sending payload:', payload);

      await markAsPaid(selectedRequisicion.id, payload);

      Swal.fire("Listo", "Requisición marcada como pagada", "success");
      setAllItems((prev) =>
        prev.map((x) =>
          x.id === selectedRequisicion.id ? { ...x, status: "pagada" } : x
        )
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

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const toggleItemSelection = (itemId, itemCantidad) => {
    setSelectedItemIds((prev) => {
      if (prev.includes(itemId)) {
        // Removing from selection
        return prev.filter((id) => id !== itemId);
      } else {
        setSelectedItemQuantities((prevQty) => ({
          ...prevQty,
          [itemId]: itemCantidad,
        }));
        return [...prev, itemId];
      }
    });
  };

  const openDetailModal = (r) => {
    console.log(r)
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
        <p className="mt-4 text-gray-600">Cargando requisiciones...</p>
      </div>
    </div>
  );

  const StatCard = ({ title, value, color, icon }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 h-28 flex items-center transition-all duration-300 hover:shadow-md animate-fade-in">
      <div className="flex items-center justify-between w-full">
        <div className="pr-4">
          <p className={`text-sm font-medium ${color.text} mb-1`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${color.text}`}>{value}</p>
        </div>
        <div
          className={`p-3 rounded-lg bg-gradient-to-br ${color.bg.replace(
            "/90",
            ""
          )} to-${color.bg.split("-")[1]}-600`}
        >
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
      <style >{`
        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          letter-spacing: -0.01em;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
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
          value={stats.aprobada}
          color={{ text: "text-green-600", bg: "bg-green-500/90" }}
          icon={<CheckCircle2 className="w-8 h-8 text-white" />}
        />
        <StatCard
          title="Pagadas"
          value={stats.pagada}
          color={{ text: "text-blue-500", bg: "bg-blue-600/90" }}
          icon={<CircleDollarSign className="w-8 h-8 text-white" />}
        />
        <StatCard
          title="Otras"
          value={stats.pendiente + stats.rechazada}
          color={{ text: "text-gray-500", bg: "bg-gray-600/90" }}
          icon={<AlertTriangle className="w-8 h-8 text-white" />}
        />
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por RCP, título, concepto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => handleStatusChange("ALL")}
          className={`px-3 py-1.5 rounded-lg border ${statusFilter === "ALL"
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-700 border-gray-300"
            }`}
        >
          Todas
        </button>
        <button
          onClick={() => handleStatusChange("aprobada")}
          className={`px-3 py-1.5 rounded-lg border ${statusFilter === "aprobada"
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-700 border-gray-300"
            }`}
        >
          Aprobadas
        </button>
        <button
          onClick={() => handleStatusChange("pagada")}
          className={`px-3 py-1.5 rounded-lg border ${statusFilter === "pagada"
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-700 border-gray-300"
            }`}
        >
          Pagadas
        </button>
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
                  <Th>Precio estimado</Th>
                  <Th>Monto final</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allItems.length > 0 ? (
                  allItems.map((r) => {
                    const statusStyles = getStatusStyles(r.status);
                    const canMarkAsPurchased = [
                      "aprobada",
                      "aprobado",
                    ].includes(lower(r.status));
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-gray-50 transition-colors duration-200 odd:bg-gray-50 animate-fade-in"
                      >
                        <Td>{r.formattedRcp ?? "N/A"}</Td>
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
                        <Td>
                          {r.cantidadEstimada ? currency(r.cantidadEstimada) : "N/A"}
                        </Td>
                        <Td align="right">
                          {r.cantidadActual ? currency(r.cantidadActual) : "N/A"}
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openDetailModal(r)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
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
            className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 hover:bg-gray-800 transition-colors"
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
            className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 hover:bg-gray-800 transition-colors"
            aria-label="Página siguiente"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal Detalles */}
      {
        isDetailModalOpen && selectedRequisicion && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={closeDetailModal}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto"
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
                    RCP: {selectedRequisicion.formattedRcp || "N/A"}
                  </span>

                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200">
                    {selectedRequisicion.requisicionType === "consumibles"
                      ? "Consumibles"
                      : selectedRequisicion.requisicionType === "refacciones"
                        ? "Refacciones"
                        : selectedRequisicion.requisicionType === "filtros"
                          ? "Filtros"
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
                    <Detail label="HRS" value={selectedRequisicion.hrs} />
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


                <section>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Observaciones
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <Detail label="Notas de almacen" value={selectedRequisicion.observaciones} />
                    <Detail label="Notas de compras" value={selectedRequisicion.observacionesCompras} />
                  </div>
                </section>


                {/* Items */}
                <section>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Items
                  </h3>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {selectedRequisicion.requisicionType === "consumibles"
                        ? "Consumibles"
                        : selectedRequisicion.requisicionType === "refacciones"
                          ? "Refacciones"
                          : selectedRequisicion.requisicionType === "filtros"
                            ? "Filtros"
                            : "Tipo N/A"}
                    </h3>
                    {selectedRequisicion.insumos?.length > 0 ? (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr key={selectedRequisicion.insumos?.id}>
                              <Th>Descripción</Th>
                              <Th>Unidad</Th>
                              <Th>Cantidad Esperada</Th>
                              <Th>Cantidad Comprada</Th>
                              <Th>Precio Unitario</Th>
                              <Th>Tipo de moneda</Th>
                              <Th>Pagado</Th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {
                              selectedRequisicion.insumos.map((item, i) => (
                                <tr key={i}>
                                  <Td>{item.descripcion}</Td>
                                  <Td>{item.unidad}</Td>
                                  <Td>{item.cantidad}</Td>
                                  <Td>{item.cantidadPagada || 'N/A'}</Td>
                                  <Td>{item.precio}</Td>
                                  <Td>{item.currency}</Td>
                                  <Td>{item.paid === true ? <Check /> : <X />}</Td>
                                </tr>
                              ))
                            }

                          </tbody>
                        </table>
                      </div>

                    ) : selectedRequisicion.refacciones?.length > 0 ? (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr key={selectedRequisicion.refacciones?.id}>
                              <Th>ID</Th>
                              <Th>No. Economico</Th>
                              <Th>Unidad</Th>
                              <Th>Cantidad Esperada</Th>
                              <Th>Cantidad Comprada</Th>
                              <Th>Precio</Th>
                              <Th>Moneda</Th>
                              <Th>Pagado</Th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {
                              selectedRequisicion.refacciones.map((item, i) => (
                                <tr key={i}>
                                  <Td>{item.customId}</Td>
                                  <Td>{item.no_economico}</Td>
                                  <Td>{item.unidad}</Td>
                                  <Td>{item.cantidad}</Td>
                                  <Td>{item.cantidadPagada || 'N/A'}</Td>
                                  <Td>{item.precio}</Td>
                                  <Td>{item.currency}</Td>
                                  <Td>{item.paid === true ? <Check /> : <X />}</Td>
                                </tr>
                              ))
                            }

                          </tbody>
                        </table>
                      </div>

                    ) : selectedRequisicion.filtros?.length > 0 ? (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr key={selectedRequisicion.filtros?.id}>
                              <Th>ID</Th>
                              <Th>No. Economico</Th>
                              <Th>Unidad</Th>
                              <Th>Cantidad Esperada</Th>
                              <Th>Cantidad Comprada</Th>
                              <Th>Precio</Th>
                              <Th>Moneda</Th>
                              <Th>Pagado</Th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {
                              selectedRequisicion.filtros.map((item, i) => (
                                <tr key={i}>
                                  <Td>{item.customId}</Td>
                                  <Td>{item.no_economico}</Td>
                                  <Td>{item.unidad}</Td>
                                  <Td>{item.cantidad}</Td>
                                  <Td>{item.cantidadPagada || 'N/A'}</Td>
                                  <Td>{item.precio}</Td>
                                  <Td>{item.currency}</Td>
                                  <Td>{item.paid === true ? <Check /> : <X />}</Td>
                                </tr>
                              ))
                            }

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
              <PrintableRequisicion requisicion={selectedRequisicion} />
              {/* Footer */}
              <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 px-6 py-4 rounded-b-xl flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() =>
                    printRequisicion(
                      `req-print-${selectedRequisicion.id}`,
                      `RCP${selectedRequisicion.formattedRcp|| selectedRequisicion.id}`
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
        )
      }

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
            {/* Header */}
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
                    RCP: {selectedRequisicion.formattedRcp || "N/A"}
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
              {/* Items Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecciona items a marcar como pagados
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {selectedRequisicion.insumos?.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id, item.cantidad)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        {item.descripcion} - {item.cantidad} {item.unidad}
                      </span>
                      {selectedItemIds.includes(item.id) && (
                        <input
                          type="number"
                          min="0"
                          max={item.cantidad}
                          value={selectedItemQuantities[item.id] !== undefined ? selectedItemQuantities[item.id] : item.cantidad}
                          onChange={(e) => {
                            console.log('Changed quantity for item', item.id, 'to', e.target.value);
                            updateItemQuantity(item.id, parseInt(e.target.value) || 0);
                          }}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Cantidad"
                        />
                      )}

                    </label>
                  ))}
                  {selectedRequisicion.refacciones?.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id, item.cantidad)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        {item.customId} - {item.cantidad} {item.unidad}
                      </span>
                      {selectedItemIds.includes(item.id) && (
                        <input
                          type="number"
                          min="0"
                          max={item.cantidad}
                          value={selectedItemQuantities[item.id] !== undefined ? selectedItemQuantities[item.id] : item.cantidad}
                          onChange={(e) => {
                            console.log('Changed quantity for item', item.id, 'to', e.target.value);
                            updateItemQuantity(item.id, parseInt(e.target.value) || 0);
                          }}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Cantidad"
                        />
                      )}

                    </label>
                  ))}
                  {selectedRequisicion.filtros?.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id, item.cantidad)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        {item.customId} - {item.cantidad} {item.unidad}
                      </span>

                      {selectedItemIds.includes(item.id) && (
                        <input
                          type="number"
                          min="0"
                          max={item.cantidad}
                          value={selectedItemQuantities[item.id] !== undefined ? selectedItemQuantities[item.id] : item.cantidad}
                          onChange={(e) => {
                            console.log('Changed quantity for item', item.id, 'to', e.target.value);
                            updateItemQuantity(item.id, parseInt(e.target.value) || 0);
                          }}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Cantidad"
                        />
                      )}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedItemIds.length} item(s) seleccionado(s)
                </p>
              </div>

              {/* Rest of form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <select
                  value={purchaseForm.metodo_pago}
                  onChange={(e) =>
                    setPurchaseForm({
                      ...purchaseForm,
                      metodo_pago: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
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
                    setPurchaseForm({
                      ...purchaseForm,
                      observaciones: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  rows="4"
                  placeholder="Ingresa observaciones"
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
                    setPurchaseForm({
                      ...purchaseForm,
                      fechaEsperada: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm ${purchaseForm.submitted && !purchaseForm.fechaEsperada
                    ? "border-red-500"
                    : "border-gray-200"
                    }`}
                  required
                />
                {purchaseForm.submitted && !purchaseForm.fechaEsperada && (
                  <p className="text-xs text-red-500 mt-1">
                    La fecha es obligatoria
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-100 px-6 py-4 rounded-b-xl flex gap-2 justify-end">
              <button
                onClick={closePurchaseModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkPurchased}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2"
                disabled={loading}
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
