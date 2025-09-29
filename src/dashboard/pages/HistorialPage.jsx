"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  History,
  Search,
  FileText,
  Download,
  ListChecks,
  Package,
  RefreshCw,
} from "lucide-react";
import { useDebounce } from "../../hooks/customHooks";

// ========== MOCK DATA GENERATOR ==========
function genMockEntradas() {
  const now = new Date();
  // eventos por ítem (como tu historial de entradas)
  return [
    {
      id: "e1",
      fecha: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      requisicionId: 1,
      itemId: 11,
      rcp: 1001,
      titulo: "Material eléctrico nave A",
      productoName: "Cable THHN 12 AWG",
      cantidadRecibida: 120,
    },
    {
      id: "e2",
      fecha: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      requisicionId: 1,
      itemId: 12,
      rcp: 1001,
      titulo: "Material eléctrico nave A",
      productoName: "Tubing EMT 3/4",
      cantidadRecibida: 50,
    },
    {
      id: "e3",
      fecha: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      requisicionId: 2,
      itemId: 21,
      rcp: 1002,
      titulo: "Ferretería obra sur",
      productoName: 'Tornillo 1/4" x 2"',
      cantidadRecibida: 500,
    },
  ];
}

function genMockSalidas() {
  const today = new Date().toISOString().slice(0, 10);
  return [
    {
      id: "s1",
      folio: 2101,
      fecha: today,
      proyecto: "LOGMINE - Módulo A",
      obra: "Nave A",
      maquina: "Excavadora CAT-330",
      entrega: "Juan Pérez",
      recibe: "Carlos Ruiz",
      items: [
        {
          id: "si1",
          cantidad: 10,
          noParte: "P-AX-001",
          descripcion: "Punta de cincel 1\"",
        },
        {
          id: "si2",
          cantidad: 2,
          noParte: "",
          descripcion: "Aceite hidráulico 19L",
        },
      ],
    },
    {
      id: "s2",
      folio: 2102,
      fecha: today,
      proyecto: "Reparación Planta Sur",
      obra: "Obra Sur",
      maquina: "Compresor SULLAIR",
      entrega: "María López",
      recibe: "Luis Gómez",
      items: [
        { id: "si3", cantidad: 6, noParte: "BR-778", descripcion: "Bandas" },
      ],
    },
  ];
}

// ========== PAGE ==========
const HistorialPage = () => {
  // fuente mock interna
  const [mockEntradas, setMockEntradas] = useState([]);
  const [mockSalidas, setMockSalidas] = useState([]);

  // UI
  const [tab, setTab] = useState("entradas"); // entradas | salidas
  const [searchTerm, setSearchTerm] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mostrarPorDocumento, setMostrarPorDocumento] = useState(true); // salidas
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("10");

  const debouncedSearch = useDebounce(searchTerm, 400);

  // cargar mocks en cada reload
  useEffect(() => {
    setMockEntradas(genMockEntradas());
    setMockSalidas(genMockSalidas());
  }, []);

  const resetMocks = () => {
    setMockEntradas(genMockEntradas());
    setMockSalidas(genMockSalidas());
    setPage(1);
  };

  // normalización
  const eventosEntradas = useMemo(() => {
    return (mockEntradas || []).map((x) => ({
      tipo: "Entrada",
      fecha: x.fecha,
      folio: x.rcp ? `RCP ${x.rcp}` : "",
      proyecto: x.titulo || "",
      obra: "-",
      maquina: "-",
      personaEntrega: "-",
      personaRecibe: "-",
      producto: x.productoName,
      cantidad: x.cantidadRecibida,
    }));
  }, [mockEntradas]);

  const eventosSalidas = useMemo(() => {
    if (mostrarPorDocumento) {
      return (mockSalidas || []).map((s) => ({
        tipo: "Salida",
        fecha: s.fecha,
        folio: `Folio ${s.folio}`,
        proyecto: s.proyecto,
        obra: s.obra,
        maquina: s.maquina,
        personaEntrega: s.entrega,
        personaRecibe: s.recibe,
        producto: `${(s.items || []).length} items`,
        cantidad: (s.items || []).reduce(
          (acc, it) => acc + (Number(it.cantidad) || 0),
          0
        ),
      }));
    }
    const rows = [];
    for (const s of mockSalidas || []) {
      for (const it of s.items || []) {
        rows.push({
          tipo: "Salida",
          fecha: s.fecha,
          folio: `Folio ${s.folio}`,
          proyecto: s.proyecto,
          obra: s.obra,
          maquina: s.maquina,
          personaEntrega: s.entrega,
          personaRecibe: s.recibe,
          producto: it.descripcion + (it.noParte ? ` (${it.noParte})` : ""),
          cantidad: Number(it.cantidad) || 0,
        });
      }
    }
    return rows;
  }, [mockSalidas, mostrarPorDocumento]);

  const source = tab === "entradas" ? eventosEntradas : eventosSalidas;

  // filtros
  const filtered = useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    const fromTs = from ? new Date(from).setHours(0, 0, 0, 0) : null;
    const toTs = to ? new Date(to).setHours(23, 59, 59, 999) : null;

    return (source || []).filter((r) => {
      const ts = r.fecha ? new Date(r.fecha).getTime() : 0;
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      if (!s) return true;
      const txt = [
        r.tipo,
        r.folio,
        r.proyecto,
        r.obra,
        r.maquina,
        r.personaEntrega,
        r.personaRecibe,
        r.producto,
      ]
        .join(" ")
        .toLowerCase();
      return txt.includes(s);
    });
  }, [source, debouncedSearch, from, to]);

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ),
    [filtered]
  );

  // paginación
  const limit =
    limitOption === "all" ? sorted.length || 0 : parseInt(limitOption, 10);
  const totalItems = sorted.length;
  const totalPages =
    limitOption === "all" ? 1 : Math.max(1, Math.ceil(totalItems / limit));
  const currentPage =
    limitOption === "all" ? 1 : Math.min(page, totalPages);
  const start = limitOption === "all" ? 0 : (currentPage - 1) * limit;
  const end = limitOption === "all" ? undefined : start + limit;
  const pageData = sorted.slice(start, end);

  useEffect(() => setPage(1), [debouncedSearch, from, to, limitOption, tab, mostrarPorDocumento]);

  const exportCSV = () => {
    const rows = [
      [
        "Tipo",
        "Fecha",
        "Folio/RCP",
        "Proyecto",
        "Obra",
        "Máquina",
        "Entrega",
        "Recibe",
        "Producto",
        "Cantidad",
      ],
      ...sorted.map((r) => [
        r.tipo,
        new Date(r.fecha).toLocaleString(),
        r.folio,
        r.proyecto,
        r.obra,
        r.maquina,
        r.personaEntrega,
        r.personaRecibe,
        r.producto,
        String(r.cantidad ?? ""),
      ]),
    ];
    const csv =
      "data:text/csv;charset=utf-8," +
      rows.map((row) => row.map(escapeCSV).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = `historial_${tab}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historial</h1>
            <p className="text-sm text-gray-600">Entradas y salidas (mock)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tab === "salidas" && (
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 mr-2">
              <input
                type="checkbox"
                checked={mostrarPorDocumento}
                onChange={(e) => setMostrarPorDocumento(e.target.checked)}
              />
              Mostrar por documento
            </label>
          )}
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={resetMocks}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            title="Reiniciar datos mock"
          >
            <RefreshCw className="w-4 h-4" />
            Reset mocks
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg border ${
            tab === "entradas"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300"
          }`}
          onClick={() => setTab("entradas")}
        >
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            Entradas
          </div>
        </button>
        <button
          className={`px-4 py-2 rounded-lg border ${
            tab === "salidas"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300"
          }`}
          onClick={() => setTab("salidas")}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Salidas
          </div>
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={
              tab === "entradas"
                ? "Buscar por RCP, título, producto..."
                : "Buscar por folio, proyecto, obra, máquina, producto..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <select
            value={limitOption}
            onChange={(e) => setLimitOption(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="10">10 por página</option>
            <option value="20">20 por página</option>
            <option value="50">50 por página</option>
            <option value="all">Todos</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Folio / RCP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Proyecto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Obra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Máquina
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Producto / Resumen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cantidad
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pageData.length > 0 ? (
                pageData.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {r.tipo}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {r.fecha ? new Date(r.fecha).toLocaleString() : "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {r.folio || "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {r.proyecto || "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {r.obra || "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {r.maquina || "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {r.producto || "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {r.cantidad ?? "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sin registros
                    </h3>
                    <p className="text-gray-600">
                      No hay movimientos que coincidan con los filtros.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 hover:bg-gray-800 transition-colors"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 hover:bg-gray-800 transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

function escapeCSV(value) {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default HistorialPage;
