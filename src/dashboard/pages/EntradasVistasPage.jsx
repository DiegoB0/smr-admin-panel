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
import { useAlmacenes } from "../../hooks/useAlmacenes";

const EntradaVistaPage = () => {
  const { almacenId: almacenIdParam } = useParams();
  const almacenId = Number(almacenIdParam);
  const navigate = useNavigate();

  const { listEntradas } = useEntradas();
  const { listAlmacen } = useAlmacenes();

  const [almacen, setAlmacen] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("10");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [openRows, setOpenRows] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  });

  const debouncedSearch = useDebounce(searchTerm, 500);
  const limit =
    limitOption === "all"
      ? pagination.totalItems || 0
      : parseInt(limitOption, 10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const almacenRes = await listAlmacen({ id: almacenId });
      setAlmacen(almacenRes?.data?.data || almacenRes?.data);

      const entradasRes = await listEntradas({
        almacenId,
        page,
        limit: limitOption === "all" ? undefined : limit,
        search: debouncedSearch,
        order: "DESC",
      });

      const rawEntradas = entradasRes?.data?.data || [];

      const procesedEntradas = rawEntradas.map((r) => {
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

      setEntradas(procesedEntradas);
      setPagination({
        currentPage: page,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        totalItems: procesedEntradas.length,
      });
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        "No se pudieron cargar las entradas",
        "error"
      );
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
    const style = map[s] || map.pendiente;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full
         text-xs font-semibold ${style.bg} ${style.text}`}
      >
        {style.icon}
        {status}
      </span>
    );
  };

  const filteredEntradas = useMemo(() => {
    if (statusFilter === "ALL") return entradas;
    return entradas.filter((e) => e._statusLocal === statusFilter);
  }, [entradas, statusFilter]);

  const {
    completas,
    parciales,
    pendientes,
    totPzasSol,
    totPzasRec,
  } = useMemo(() => {
    let comp = 0,
      parc = 0,
      pend = 0,
      pzsSol = 0,
      pzsRec = 0;
    for (const r of entradas || []) {
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
  }, [entradas]);

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
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-6
       h-28 flex items-center transition-all duration-300 hover:shadow-md
       animate-fade-in"
    >
      <div className="flex items-center justify-between w-full">
        <div>
          <p className={`text-sm font-medium ${color.text} mb-1`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${color.text}`}>{value}</p>
        </div>
        <div
          className={`p-3 rounded-lg bg-gradient-to-br ${color.bg}
           to-${color.bg.split("-")[1]}-600`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <div className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3">
        </div>
        <p>Cargando entradas...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto font-inter">
      <style jsx global>{`
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
      `}</style>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <button
            className="flex gap-2 items-center"
            onClick={() =>
              navigate("/dashboard/entradas-compras")
            }
          >
            <span className="text-gray-500">
              <ChevronLeft />
            </span>
            <h1 className="text-gray-600 uppercase text-lg">
              Regresar
            </h1>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {almacen?.name || "Almacén"}
          </h1>
          <p className="text-gray-600 mt-1">
            Visualiza las entradas de compras para este almacén
          </p>
        </div>
        <div />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <StatCard
          title="Entradas completas"
          value={completas}
          color={{
            text: "text-green-600",
            bg: "bg-green-500/90",
          }}
          icon={<PackageCheck className="w-8 h-8 text-white" />}
        />
        <StatCard
          title="Entradas parciales"
          value={parciales}
          color={{
            text: "text-yellow-600",
            bg: "bg-yellow-500/90",
          }}
          icon={<CircleAlert className="w-8 h-8 text-white" />}
        />
        <StatCard
          title="Entradas pendientes"
          value={pendientes}
          color={{
            text: "text-gray-600",
            bg: "bg-gray-500/90",
          }}
          icon={<FileText className="w-8 h-8 text-white" />}
        />
        <StatCard
          title="Pzas recibidas / solicitadas"
          value={`${totPzasRec} / ${totPzasSol}`}
          color={{
            text: "text-indigo-600",
            bg: "bg-indigo-500/90",
          }}
          icon={<History className="w-8 h-8 text-white" />}
        />
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2
           text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por RCP o título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200
             rounded-lg focus:ring-2 focus:ring-blue-500
             focus:border-transparent shadow-sm transition-all"
            aria-label="Buscar entradas"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-lg
           focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
          className="px-4 py-3 border border-gray-200 rounded-lg
           focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          aria-label="Seleccionar elementos por página"
        >
          <option value="5">5 por página</option>
          <option value="10">10 por página</option>
          <option value="20">20 por página</option>
          <option value="all">Mostrar todos</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100
         overflow-hidden">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100
         overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold
                   text-gray-600 uppercase tracking-wide" />
                  <th className="px-6 py-3 text-left text-xs font-semibold
                   text-gray-600 uppercase tracking-wide">
                    RCP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold
                   text-gray-600 uppercase tracking-wide">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold
                   text-gray-600 uppercase tracking-wide">
                    Estatus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold
                   text-gray-600 uppercase tracking-wide">
                    Progreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold
                   text-gray-600 uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEntradas.length > 0 ? (
                  filteredEntradas.map((r) => {
                    const isOpen = !!openRows[r.id];
                    const st = r._statusLocal || "Pendiente";
                    const t = r._totales || {
                      itemsCompletos: 0,
                      itemsTotales: 0,
                      piezasRecibidas: 0,
                      piezasSolicitadas: 0,
                    };
                    return (
                      <React.Fragment key={r.id}>
                        <tr className="hover:bg-gray-50 transition-colors
                         duration-200 odd:bg-gray-50 animate-fade-in">
                          <td className="px-6 py-5">
                            <button
                              onClick={() => toggleRow(r.id)}
                              className="p-1 rounded-md hover:bg-gray-100
                               text-gray-600"
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
                          <td className="px-6 py-5 text-sm text-gray-500">
                            {r.fechaCreacion
                              ? new Date(
                                  r.fechaCreacion
                                ).toLocaleDateString()
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
                              onClick={() => toggleRow(r.id)}
                              className="p-2 text-blue-600
                               hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-6 pb-6">
                              <div className="mt-2 rounded-lg border
                               border-gray-100 overflow-hidden bg-white">
                                <table className="min-w-full">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs
                                       font-semibold text-gray-600 uppercase
                                       tracking-wide">
                                        ID Refacción
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs
                                       font-semibold text-gray-600 uppercase
                                       tracking-wide">
                                        Producto
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs
                                       font-semibold text-gray-600 uppercase
                                       tracking-wide">
                                        Solicitado
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs
                                       font-semibold text-gray-600 uppercase
                                       tracking-wide">
                                        Recibido
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs
                                       font-semibold text-gray-600 uppercase
                                       tracking-wide">
                                        Por recibir
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs
                                       font-semibold text-gray-600 uppercase
                                       tracking-wide">
                                        Estado
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {(r.items || []).map((it) => {
                                      const solic =
                                        Number(it.cantidadEsperada) || 0;
                                      const recAcum =
                                        Number(it.cantidadRecibida) || 0;
                                      const restante = Math.max(
                                        solic - recAcum,
                                        0
                                      );
                                      const completo =
                                        solic > 0 && recAcum >= solic;
                                      return (
                                        <tr
                                          key={it.id}
                                          className="hover:bg-gray-50
                                           transition-colors duration-200"
                                        >
                                          <td className="px-4 py-2 text-sm
                                           text-gray-700">
                                            {it.producto?.id || "N/A"}
                                          </td>
                                          <td className="px-4 py-2 text-sm
                                           text-gray-700">
                                            {it.producto?.name || "Producto"}
                                          </td>
                                          <td className="px-4 py-2 text-sm
                                           text-gray-700 text-right">
                                            {solic}
                                          </td>
                                          <td className="px-4 py-2 text-sm
                                           text-gray-700 text-right">
                                            {recAcum}
                                          </td>
                                          <td className="px-4 py-2 text-sm
                                           text-gray-700 text-right">
                                            {restante}
                                          </td>
                                          <td className="px-4 py-2 text-sm">
                                            {completo ? (
                                              <span
                                                className="inline-flex items-center
                                                 text-xs text-green-700"
                                              >
                                                <CheckCircle2 className="w-4
                                                 h-4 mr-1" />
                                                Completo
                                              </span>
                                            ) : recAcum > 0 ? (
                                              <span
                                                className="inline-flex items-center
                                                 text-xs text-yellow-700"
                                              >
                                                <CircleAlert className="w-4
                                                 h-4 mr-1" />
                                                Parcial
                                              </span>
                                            ) : (
                                              <span
                                                className="inline-flex items-center
                                                 text-xs text-gray-700"
                                              >
                                                <CircleX className="w-4 h-4
                                                 mr-1" />
                                                Pendiente
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FileText className="w-16 h-16 text-gray-400
                       mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900
                       mb-2">
                        No se encontraron entradas
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm
                          ? "Ajusta tu búsqueda"
                          : "No hay entradas para mostrar"}
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
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-2 bg-gray-900 text-white rounded-md
             disabled:opacity-50 hover:bg-gray-800 transition-colors"
            aria-label="Ir a la primera página"
          >
            1
          </button>
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={!pagination.hasPreviousPage}
            className="px-4 py-2 bg-gray-900 text-white rounded-md
             disabled:opacity-50 hover:bg-gray-800 transition-colors"
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
            className="px-4 py-2 bg-gray-900 text-white rounded-md
             disabled:opacity-50 hover:bg-gray-800 transition-colors"
            aria-label="Página siguiente"
          >
            Siguiente
          </button>
          <button
            onClick={() => setPage(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-2 bg-gray-900 text-white rounded-md
             disabled:opacity-50 hover:bg-gray-800 transition-colors"
            aria-label="Ir a la última página"
          >
            Última
          </button>
        </div>
      )}
    </div>
  );
};

export default EntradaVistaPage;