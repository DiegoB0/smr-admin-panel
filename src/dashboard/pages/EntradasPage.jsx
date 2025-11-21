"use client";

import { useParams, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  FileText,
  Search,
  Eye,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  CircleAlert,
  CircleX,
  PackageCheck,
  History,
} from "lucide-react";
import Swal from "sweetalert2";
import { useDebounce } from "../../hooks/customHooks";
import { useEntradas } from "../../hooks/useEntradas";

// ========== PAGE ==========
const EntradasPage = () => {
  const { listEntradas, recibirEntradas } = useEntradas();
  const [requis, setRequis] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  });
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("10");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [openRows, setOpenRows] = useState({});
  const [capture, setCapture] = useState({});
  const [histModalOpen, setHistModalOpen] = useState(false);
  const [isEntradaDetailModalOpen, setIsEntradaDetailModalOpen] = useState(
    false
  );
  const [selectedEntrada, setSelectedEntrada] = useState(null);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [selectedRequisicionForCapture, setSelectedRequisicionForCapture] =
    useState(null);

  const { almacenId: almacenIdParam } = useParams();
  const almacenId = Number(almacenIdParam);
  const navigate = useNavigate();

  const limit =
    limitOption === "all"
      ? pagination.totalItems || 0
      : parseInt(limitOption, 10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await listEntradas({
        almacenId,
        page,
        limit: limitOption === "all" ? undefined : limit,
        search: debouncedSearch,
        order: "DESC",
      });
      const rawData = response.data.data || [];
      const data = rawData.map((r) => {
        const items = r.items || [];
        const totalSolic = items.reduce(
          (a, it) => a + (Number(it.cantidadEsperada) || 0),
          0
        );
        const totalRec = items.reduce(
          (a, it) => a + (Number(it.cantidadRecibida) || 0),
          0
        );
        const completos = items.filter(
          (it) =>
            Number(it.cantidadEsperada) > 0 &&
            Number(it.cantidadRecibida) >= Number(it.cantidadEsperada)
        ).length;
        const status =
          !items || items.length === 0
            ? "Pendiente"
            : completos === items.length
              ? "Completa"
              : totalRec > 0
                ? "Parcial"
                : "Pendiente";
        return {
          ...r,
          _statusLocal: status,
          _totales: {
            itemsCompletos: completos,
            itemsTotales: items.length,
            piezasRecibidas: totalRec,
            piezasSolicitadas: totalSolic,
          },
        };
      });
      setRequis(data);
      setPagination({
        currentPage: page,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        totalItems: rawData.length,
      });
    } catch (err) {
      const msg = err?.message || "Error al cargar requisiciones";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limitOption, debouncedSearch, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limitOption, statusFilter]);

  const toggleRow = (id) =>
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const setCantidadRecibida = (requisId, itemId, value) => {
    const valNum = value === "" ? "" : Number(value);
    setCapture((prev) => ({
      ...prev,
      [requisId]: {
        ...(prev[requisId] || {}),
        [itemId]: valNum,
      },
    }));
  };

  const limpiarCaptura = (requisId) =>
    setCapture((prev) => ({ ...prev, [requisId]: {} }));

  const openEntradaDetailModal = (entrada) => {
    setSelectedEntrada(entrada);
    setIsEntradaDetailModalOpen(true);
  };

  const closeEntradaDetailModal = () => {
    setIsEntradaDetailModalOpen(false);
    setSelectedEntrada(null);
  };

  const openCaptureModal = (requisicion) => {
    setSelectedRequisicionForCapture(requisicion);
    setIsCaptureModalOpen(true);
  };

  const closeCaptureModal = () => {
    setIsCaptureModalOpen(false);
    setSelectedRequisicionForCapture(null);
  };

  const StatusBadge = ({ status }) => {
    const s = (status || "").toLowerCase();
    const map = {
      completa: {
        bg: "bg-gradient-to-r from-green-100 to-green-200",
        text: "text-green-800",
        icon: <CheckCircle2 className="w-4 h-4 mr-1" />,
      },
      parcial: {
        bg: "bg-gradient-to-r from-yellow-100 to-yellow-200",
        text: "text-yellow-800",
        icon: <CircleAlert className="w-4 h-4 mr-1" />,
      },
      pendiente: {
        bg: "bg-gradient-to-r from-gray-100 to-gray-200",
        text: "text-gray-800",
        icon: <CircleX className="w-4 h-4 mr-1" />,
      },
    };
    const { bg, text, icon } = map[s] || map.pendiente;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}
      >
        {icon}
        {status}
      </span>
    );
  };

  const handleRegistrarEntrada = async (requisicion) => {
    console.log("=== DEBUG REGISTRAR ENTRADA ===");
    console.log("Requisición ID:", requisicion.id);
    console.log("Capture state completo:", capture);
    console.log("Capture para este requisición:", capture[requisicion.id]);

    const entradas = Object.entries(capture[requisicion.id] || {})
      .filter(([itemId, val]) => {
        const isValid = val !== "" && !Number.isNaN(Number(val)) && Number(val) > 0;
        console.log(`Item ${itemId}: valor=${val}, válido=${isValid}`);
        return isValid;
      })
      .map(([itemId, val]) => ({
        itemId: Number(itemId),
        cantidadRecibida: Number(val),
      }));

    console.log("Entradas filtradas:", entradas);

    if (entradas.length === 0) {
      Swal.fire(
        "Atención",
        "No hay cantidades a registrar. Por favor ingresa al menos una cantidad.",
        "info"
      );
      return;
    }

    const itemsById = new Map((requisicion.items || []).map((i) => [i.id, i]));
    const errores = [];
    for (const e of entradas) {
      const it = itemsById.get(e.itemId);
      if (!it) continue;
      const solic = Number(it.cantidadEsperada) || 0;
      const recAcum = Number(it.cantidadRecibida) || 0;
      if (e.cantidadRecibida < 0) {
        errores.push(`Item ${e.itemId}: cantidad negativa`);
      } else if (recAcum + e.cantidadRecibida > solic) {
        errores.push(
          `Item ${e.itemId}: excede lo solicitado (${recAcum + e.cantidadRecibida} > ${solic})`
        );
      }
    }
    if (errores.length) {
      Swal.fire("Error de validación", errores.join("\n"), "error");
      return;
    }

    try {
      setLoading(true);
      console.log("Enviando payload:", { items: entradas });
      await recibirEntradas(requisicion.id, { items: entradas });
      Swal.fire("Éxito", "Entrada registrada", "success");
      limpiarCaptura(requisicion.id);
      fetchData();
    } catch (err) {
      console.error("Error al registrar:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error al registrar entrada";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const { completas, parciales, pendientes, totPzasSol, totPzasRec } = useMemo(
    () => {
      let comp = 0,
        parc = 0,
        pend = 0,
        pzsSol = 0,
        pzsRec = 0;
      for (const r of requis || []) {
        const st = r._statusLocal || "Pendiente";
        if (st === "Completa") comp++;
        else if (st === "Parcial") parc++;
        else pend++;
        pzsSol += r._totales?.piezasSolicitadas || 0;
        pzsRec += r._totales?.piezasRecibidas || 0;
      }
      return {
        completas: comp,
        parciales: parc,
        pendientes: pend,
        totPzasSol: pzsSol,
        totPzasRec: pzsRec,
      };
    },
    [requis]
  );

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
        <p className="mt-4 text-gray-600">Cargando entradas...</p>
      </div>
    </div>
  );

  const StatCard = ({ title, value, color, icon }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 h-28 flex items-center transition-all duration-300 hover:shadow-md animate-fade-in">
      <div className="flex items-center justify-between w-full">
        <div>
          <p className={`text-sm font-medium ${color.text} mb-1`}>{title}</p>
          <p className={`text-2xl font-bold ${color.text}`}>{value}</p>
        </div>
        <div
          className={`p-3 rounded-lg bg-gradient-to-br ${color.bg} to-${color.bg.split("-")[1]}-600`}
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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto font-inter">
      {/* Estilo global para la fuente y animaciones */}
      <style>{`
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
          position: absolute;
          background-color: rgb(31, 41, 55);
          color: white;
          font-size: 0.75rem;
          border-radius: 0.25rem;
          padding: 0.25rem 0.5rem;
          top: -2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          white-space: nowrap;
        }
      `}</style>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <button
            className="flex gap-2 items-center"
            onClick={() => navigate(`/dashboard/almacenes/`)}
          >
            <span className="text-gray-500">
              <ChevronLeft />
            </span>
            <h1 className="text-gray-600 uppercase text-lg">Regresar</h1>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Entradas</h1>
          <p className="text-gray-600 mt-1">
            Registra la recepción de productos por requisición
          </p>
        </div>
        <div />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <StatCard
          title="Requis completas"
          value={completas}
          color={{ text: "text-green-600", bg: "bg-green-500/90" }}
          icon={<PackageCheck className="w-8 h-8 text-white" />}
        />
        <StatCard
          title="Requis parciales"
          value={parciales}
          color={{ text: "text-yellow-600", bg: "bg-yellow-500/90" }}
          icon={<CircleAlert className="w-8 h-8 text-white" />}
        />
        <StatCard
          title="Requis pendientes"
          value={pendientes}
          color={{ text: "text-gray-600", bg: "bg-gray-500/90" }}
          icon={<FileText className="w-8 h-8 text-white" />}
        />
        <StatCard
          title="Pzas recibidas / solicitadas"
          value={`${totPzasRec} / ${totPzasSol}`}
          color={{ text: "text-indigo-600", bg: "bg-indigo-500/90" }}
          icon={<History className="w-8 h-8 text-white" />}
        />
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por RCP o título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
            aria-label="Buscar requisiciones"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          aria-label="Filtrar por estatus"
        >
          <option value="ALL">Todos</option>
          <option value="Completa">Completa</option>
          <option value="Parcial">Parcial</option>
          <option value="Pendiente">Pendiente</option>
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
        <button
          onClick={() => setHistModalOpen(true)}
          className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          aria-label="Ver historial de entradas"
        >
          Ver historial
        </button>
      </div>

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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide" />
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    RCP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Almacén
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Estatus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Progreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requis.length > 0 ? (
                  requis.map((r) => {
                    const isOpen = !!openRows[r.id];
                    const st = r._statusLocal || "Pendiente";
                    const t = r._totales || {
                      itemsCompletos: 0,
                      itemsTotales: 0,
                      piezasRecibidas: 0,
                      piezasSolicitadas: 0,
                    };
                    const isCompleta = st === "Completa";

                    return (
                      <React.Fragment key={r.id}>
                        <tr className="hover:bg-gray-50 transition-colors duration-200 odd:bg-gray-50 animate-fade-in">
                          <td className="px-6 py-5">
                            <button
                              onClick={() => toggleRow(r.id)}
                              className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
                            >
                              {isOpen ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-700">
                            {r.requisicion?.rcp ?? "N/A"}
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-700">
                            {r.almacenDestino?.name ?? "N/A"}
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-500">
                            {r.fechaCreacion
                              ? new Date(r.fechaCreacion).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-6 py-5 text-sm">
                            <StatusBadge status={st} />
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-700">
                            {t.itemsCompletos}/{t.itemsTotales} items •{" "}
                            {t.piezasRecibidas}/{t.piezasSolicitadas} pzas
                          </td>
                          <td className="px-6 py-5 text-sm flex gap-2">
                            <button
                              onClick={() => openEntradaDetailModal(r)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              aria-label="Ver detalles de la entrada"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isCompleta ? (
                              <span className="inline-flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
                                <CheckCircle2 className="w-4 h-4" />
                                Completada
                              </span>
                            ) : (
                              <button
                                onClick={() => openCaptureModal(r)}
                                className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                  <>
                                    <PackageCheck className="w-4 h-4" />
                                    Registrar
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="px-6 pb-6">
                              <div className="mt-2 rounded-lg border border-gray-100 overflow-hidden bg-white">
                                <table className="min-w-full">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        ID Refacción
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Producto
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Solicitado
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Recibido
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Por recibir
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Capturar entrada
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {(r.items || []).map((it) => {
                                      const solic = Number(it.cantidadEsperada) || 0;
                                      const recAcum =
                                        Number(it.cantidadRecibida) || 0;
                                      const restante = Math.max(solic - recAcum, 0);
                                      const curCapture =
                                        capture[r.id]?.[it.id] ?? "";
                                      const completo =
                                        solic > 0 && recAcum >= solic;
                                      return (
                                        <tr
                                          key={it.id}
                                          className="hover:bg-gray-50 transition-colors duration-200"
                                        >
                                          <td className="px-4 py-2 text-sm text-gray-700">
                                            {it.producto?.id || "N/A"}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-700">
                                            {it.producto?.name || "Producto"}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-700 text-right">
                                            {solic}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-700 text-right">
                                            {recAcum}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-700 text-right">
                                            {restante}
                                          </td>
                                          <td className="px-4 py-2 text-sm">
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                placeholder="0"
                                                min={0}
                                                max={restante}
                                                value={curCapture}
                                                disabled={completo}
                                                onChange={(e) =>
                                                  setCantidadRecibida(
                                                    r.id,
                                                    it.id,
                                                    e.target.value
                                                  )
                                                }
                                                className="w-28 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition disabled:bg-gray-100 shadow-sm"
                                                aria-label={`Capturar entrada para el item ${it.producto?.name || "N/A"}`}
                                              />
                                              {!completo ? (
                                                <>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setCantidadRecibida(
                                                        r.id,
                                                        it.id,
                                                        restante
                                                      )
                                                    }
                                                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                  >
                                                    Completar
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setCantidadRecibida(
                                                        r.id,
                                                        it.id,
                                                        0
                                                      )
                                                    }
                                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                                  >
                                                    Restablecer
                                                  </button>
                                                </>
                                              ) : (
                                                <span className="inline-flex items-center text-xs text-green-700">
                                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                                  Completo
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              <div className="mt-3 flex justify-end gap-2">
                                <button
                                  onClick={() => limpiarCaptura(r.id)}
                                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                  aria-label="Limpiar capturas"
                                >
                                  Limpiar capturas
                                </button>
                                {!isCompleta && (
                                  <button
                                    onClick={() => handleRegistrarEntrada(r)}
                                    className="inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                      <>
                                        <PackageCheck className="w-4 h-4" />
                                        Registrar entrada
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No se encontraron requisiciones para entrada
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm
                          ? "Ajusta tu búsqueda"
                          : "No hay requisiciones pendientes de recepción"}
                      </p>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        onClick={() => navigate("/dashboard/requisiciones")}
                        aria-label="Crear nueva requisición"
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
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 hover:bg-gray-800 transition-colors"
            aria-label="Ir a la primera página"
          >
            1
          </button>
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={!pagination.hasPreviousPage}
            className="px-4 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 hover:bg-gray-800 transition-colors"
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
            className="px-4 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 hover:bg-gray-800 transition-colors"
            aria-label="Página siguiente"
          >
            Siguiente
          </button>
          <button
            onClick={() => setPage(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 hover:bg-gray-800 transition-colors"
            aria-label="Ir a la última página"
          >
            Última
          </button>
        </div>
      )}

      {/* Modal Detalles de Entrada */}
      {isEntradaDetailModalOpen && selectedEntrada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={closeEntradaDetailModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full sm:max-w-2xl h-full sm:max-h-[92vh] overflow-y-auto transform animate-scale-in"
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
                    Detalles de la Entrada
                  </h2>
                  <p className="text-xs text-gray-500">
                    RCP: {selectedEntrada.requisicion?.rcp || "N/A"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEntradaDetailModal}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar modal de detalles"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-6">
              {/* Info general */}
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Información general
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Detail
                    label="RCP"
                    value={selectedEntrada.requisicion?.rcp || "N/A"}
                  />
                  <Detail
                    label="Almacén destino"
                    value={selectedEntrada.almacenDestino?.name || "N/A"}
                  />
                  <Detail
                    label="Fecha creación"
                    value={
                      selectedEntrada.fechaCreacion
                        ? new Date(
                            selectedEntrada.fechaCreacion
                          ).toLocaleDateString()
                        : "N/A"
                    }
                  />
                  <Detail
                    label="Estatus"
                    value={
                      <StatusBadge status={selectedEntrada._statusLocal} />
                    }
                  />
                  <Detail
                    label="Fecha esperada"
                    value={
                      selectedEntrada.fechaEsperada
                        ? new Date(
                            selectedEntrada.fechaEsperada
                          ).toLocaleDateString()
                        : "No registrada"
                    }
                  />
                  <Detail
                    label="Método de pago"
                    value={selectedEntrada.requisicion?.metodo_pago || "N/A"}
                  />
                </div>
              </section>

              {/* Observaciones */}
              {selectedEntrada.requisicion?.observaciones && (
                <section>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Observaciones
                  </h3>
                  <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedEntrada.requisicion.observaciones}
                    </p>
                  </div>
                </section>
              )}

              {/* Items recibidos */}
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Items recibidos
                </h3>
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Producto
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Solicitado
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Recibido
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Diferencia
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(selectedEntrada.items || []).map((it) => {
                        const solic = Number(it.cantidadEsperada) || 0;
                        const rec = Number(it.cantidadRecibida) || 0;
                        const diff = rec - solic;
                        return (
                          <tr
                            key={it.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {it.producto?.name || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 text-right">
                              {solic}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 text-right">
                              {rec}
                            </td>
                            <td
                              className={`px-4 py-2 text-sm text-right font-medium ${
                                diff > 0
                                  ? "text-green-600"
                                  : diff < 0
                                    ? "text-red-600"
                                    : "text-gray-600"
                              }`}
                            >
                              {diff > 0 ? "+" : ""}
                              {diff}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Resumen */}
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Resumen
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Detail
                    label="Items completos"
                    value={`${selectedEntrada._totales?.itemsCompletos || 0}/${
                      selectedEntrada._totales?.itemsTotales || 0
                    }`}
                  />
                  <Detail
                    label="Piezas recibidas"
                    value={selectedEntrada._totales?.piezasRecibidas || 0}
                  />
                  <Detail
                    label="Piezas solicitadas"
                    value={selectedEntrada._totales?.piezasSolicitadas || 0}
                  />
                  <Detail
                    label="Progreso"
                    value={
                      selectedEntrada._totales?.piezasSolicitadas > 0
                        ? `${Math.round(
                            ((selectedEntrada._totales?.piezasRecibidas || 0) /
                              (selectedEntrada._totales
                                ?.piezasSolicitadas || 1)) *
                              100
                          )}%`
                        : "N/A"
                    }
                  />
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-100 px-6 py-4 rounded-b-xl flex justify-end">
              <button
                onClick={closeEntradaDetailModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                aria-label="Cerrar modal"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Captura de Entradas */}
      {isCaptureModalOpen && selectedRequisicionForCapture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={closeCaptureModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full sm:max-w-3xl h-full sm:max-h-[92vh] overflow-y-auto transform animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-green-50 text-green-600">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Registrar Entrada
                  </h2>
                  <p className="text-xs text-gray-500">
                    RCP:{" "}
                    {selectedRequisicionForCapture.requisicion?.rcp || "N/A"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCaptureModal}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar modal"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        ID Producto
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Producto
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Solicitado
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Recibido
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Por recibir
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Capturar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedRequisicionForCapture.items || []).map((it) => {
                      const solic = Number(it.cantidadEsperada) || 0;
                      const recAcum = Number(it.cantidadRecibida) || 0;
                      const restante = Math.max(solic - recAcum, 0);
                      const curCapture =
                        capture[selectedRequisicionForCapture.id]?.[it.id] ??
                        "";
                      const completo = solic > 0 && recAcum >= solic;
                      return (
                        <tr
                          key={it.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {it.producto?.id || "N/A"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {it.producto?.name || "Producto"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700 text-right">
                            {solic}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700 text-right">
                            {recAcum}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700 text-right">
                            {restante}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                placeholder="0"
                                min={0}
                                max={restante}
                                value={curCapture}
                                disabled={completo}
                                onChange={(e) =>
                                  setCantidadRecibida(
                                    selectedRequisicionForCapture.id,
                                    it.id,
                                    e.target.value
                                  )
                                }
                                className="w-24 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition disabled:bg-gray-100 shadow-sm"
                                aria-label={`Capturar entrada para ${it.producto?.name}`}
                              />
                              {!completo ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCantidadRecibida(
                                        selectedRequisicionForCapture.id,
                                        it.id,
                                        restante
                                      )
                                    }
                                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                  >
                                    Completar
                                  </button>
                                </>
                              ) : (
                                <span className="inline-flex items-center text-xs text-green-700">
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Completo
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-100 px-6 py-4 rounded-b-xl flex gap-2 justify-end">
              <button
                onClick={() =>
                  limpiarCaptura(selectedRequisicionForCapture.id)
                }
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                aria-label="Limpiar capturas"
              >
                Limpiar
              </button>
              <button
                onClick={closeCaptureModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                aria-label="Cancelar"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleRegistrarEntrada(selectedRequisicionForCapture);
                  closeCaptureModal();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                disabled={loading}
                aria-label="Confirmar registro"
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
                  <>
                    <PackageCheck className="w-4 h-4" />
                    Registrar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial */}
      {histModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setHistModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full sm:max-w-4xl h-full sm:max-h-[92vh] overflow-y-auto transform animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Historial de entradas
                  </h2>
                  <p className="text-xs text-gray-500">
                    Registros de esta sesión (no persistente)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistModalOpen(false)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar modal de historial"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <div className="px-6 py-5">
              {historial.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  No hay movimientos registrados aún.
                </div>
              ) : (
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Fecha
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            RCP
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Almacén
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Producto
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Cantidad
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {historial
                          .slice()
                          .sort(
                            (a, b) =>
                              new Date(b.fecha).getTime() -
                              new Date(a.fecha).getTime()
                          )
                          .map((h) => (
                            <tr
                              key={h.id}
                              className="hover:bg-gray-50 transition-colors duration-200"
                            >
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {new Date(h.fecha).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {h.rcp}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {h.almacen}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {h.productoName}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700 text-right">
                                {h.cantidadRecibida}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {historial.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: "¿Borrar historial?",
                        text: "Eliminará los registros de esta sesión.",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Sí, borrar",
                        cancelButtonText: "Cancelar",
                      }).then((res) => {
                        if (res.isConfirmed) {
                          setHistorial([]);
                          Swal.fire("Listo", "Historial borrado", "success");
                        }
                      });
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    aria-label="Borrar historial"
                    data-tooltip="Eliminar registros"
                  >
                    Borrar historial
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntradasPage;
