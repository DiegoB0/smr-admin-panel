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

// ========== CONFIG ==========
const PERSISTIR_EN_STORAGE = false; // pon true si quieres que persista entre recargas

// ========== MOCKS BASE ==========
const MOCK_REQUIS_BASE = [
  {
    id: 1,
    rcp: 1001,
    titulo: "Material eléctrico nave A",
    fechaSolicitud: "2025-09-01T00:00:00Z",
    items: [
      {
        id: 11,
        producto: { id: 100, name: "Cable THHN 12 AWG" },
        cantidadSolicitada: 200,
        cantidadRecibidaAcumulada: 0,
      },
      {
        id: 12,
        producto: { id: 101, name: "Tubing EMT 3/4" },
        cantidadSolicitada: 120,
        cantidadRecibidaAcumulada: 50,
      },
    ],
  },
  {
    id: 2,
    rcp: 1002,
    titulo: "Ferretería obra sur",
    fechaSolicitud: "2025-08-20T00:00:00Z",
    items: [
      {
        id: 21,
        producto: { id: 200, name: 'Tornillo 1/4" x 2"' },
        cantidadSolicitada: 500,
        cantidadRecibidaAcumulada: 500,
      },
      {
        id: 22,
        producto: { id: 201, name: 'Taquetes 1/4"' },
        cantidadSolicitada: 300,
        cantidadRecibidaAcumulada: 200,
      },
    ],
  },
  {
    id: 3,
    rcp: 1003,
    titulo: "Pinturas fachada",
    fechaSolicitud: "2025-09-10T00:00:00Z",
    items: [
      {
        id: 31,
        producto: { id: 300, name: "Pintura exterior 19L blanco" },
        cantidadSolicitada: 12,
        cantidadRecibidaAcumulada: 0,
      },
    ],
  },
];

// ========== STORAGE KEYS ==========
const STORAGE_KEY_REQ = "mock_requis_entradas";
const STORAGE_KEY_HIST = "mock_hist_entradas";

// ========== HELPERS STORAGE ==========
const resetMocks = () => {
  if (PERSISTIR_EN_STORAGE) {
    localStorage.setItem(STORAGE_KEY_REQ, JSON.stringify(MOCK_REQUIS_BASE));
    localStorage.setItem(STORAGE_KEY_HIST, JSON.stringify([]));
  }
};

const loadRequis = () => {
  if (!PERSISTIR_EN_STORAGE) {
    // No persistimos: siempre partimos del base en memoria
    return JSON.parse(JSON.stringify(MOCK_REQUIS_BASE));
  }
  let data = JSON.parse(localStorage.getItem(STORAGE_KEY_REQ) || "null");
  if (!data) {
    data = MOCK_REQUIS_BASE;
    localStorage.setItem(STORAGE_KEY_REQ, JSON.stringify(data));
  }
  return data;
};

const saveRequis = (data) => {
  if (PERSISTIR_EN_STORAGE) {
    localStorage.setItem(STORAGE_KEY_REQ, JSON.stringify(data));
  }
};

const loadHist = () => {
  if (!PERSISTIR_EN_STORAGE) return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEY_HIST) || "[]");
};

const saveHist = (hist) => {
  if (PERSISTIR_EN_STORAGE) {
    localStorage.setItem(STORAGE_KEY_HIST, JSON.stringify(hist));
  }
};

// ========== SERVICIOS MOCK ==========
const mockListRequis = async ({
  page,
  limit,
  search,
  order,
  statusFilter,
  sourceData,
}) => {
  await new Promise((r) => setTimeout(r, 150));

  // Usa sourceData (estado de la página) como "DB" cuando no persistimos
  let data = sourceData ? JSON.parse(JSON.stringify(sourceData)) : loadRequis();

  // search simple
  const s = (search || "").toLowerCase().trim();
  if (s) {
    data = data.filter((r) => {
      const rcpStr = String(r.rcp || "");
      return rcpStr.includes(s) || (r.titulo || "").toLowerCase().includes(s);
    });
  }

  // calcular status y totales
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

  data = data.map((r) => {
    const items = r.items || [];
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
        Number(it.cantidadRecibidaAcumulada) >=
          Number(it.cantidadSolicitada)
    ).length;
    return {
      ...r,
      _statusLocal: calcStatus(r.items),
      _totales: {
        itemsCompletos: completos,
        itemsTotales: items.length,
        piezasRecibidas: totalRec,
        piezasSolicitadas: totalSolic,
      },
    };
  });

  if (statusFilter && statusFilter !== "ALL") {
    data = data.filter((r) => r._statusLocal === statusFilter);
  }

  data = [...data].sort((a, b) => {
    const da = new Date(a.fechaSolicitud).getTime();
    const db = new Date(b.fechaSolicitud).getTime();
    return order === "ASC" ? da - db : db - da;
  });

  // paginación
  const totalItems = data.length;
  const totalPages = limit ? Math.max(1, Math.ceil(totalItems / limit)) : 1;
  const currentPage = limit ? Math.min(page, totalPages) : 1;
  const start = limit ? (currentPage - 1) * limit : 0;
  const end = limit ? start + limit : undefined;
  const slice = limit ? data.slice(start, end) : data;

  return {
    data: {
      data: slice,
      meta: {
        currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        totalItems,
      },
      // Para el modo no persistente devolvemos el dataset completo actualizado
      full: data,
    },
  };
};

const mockRegistrarEntrada = async ({
  requisicionId,
  items,
  sourceData,
  setSourceData,
  addToLocalHist,
}) => {
  await new Promise((r) => setTimeout(r, 120));

  // Modo no persistente: actualiza el estado local (sourceData)
  if (!PERSISTIR_EN_STORAGE) {
    const data = JSON.parse(JSON.stringify(sourceData));
    const idx = data.findIndex((r) => r.id === requisicionId);
    if (idx === -1) throw new Error("Requisición no encontrada");

    const req = data[idx];
    const map = new Map((req.items || []).map((i) => [i.id, { ...i }]));
    const now = new Date().toISOString();

    for (const e of items) {
      const it = map.get(e.itemId);
      if (!it) continue;
      const solic = Number(it.cantidadSolicitada) || 0;
      const recAcum = Number(it.cantidadRecibidaAcumulada) || 0;
      const plus = Number(e.cantidadRecibida) || 0;
      const nuevo = Math.min(recAcum + plus, solic);
      const delta = Math.max(0, nuevo - recAcum);
      if (delta > 0) {
        // En modo no persistente, solo mantenemos historial en memoria (state)
        addToLocalHist({
          id: `${requisicionId}-${e.itemId}-${now}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          requisicionId,
          itemId: e.itemId,
          rcp: req.rcp,
          titulo: req.titulo,
          productoName: it.producto?.name || "Producto",
          cantidadRecibida: delta,
          fecha: now,
        });
      }
      it.cantidadRecibidaAcumulada = nuevo;
      map.set(e.itemId, it);
    }

    data[idx] = { ...req, items: [...map.values()] };
    setSourceData(data);
    return { data: { ok: true } };
  }

  // Modo persistente: actualiza localStorage
  const data = loadRequis();
  const idx = data.findIndex((r) => r.id === requisicionId);
  if (idx === -1) throw new Error("Requisición no encontrada");

  const req = data[idx];
  const map = new Map((req.items || []).map((i) => [i.id, { ...i }]));
  const now = new Date().toISOString();
  const hist = loadHist();

  for (const e of items) {
    const it = map.get(e.itemId);
    if (!it) continue;
    const solic = Number(it.cantidadSolicitada) || 0;
    const recAcum = Number(it.cantidadRecibidaAcumulada) || 0;
    const plus = Number(e.cantidadRecibida) || 0;
    const nuevo = Math.min(recAcum + plus, solic);
    const delta = Math.max(0, nuevo - recAcum);
    if (delta > 0) {
      hist.push({
        id: `${requisicionId}-${e.itemId}-${now}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        requisicionId,
        itemId: e.itemId,
        rcp: req.rcp,
        titulo: req.titulo,
        productoName: it.producto?.name || "Producto",
        cantidadRecibida: delta,
        fecha: now,
      });
    }
    it.cantidadRecibidaAcumulada = nuevo;
    map.set(e.itemId, it);
  }

  data[idx] = { ...req, items: [...map.values()] };
  saveRequis(data);
  saveHist(hist);

  return { data: { ok: true } };
};

// ========== PAGE ==========
const EntradasPage = () => {
  // "DB" en memoria cuando no persistimos
  const [dbInMemory, setDbInMemory] = useState([]);
  const [histLocal, setHistLocal] = useState([]); // historial en memoria

  const [requis, setRequis] = useState([]);
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

  const limit =
    limitOption === "all" ? pagination.totalItems || 0 : parseInt(limitOption, 10);

  // Init datos al montar
  useEffect(() => {
    if (PERSISTIR_EN_STORAGE) {
      // Si persiste: si no hay datos, inicializa; si hay, respétalos
      const existing = localStorage.getItem(STORAGE_KEY_REQ);
      if (!existing) resetMocks();
      setDbInMemory(loadRequis()); // también guardamos una copia para consultas
      setHistorial(loadHist());
    } else {
      // No persistimos: siempre reiniciamos base y vaciamos historial
      setDbInMemory(JSON.parse(JSON.stringify(MOCK_REQUIS_BASE)));
      setHistorial([]); // historial arranca vacío cada reload
    }
  }, []);

  const fetchData = () => {
    setLoading(true);
    mockListRequis({
      page,
      limit: limitOption === "all" ? undefined : limit,
      search: debouncedSearch,
      order: "DESC",
      statusFilter,
      sourceData: dbInMemory, // importante para modo no persistente
    })
      .then((res) => {
        setRequis(res.data.data);
        setPagination(res.data.meta);
        if (!PERSISTIR_EN_STORAGE && res.data.full) {
          // mantener full ordenado/filtrado en memoria si hace falta
          // (no es estrictamente necesario para este UI)
        }
      })
      .catch((err) => {
        const msg = err?.message || "Error al cargar requisiciones (mock)";
        Swal.fire("Error", msg, "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (dbInMemory.length === 0 && !PERSISTIR_EN_STORAGE) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limitOption, debouncedSearch, statusFilter, dbInMemory]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limitOption, statusFilter]);

  useEffect(() => {
    // cargar historial para el modal
    if (PERSISTIR_EN_STORAGE) setHistorial(loadHist());
    else setHistorial(histLocal);
  }, [histModalOpen, histLocal]);

  const addToLocalHist = (entry) => {
    if (PERSISTIR_EN_STORAGE) {
      // ya lo maneja mockRegistrarEntrada cuando persiste
      return;
    }
    setHistLocal((prev) => [entry, ...prev]);
  };

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

    // validaciones
    const itemsById = new Map((requisicion.items || []).map((i) => [i.id, i]));
    const errores = [];
    for (const e of entradas) {
      const it = itemsById.get(e.itemId);
      if (!it) continue;
      const solic = Number(it.cantidadSolicitada) || 0;
      const recAcum = Number(it.cantidadRecibidaAcumulada) || 0;
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
      await mockRegistrarEntrada({
        requisicionId: requisicion.id,
        items: entradas,
        sourceData: dbInMemory,
        setSourceData: setDbInMemory,
        addToLocalHist,
      });
      Swal.fire("Éxito", "Entrada registrada (mock)", "success");
      limpiarCaptura(requisicion.id);
      // refresh tabla
      fetchData();
    } catch (err) {
      const msg = err?.message || "Error al registrar (mock)";
      Swal.fire("Error", msg, "error");
    }
  };

  // Stats globales sobre los datos paginados actuales
  const { completas, parciales, pendientes, totPzasSol, totPzasRec } =
    useMemo(() => {
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
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha Solicitud
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
                            {r.rcp ?? "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {r.titulo ?? "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {r.fechaSolicitud
                              ? new Date(r.fechaSolicitud).toLocaleDateString()
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
                                      const solic = Number(it.cantidadSolicitada) || 0;
                                      const recAcum =
                                        Number(it.cantidadRecibidaAcumulada) || 0;
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
                          : "No hay requisiciones pendientes de recepción (mock)"}
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
                    {PERSISTIR_EN_STORAGE
                      ? "Registros guardados en navegador (persistente)"
                      : "Registros de esta sesión (se reinicia al recargar)"}
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
                            Requisición
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
                        text: PERSISTIR_EN_STORAGE
                          ? "Eliminará los registros del navegador."
                          : "Eliminará los registros de esta sesión.",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Sí, borrar",
                        cancelButtonText: "Cancelar",
                      }).then((res) => {
                        if (res.isConfirmed) {
                          if (PERSISTIR_EN_STORAGE) {
                            saveHist([]);
                            setHistorial([]);
                          } else {
                            setHistLocal([]);
                            setHistorial([]);
                          }
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
