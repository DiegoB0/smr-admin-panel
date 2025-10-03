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
  ClipboardList,
} from "lucide-react";
import Swal from "sweetalert2";
import { printRequisicion } from "../../utils/printPdf";
import { useRequisiciones } from "../../hooks/useRequisiciones";
import PrintableRequisicion from "./PrintableRequisicion";

const lower = (s) => (s || "").toLowerCase();
const currency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n || 0
  );

const RequisicionesCompraPage = () => {
  const { listAprovedRequisiciones, pagarRequisicion } = useRequisiciones();

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
  });

  // Cargar desde backend real (solo aprobadas)
  const limit =
    limitOption === "all" ? undefined : parseInt(limitOption, 10) || 10;

  const fetchApproved = () => {
    setLoading(true);
    listAprovedRequisiciones({
      page,
      limit: limit ?? 999999,
      order: "DESC",
      search: searchTerm,
    })
      .then((res) => {
        const data = res?.data?.data || [];
        console.log("Fetched requisitions:", data); // Debug requisition states
        setAllItems(data);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Error al cargar requisiciones aprobadas";
        Swal.fire("Error", Array.isArray(msg) ? msg.join(", ") : msg, "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApproved();
  }, [page, limitOption, searchTerm]);

  // Paginación client-side si usas "all"
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((r) => {
      const hay =
        String(r.rcp ?? "").toLowerCase().includes(q) ||
        String(r.titulo ?? "").toLowerCase().includes(q) ||
        String(r.concepto ?? "").toLowerCase().includes(q);
      return hay;
    });
  }, [allItems, searchTerm]);

  const totalItems = filtered.length;
  const effectiveLimit =
    limitOption === "all" ? totalItems || 0 : parseInt(limitOption, 10);
  const totalPages = effectiveLimit
    ? Math.max(1, Math.ceil(totalItems / effectiveLimit))
    : 1;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, limitOption]);

  const currentPage = Math.min(page, totalPages);
  const start = effectiveLimit ? (currentPage - 1) * effectiveLimit : 0;
  const end = effectiveLimit ? start + effectiveLimit : totalItems;
  const pageItems =
    limitOption === "all" ? filtered : filtered.slice(start, end);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const compradas = filtered.filter((r) => lower(r.status) === "pagada")
      .length;
    const pendientesCompra = filtered.filter((r) =>
      ["aprobado", "aprobada"].includes(lower(r.status))
    ).length;
    const monto = filtered.reduce((acc, r) => {
      const n = typeof r.cantidad_dinero === "number" ? r.cantidad_dinero : 0;
      return acc + n;
    }, 0);
    return { total, compradas, pendientesCompra, monto };
  }, [filtered]);

  // Acciones
  const openPurchaseModal = (req) => {
    setSelectedRequisicion(req);
    setPurchaseForm({
      metodo_pago: "orden de compra",
      observaciones: "",
      fechaEsperada: "",
    });
    setIsPurchaseModalOpen(true);
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setSelectedRequisicion(null);
  };

  const handleMarkPurchased = async () => {
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

    console.log("Payload enviado a pagarRequisicion:", payload);

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
      console.error("Error en pagarRequisicion:", err.response?.data);
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

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Cargando requisiciones...</p>
      </div>
    </div>
  );

  const StatCard = ({ title, value, color, icon }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${color.text} mb-1`}>{title}</p>
          <p className={`text-2xl font-bold ${color.text}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color.bg}`}>{icon}</div>
      </div>
    </div>
  );

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total (aprobadas + compradas)"
          value={stats.total}
          color={{ text: "text-blue-600", bg: "bg-blue-500/90" }}
          icon={<FileText className="w-6 h-6 text-white" />}
        />
        <StatCard
          title="Pendientes de compra"
          value={stats.pendientesCompra}
          color={{ text: "text-amber-600", bg: "bg-amber-500/90" }}
          icon={<Filter className="w-6 h-6 text-white" />}
        />
        <StatCard
          title="Marcadas como compradas"
          value={stats.compradas}
          color={{ text: "text-emerald-600", bg: "bg-emerald-500/90" }}
          icon={<CheckCircle2 className="w-6 h-6 text-white" />}
        />
        <StatCard
          title="Monto estimado"
          value={currency(stats.monto)}
          color={{ text: "text-indigo-600", bg: "bg-indigo-500/90" }}
          icon={<BadgeDollarSign className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por RCP, título, concepto..."
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
        <div className="bg-white rounded-lg shadow-md border overflow-hidden">
          <LoadingSpinner />
        </div>
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
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estatus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageItems.length > 0 ? (
                  pageItems.map((r) => {
                    const isPurchased = lower(r.status) === "pagada";
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {r.rcp ?? "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {r.fechaSolicitud
                            ? new Date(r.fechaSolicitud).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {r.titulo || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-sm">
                          {r.concepto || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              isPurchased
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {isPurchased ? "Pagada" : "Aprobada"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {typeof r.cantidad_dinero === "number"
                            ? currency(r.cantidad_dinero)
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm flex items-center gap-2">
                          <button
                            onClick={() => openDetailModal(r)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!isPurchased ? (
                            <button
                              onClick={() => openPurchaseModal(r)}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                              title="Marcar como comprada"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Marcar
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-4 h-4" />
                              Pagada
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay requisiciones aprobadas
                      </h3>
                      <p className="text-gray-600">
                        Cuando existan requisiciones aprobadas aparecerán aquí.
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
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal Detalles + plantilla oculta para PDF/print */}
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
              <section className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200">
                  RCP: {selectedRequisicion.rcp || "N/A"}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    lower(selectedRequisicion.status) === "pagada"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {lower(selectedRequisicion.status) === "pagada"
                    ? "Pagada"
                    : "Aprobada"}
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
                </div>
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Items
                </h3>
                {selectedRequisicion.items?.length > 0 ? (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
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
                          <tr key={i} className="hover:bg-gray-50">
                            <Td>{it.descripcion || it.producto?.name || "N/A"}</Td>
                            <Td>{it.cantidad ?? "N/A"}</Td>
                            <Td>{it.unidad ?? (it.producto ? "pz" : "N/A")}</Td>
                            <Td>
                              {typeof it.precio_unitario === "number"
                                ? currency(it.precio_unitario)
                                : it.precio_unitario || "—"}
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

            {/* Contenido oculto para exportar (layout imprimible) */}
            <PrintableRequisicion requisicion={selectedRequisicion} />

            {/* Footer modal */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 px-6 py-4 rounded-b-xl flex flex-wrap gap-2 justify-end">
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

      {/* Modal para Marcar como Pagada */}
      {isPurchaseModalOpen && selectedRequisicion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={closePurchaseModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
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
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows="4"
                  placeholder="Ingresa observaciones"
                  required
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 px-6 py-4 rounded-b-xl flex gap-2 justify-end">
              <button
                onClick={closePurchaseModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkPurchased}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                disabled={loading}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequisicionesCompraPage;
