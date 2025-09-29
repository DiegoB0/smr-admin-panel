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
} from "lucide-react";
import Swal from "sweetalert2";
import { exportRequisicionPDF } from "../../utils/exportPdf";
import { printRequisicion } from "../../utils/printPdf";

// Helpers
const lower = (s) => (s || "").toLowerCase();
const currency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n || 0
  );

// Mocks (puedes moverlos a un archivo aparte si quieres)
const makeMock = (id, status) => ({
  id,
  rcp: 1000 + id,
  fechaSolicitud: new Date(Date.now() - id * 86400000).toISOString(),
  titulo:
    status === "comprado"
      ? `Compra cerrada #${id}`
      : `Requisición aprobada #${id}`,
  concepto:
    status === "comprado"
      ? "Adquisición completada por compras"
      : "Pendiente de compra",
  status,
  cantidad_dinero: Math.round((Math.random() * 4500 + 500) * 100) / 100,
  requisicionType: Math.random() > 0.6 ? "product" : "service",
});
const MOCK_DATA = [
  ...Array.from({ length: 7 }, (_, i) => makeMock(i + 1, "aprobado")),
  ...Array.from({ length: 4 }, (_, i) => makeMock(100 + i + 1, "comprado")),
];

const RequisicionesCompraPage = () => {
  // Estado base de mocks (simula tu dataset)
  const [allItems, setAllItems] = useState(MOCK_DATA);

  // UI states
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("10"); // "5" | "10" | "20" | "all"

  // Derivados
  const filtered = useMemo(() => {
    // ver solo aprobados y comprados
    const visibles = allItems.filter((r) =>
      ["aprobado", "aprobada", "comprado"].includes(lower(r.status))
    );

    // search
    const q = searchTerm.trim().toLowerCase();
    if (!q) return visibles;

    return visibles.filter((r) => {
      const hay =
        String(r.rcp ?? "").toLowerCase().includes(q) ||
        String(r.titulo ?? "").toLowerCase().includes(q) ||
        String(r.concepto ?? "").toLowerCase().includes(q);
      return hay;
    });
  }, [allItems, searchTerm]);

  // Paginación client-side
  const totalItems = filtered.length;
  const limit =
    limitOption === "all" ? totalItems || 0 : parseInt(limitOption, 10);
  const totalPages = limit ? Math.max(1, Math.ceil(totalItems / limit)) : 1;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, limitOption]);

  const currentPage = Math.min(page, totalPages);
  const start = limit ? (currentPage - 1) * limit : 0;
  const end = limit ? start + limit : totalItems;
  const pageItems = filtered.slice(start, end);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const compradas = filtered.filter((r) => lower(r.status) === "comprado")
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
  const handleMarkPurchased = async (req) => {
    try {
      const confirm = await Swal.fire({
        title: "Marcar como comprada",
        html: `<div class="text-left">
          <p class="text-sm text-gray-600">RCP: <b>${req.rcp ?? "N/A"}</b></p>
          <p class="text-sm text-gray-600 mt-1">¿Confirmas marcar esta requisición como <b>comprada</b>?</p>
        </div>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, marcar",
        cancelButtonText: "Cancelar",
      });
      if (!confirm.isConfirmed) return;

      setLoading(true);
      // Simula latencia
      await new Promise((r) => setTimeout(r, 500));

      setAllItems((prev) =>
        prev.map((x) => (x.id === req.id ? { ...x, status: "comprado" } : x))
      );

      Swal.fire("Listo", "Requisición marcada como comprada", "success");
    } catch (err) {
      Swal.fire("Error", "No se pudo marcar como comprada", "error");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
          <p className="text-gray-600 mt-1">
            Requisiciones aprobadas para gestionar compras
          </p>
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
                    const isPurchased = lower(r.status) === "comprado";
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
                            {isPurchased ? "Comprado" : "Aprobado"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {typeof r.cantidad_dinero === "number"
                            ? currency(r.cantidad_dinero)
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm flex items-center gap-2">
                          <button
                            onClick={() =>
                              exportRequisicionPDF(
                                `req-print-${r.id}`,
                                `RCP${r.rcp || r.id}.pdf`
                              )
                            }
                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="Descargar PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              printRequisicion(
                                `req-print-${r.id}`,
                                `RCP${r.rcp || r.id}`
                              )
                            }
                            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Imprimir / Guardar PDF"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!isPurchased && (
                            <button
                              onClick={() => handleMarkPurchased(r)}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                              title="Marcar como comprada"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Marcar
                            </button>
                          )}
                          {isPurchased && (
                            <span className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-4 h-4" />
                              Comprada
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

      {/* Plantillas ocultas para imprimir/descargar */}
      <div className="hidden">
        {pageItems.map((r) => (
          <div key={r.id} id={`req-print-${r.id}`}>
            <div className="pdf-card p-4">
              <div
                className="pdf-grid"
                style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
              >
                <div>
                  <div className="pdf-label">NO. RCP</div>
                  <div className="pdf-value">{r.rcp ?? "N/A"}</div>
                </div>
                <div>
                  <div className="pdf-label">FECHA</div>
                  <div className="pdf-value">
                    {r.fechaSolicitud
                      ? new Date(r.fechaSolicitud).toLocaleDateString("es-MX")
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="pdf-label">ESTATUS</div>
                  <div className="pdf-value">
                    {lower(r.status) === "comprado" ? "Comprado" : "Aprobado"}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div className="pdf-label">TÍTULO</div>
                <div className="pdf-value">{r.titulo || "N/A"}</div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div className="pdf-label">CONCEPTO</div>
                <div className="pdf-value">{r.concepto || "N/A"}</div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div className="pdf-label">MONTO</div>
                <div className="pdf-value">{currency(r.cantidad_dinero)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequisicionesCompraPage;