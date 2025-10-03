"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  CircleAlert,
  CircleX,
  History,
} from "lucide-react";
import Swal from "sweetalert2";
import { useDebounce } from "../../hooks/customHooks";
import { useEntradas } from "../../hooks/useEntradas";

// ========== PAGE ==========
const EntradasPage = () => {
  // Historial en memoria (ya que no hay endpoint para historial)
  const [histLocal, setHistLocal] = useState([]); // historial en memoria

  const [entradas, setEntradas] = useState([]);
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

  const [openRows, setOpenRows] = useState({});
  const [capture, setCapture] = useState({});

  // Historial modal
  const [histModalOpen, setHistModalOpen] = useState(false);
  const [historial, setHistorial] = useState([]);

  const { listEntradas, registrarEntrada } = useEntradas();

  const limit = limitOption === "all" ? pagination.totalItems || 0 : parseInt(limitOption, 10);

  const fetchData = () => {
    setLoading(true);
    listEntradas({
      page,
      limit: limitOption === "all" ? undefined : limit,
      search: debouncedSearch,
      order: "DESC",
    })
      .then((res) => {
        const data = res.data.data.map((e) => ({
          ...e,
          // Adaptaciones: no hay título, usamos un placeholder basado en requisición
          titulo: `Entrada para RCP ${e.requisicion?.rcp || e.requisicion?.id || "N/A"}`,
          fechaSolicitud: e.fechaCreacion, // Mapeo de fecha
          items: e.items.map((it) => ({
            ...it,
            cantidadSolicitada: it.cantidadEsperada, // Mapeo
            cantidadRecibidaAcumulada: it.cantidadRecibida, // Mapeo
          })),
        }));

        // Calcular status y totales (como en mocks)
        const calcStatus = (items) => {
          if (!items || items.length === 0) return "Pendiente";
          let completos = 0;
          let conEntrada = 0;
          for (const it of items) {
            const solic = Number(it.cantidadSolicitada) || 0;
            const rec = Number(it.cantidadRecibidaAcumulada) || 0;
            if (solic > 0 && rec >= solic) completos++;
            if (rec > 0) conEntrada++;
          }
          if (completos === items.length) return "Completa";
          if (conEntrada > 0) return "Parcial";
          return "Pendiente";
        };

        let filteredData = data.map((e) => {
          const items = e.items || [];
          const totalSolic = items.reduce(
            (a, it) => a + (Number(it.cantidadSolicitada) || 0),
            0
          );
          const totalRec = items.reduce(
            (a, it) => a + (Number(it.cantidadRecibidaAcumulada) || 0),
            0
          );
          const completos = items.filter(
            (it) =>
              Number(it.cantidadSolicitada) > 0 &&
              Number(it.cantidadRecibidaAcumulada) >= Number(it.cantidadSolicitada)
          ).length;
          return {
            ...e,
            _statusLocal: calcStatus(e.items),
            _totales: {
              itemsCompletos: completos,
              itemsTotales: items.length,
              piezasRecibidas: totalRec,
              piezasSolicitadas: totalSolic,
            },
          };
        });

        if (statusFilter && statusFilter !== "ALL") {
          filteredData = filteredData.filter((e) => e._statusLocal === statusFilter);
        }

        setEntradas(filteredData);
        setPagination(res.data.meta); // Usamos los metadatos de paginación del backend
      })
      .catch((err) => {
        const msg = err?.message || "Error al cargar entradas";
        Swal.fire("Error", msg, "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limitOption, debouncedSearch, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limitOption, statusFilter]);

  useEffect(() => {
    // Cargar historial para el modal (de state local)
    setHistorial(histLocal);
  }, [histModalOpen, histLocal]);

  const addToLocalHist = (entry) => {
    setHistLocal((prev) => [entry, ...prev]);
  };

  const toggleRow = (id) =>
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const setCantidadRecibida = (entradaId, itemId, value) => {
    const valNum = value === "" ? "" : Number(value);
    setCapture((prev) => ({
      ...prev,
      [entradaId]: {
        ...(prev[entradaId] || {}),
        [itemId]: valNum,
      },
    }));
  };

  const limpiarCaptura = (entradaId) =>
    setCapture((prev) => ({ ...prev, [entradaId]: {} }));

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

  const handleRegistrarEntrada = async (entrada) => {
    const entradasItems = Object.entries(capture[entrada.id] || {})
      .filter(([, val]) => val !== "" && !Number.isNaN(Number(val)))
      .map(([itemId, val]) => ({
        itemId: Number(itemId),
        cantidadRecibida: Number(val),
      }));

    if (entradasItems.length === 0) {
      Swal.fire("Atención", "No hay cantidades a registrar", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "¿Registrar entrada?",
      text: `Se registrarán ${entradasItems.length} items`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, registrar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      await registrarEntrada(entrada.id, { items: entradasItems });
      Swal.fire("Éxito", "Entrada registrada", "success");

      // Agregar a historial local (simulando, ya que no hay endpoint)
      const now = new Date().toISOString();
      entradasItems.forEach((e) => {
        const item = entrada.items.find((it) => it.id === e.itemId);
        if (item && e.cantidadRecibida > 0) {
          addToLocalHist({
            id: `${entrada.id}-${e.itemId}-${now}-${Math.random().toString(36).slice(2, 7)}`,
            entradaId: entrada.id,
            itemId: e.itemId,
            rcp: entrada.requisicion?.rcp,
            titulo: entrada.titulo,
            productoName: item.producto?.name || "Producto",
            cantidadRecibida: e.cantidadRecibida,
            fecha: now,
          });
        }
      });

      limpiarCaptura(entrada.id);
      fetchData();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Error al registrar entrada";
      Swal.fire("Error", Array.isArray(msg) ? msg.join(", ") : msg, "error");
    }
  };

  // Calcular estadísticas
  const getStats = () => {
    const totalEntradas = entradas.length;
    const completas = entradas.filter((e) => e._statusLocal === "Completa").length;
    const parciales = entradas.filter((e) => e._statusLocal === "Parcial").length;
    const pendientes = entradas.filter((e) => e._statusLocal === "Pendiente").length;
    const totalPiezasSolicitadas = entradas.reduce((sum, e) => sum + e._totales.piezasSolicitadas, 0);
    const totalPiezasRecibidas = entradas.reduce((sum, e) => sum + e._totales.piezasRecibidas, 0);

    return { totalEntradas, completas, parciales, pendientes, totalPiezasSolicitadas, totalPiezasRecibidas };
  };

  const stats = getStats();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Entradas</h1>
          <p className="text-gray-600 mt-1">Registra entradas de requisiciones</p>
        </div>
        <button
          onClick={() => setHistModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <History className="w-5 h-5 mr-2" />
          Ver historial
        </button>
      </div>

      {/* Estadísticas */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600">Total Entradas</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalEntradas}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600">Completas</h3>
          <p className="text-2xl font-bold text-green-600">{stats.completas}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600">Parciales</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.parciales}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600">Pendientes</h3>
          <p className="text-2xl font-bold text-red-600">{stats.pendientes}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 col-span-1 sm:col-span-2 lg:col-span-2">
          <h3 className="text-sm font-medium text-gray-600">Piezas Solicitadas</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalPiezasSolicitadas}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 col-span-1 sm:col-span-2 lg:col-span-2">
          <h3 className="text-sm font-medium text-gray-600">Piezas Recibidas</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalPiezasRecibidas}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por RCP..."
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
          <option value="Pendiente">Pendientes</option>
          <option value="Parcial">Parciales</option>
          <option value="Completa">Completas</option>
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

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando entradas...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                    RCP
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                    Título
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                    Fecha Solicitud
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                    Items completos
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                    Piezas recibidas
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entradas.length > 0 ? (
                  entradas.map((entrada) => {
                    const isOpen = !!openRows[entrada.id];
                    const captureForRow = capture[entrada.id] || {};
                    return (
                      <React.Fragment key={entrada.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {entrada.requisicion?.rcp || "N/A"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {entrada.titulo}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {new Date(entrada.fechaSolicitud).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            <StatusBadge status={entrada._statusLocal} />
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {entrada._totales.itemsCompletos} / {entrada._totales.itemsTotales}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {entrada._totales.piezasRecibidas} / {entrada._totales.piezasSolicitadas}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            <button
                              onClick={() => toggleRow(entrada.id)}
                              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              {isOpen ? (
                                <ChevronDown className="w-4 h-4 mr-1" />
                              ) : (
                                <ChevronRight className="w-4 h-4 mr-1" />
                              )}
                              {isOpen ? "Cerrar" : "Abrir"}
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={7} className="p-0">
                              <div className="px-4 py-4 bg-gray-50">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Producto
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Solicitado
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Recibido
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Pendiente
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Registrar
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {entrada.items.map((it) => {
                                      const solic = Number(it.cantidadSolicitada) || 0;
                                      const recAcum = Number(it.cantidadRecibidaAcumulada) || 0;
                                      const restante = Math.max(0, solic - recAcum);
                                      const completo = solic > 0 && recAcum >= solic;
                                      const curCapture = capture[entrada.id]?.[it.id] ?? "";
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
                                                  setCantidadRecibida(entrada.id, it.id, e.target.value)
                                                }
                                                className="w-28 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition disabled:bg-gray-100"
                                              />
                                              {!completo ? (
                                                <>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setCantidadRecibida(entrada.id, it.id, restante)
                                                    }
                                                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                                  >
                                                    Completar
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setCantidadRecibida(entrada.id, it.id, 0)
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
                                  onClick={() => limpiarCaptura(entrada.id)}
                                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  Limpiar capturas
                                </button>
                                <button
                                  onClick={() => handleRegistrarEntrada(entrada)}
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
                        No se encontraron entradas
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm
                          ? "Ajusta tu búsqueda"
                          : "No hay entradas pendientes de recepción"}
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
                    Registros de esta sesión (se reinicia al recargar)
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
                            Título
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
                                {h.titulo}
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
                          setHistLocal([]);
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