"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
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

  const limit =
    limitOption === "all" ? pagination.totalItems || 0 : parseInt(limitOption, 10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await listEntradas({
        page,
        limit: limitOption === "all" ? undefined : limit,
        search: debouncedSearch,
        order: "DESC",
      });
      const data = response.data.data.map((r) => {
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
        const status = !items || items.length === 0 ? "Pendiente"
          : completos === items.length ? "Completa"
          : totalRec > 0 ? "Parcial"
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
      setPagination(response.data.meta);
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

  const StatusBadge = ({ status }) => {
    const s = (status || "").toLowerCase();
    const map = {
      completa: "bg-green-100 text-green-800",
      parcial: "bg-yellow-100 text-yellow-800",
      pendiente: "bg-gray-100 text-gray-800",
    };
    const icon =
      s === "completa" ? (
        <CheckCircle2 className="w-4 h-4 mr-1" />
      ) : s === "parcial" ? (
        <CircleAlert className="w-4 h-4 mr-1" />
      ) : (
        <CircleX className="w-4 h-4 mr-1" />
      );
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${map[s] || map.pendiente}`}
      >
        {icon}
        {status}
      </span>
    );
  };

  const handleRegistrarEntrada = async (requisicion) => {
    const entradas = Object.entries(capture[requisicion.id] || {})
      .filter(([, val]) => val !== "" && !Number.isNaN(Number(val)))
      .map(([itemId, val]) => ({
        itemId: Number(itemId),
        cantidadRecibida: Number(val),
      }));

    if (entradas.length === 0) {
      Swal.fire("Atención", "No hay cantidades a registrar", "info");
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
      await recibirEntradas(requisicion.id, { items: entradas });
      Swal.fire("Éxito", "Entrada registrada", "success");
      limpiarCaptura(requisicion.id);
      fetchData();
    } catch (err) {
      const msg = err?.message || "Error al registrar entrada";
      Swal.fire("Error", msg, "error");
    }
  };

  const { completas, parciales, pendientes, totPzasSol, totPzasRec } = useMemo(() => {
    let comp = 0,
      parc = 0,
      pend = 0,
      pzsSol = 0,
      pzsRec = 0;
    for (const r of requis) {
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
  }, [requis]);

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Cargando entradas...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Entradas</h1>
          <p className="text-gray-600 mt-1">
            Registra la recepción de productos por requisición
          </p>
        </div>
        <div />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Requis completas
              </p>
              <p className="text-2xl font-bold text-green-600">{completas}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500">
              <PackageCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Requis parciales
              </p>
              <p className="text-2xl font-bold text-yellow-600">{parciales}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500">
              <CircleAlert className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Requis pendientes
              </p>
              <p className="text-2xl font-bold text-gray-600">{pendientes}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-500">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Pzas recibidas / solicitadas
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {totPzasRec} / {totPzasSol}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <History className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por RCP o título..."
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
          <option value="Completa">Completa</option>
          <option value="Parcial">Parcial</option>
          <option value="Pendiente">Pendiente</option>
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

        <button
          onClick={() => setHistModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          title="Ver historial de entradas"
        >
          Ver historial
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    RCP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Almacén
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estatus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Progreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
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
                    return (
                      <React.Fragment key={r.id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleRow(r.id)}
                              className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
                              title={isOpen ? "Contraer" : "Expandir"}
                            >
                              {isOpen ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {r.requisicion?.rcp ?? "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {r.almacenDestino?.name ?? "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {r.fechaCreacion
                              ? new Date(r.fechaCreacion).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <StatusBadge status={st} />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {t.itemsCompletos}/{t.itemsTotales} items •{" "}
                            {t.piezasRecibidas}/{t.piezasSolicitadas} pzas
                          </td>
                          <td className="px-6 py-4 text-sm flex gap-2">
                            <button
                              onClick={() => toggleRow(r.id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Ver items"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRegistrarEntrada(r)}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                              title="Registrar entrada"
                            >
                              Registrar
                            </button>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="px-6 pb-6">
                              <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden bg-white">
                                <table className="min-w-full">
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
                                      const completo = solic > 0 && recAcum >= solic;
                                      return (
                                        <tr key={it.id} className="hover:bg-gray-50">
                                          <td className="px-4 py-2 text-sm text-gray-700">
                                            {it.producto?.name || "Producto"}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-700">
                                            {solic}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-700">
                                            {recAcum}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-700">
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
                                                className="w-28 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition disabled:bg-gray-100"
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
                                                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                                  >
                                                    Completar
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setCantidadRecibida(r.id, it.id, 0)
                                                    }
                                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                  >
                                                    Cero
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
                                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  Limpiar capturas
                                </button>
                                <button
                                  onClick={() => handleRegistrarEntrada(r)}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Registrar entrada
                                </button>
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
                      <p className="text-gray-600">
                        {searchTerm
                          ? "Ajusta tu búsqueda"
                          : "No hay requisiciones pendientes de recepción"}
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

      {/* Modal Historial */}
      {histModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setHistModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
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
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar"
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
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                            Fecha
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                            RCP
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                            Almacén
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                            Producto
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                            Cantidad
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {historial
                          .slice()
                          .sort(
                            (a, b) =>
                              new Date(b.fecha).getTime() -
                              new Date(a.fecha).getTime()
                          )
                          .map((h) => (
                            <tr key={h.id} className="hover:bg-gray-50">
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
                              <td className="px-4 py-2 text-sm text-gray-700">
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
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
