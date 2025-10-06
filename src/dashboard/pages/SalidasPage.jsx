"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Eye,
  Printer,
  Download,
  Package,
  Box,
} from "lucide-react";
import Swal from "sweetalert2";
import { useDebounce } from "../../hooks/customHooks";
import { useSalidas } from "../../hooks/useSalidas";

// Helper: formatea mensajes de error para Swal
function getApiErrorMessage(err) {
  const d = err?.response?.data;
  if (!d) return err?.message || "Error inesperado";
  if (typeof d === "string") return d;
  if (typeof d.message === "string") return d.message;
  if (Array.isArray(d.message)) return d.message.join("\n");
  try {
    return JSON.stringify(d);
  } catch {
    return String(d);
  }
}

// Helper: validación rápida de UUID v4 (relajada)
const isUUID = (v) =>
  typeof v === "string" &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    v
  );

const SalidasPage = () => {
  const { listSalidas, crearSalida } = useSalidas();

  // Listado
  const [salidas, setSalidas] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(false);

  // Filtros / paginado
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("10");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Almacén (contexto)
  const [almacenId, setAlmacenId] = useState(5);

  // Catálogos vistos
  const [seen, setSeen] = useState({
    almacenes: [],
    usuarios: [],
    productos: [],
  });

  // Crear salida
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    almacenOrigenId: 5,
    recibidaPorId: "",
    autorizaId: "",
    equipoId: "",
    items: [{ productoId: "", cantidad: "" }],
  });

  const limit =
    limitOption === "all" ? pagination.totalItems || 0 : parseInt(limitOption, 10);

  // Detalles / impresión
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const printableRef = useRef(null);

  // Indexa lo visto
  function indexSeen(rows) {
    const aMap = new Map();
    const uMap = new Map();
    const pMap = new Map();
    for (const s of rows) {
      if (s?.almacenOrigen?.id)
        aMap.set(s.almacenOrigen.id, s.almacenOrigen.name);
      if (s?.recibidaPor?.id) uMap.set(s.recibidaPor.id, s.recibidaPor.name);
      if (s?.authoriza?.id) uMap.set(s.authoriza.id, s.authoriza.name);
      for (const it of s.items || []) {
        if (it?.producto?.id) pMap.set(it.producto.id, it.producto.name);
      }
    }
    setSeen({
      almacenes: Array.from(aMap, ([id, name]) => ({ id, name })),
      usuarios: Array.from(uMap, ([id, name]) => ({ id, name })),
      productos: Array.from(pMap, ([id, name]) => ({ id, name })),
    });
  }

  async function fetchData() {
    setLoading(true);
    try {
      const { data } = await listSalidas({
        almacenId,
        page,
        limit: limitOption === "all" ? undefined : limit,
        search: debouncedSearch,
        order: "DESC",
      });

      const rows = Array.isArray(data?.data) ? data.data : [];
      const meta = data?.meta || {
        currentPage: page,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        totalItems: rows.length,
      };

      setSalidas(rows);
      setPagination({
        currentPage: meta.currentPage ?? page,
        totalPages: meta.totalPages ?? 1,
        hasNextPage: !!meta.hasNextPage,
        hasPreviousPage: !!meta.hasPreviousPage,
        totalItems: meta.totalItems ?? rows.length,
      });

      indexSeen(rows);
    } catch (err) {
      Swal.fire("Error", getApiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limitOption, debouncedSearch, almacenId]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limitOption, almacenId]);

  useEffect(() => {
    setForm((p) => ({ ...p, almacenOrigenId: almacenId }));
  }, [almacenId]);

  // Helpers form
  const addItem = () =>
    setForm((p) => ({
      ...p,
      items: [...p.items, { productoId: "", cantidad: "" }],
    }));

  const removeItem = (i) =>
    setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const updateItem = (i, field, value) =>
    setForm((p) => {
      const items = [...p.items];
      items[i] = { ...items[i], [field]: value };
      return { ...p, items };
    });

  const validateForm = () => {
    if (!form.almacenOrigenId) return "Selecciona el almacén de origen";
    if (!form.recibidaPorId) return "Selecciona a quién recibe";
    if (!form.autorizaId) return "Selecciona quién autoriza";
    if (!isUUID(form.recibidaPorId)) return "El campo 'Recibe' debe ser UUID válido";
    if (!isUUID(form.autorizaId)) return "El campo 'Autoriza' debe ser UUID válido";
    if (!form.equipoId || Number(form.equipoId) <= 0)
      return "Selecciona el equipo/máquina (número)";
    if (!Array.isArray(form.items) || form.items.length === 0)
      return "Agrega al menos un renglón";
    const bad = form.items.find((it) => {
      const c = Number(it.cantidad);
      return !it.productoId || Number.isNaN(c) || c <= 0;
    });
    if (bad) return "Cada ítem requiere producto y cantidad (> 0)";
    return null;
  };

  const onCreate = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) return Swal.fire("Validación", err, "warning");

    try {
      setLoading(true);
      const body = {
        almacenOrigenId: Number(form.almacenOrigenId),
        recibidaPorId: String(form.recibidaPorId),
        authorizaId: String(form.autorizaId), // clave con h
        equipoId: Number(form.equipoId),
        items: form.items.map((it) => ({
          productoId: String(it.productoId),
          cantidad: Number(it.cantidad),
        })),
      };

      await crearSalida(body);

      Swal.fire("Éxito", "Salida registrada", "success");
      setIsCreateModalOpen(false);
      setForm({
        almacenOrigenId: almacenId,
        recibidaPorId: "",
        autorizaId: "",
        equipoId: "",
        items: [{ productoId: "", cantidad: "" }],
      });
      fetchData();
    } catch (e2) {
      Swal.fire("Error", getApiErrorMessage(e2), "error");
    } finally {
      setLoading(false);
    }
  };

  // Totales display
  const { totalItems, totalPzas } = useMemo(() => {
    let items = 0;
    let pzas = 0;
    for (const s of salidas) {
      const arr = s.items || [];
      items += arr.length;
      pzas += arr.reduce(
        (a, it) => a + Number(it.cantidadRetirada || it.cantidad || 0),
        0
      );
    }
    return { totalItems: items, totalPzas: pzas };
  }, [salidas]);

  // Print / Download
  const openDetail = (s) => {
    setSelected(s);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setSelected(null);
    setIsDetailOpen(false);
  };

  const handlePrint = () => {
    if (!printableRef.current) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    const html = printableRef.current.innerHTML;
    win.document.write(`
      <html>
        <head>
          <title>Vale de salida</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
            .sheet { border: 1px solid #ddd; padding: 12px; }
            .grid { display: grid; gap: 8px; }
            .row { display:flex; gap: 12px; }
            .label { font-size: 12px; color: #555; }
            .value { font-size: 14px; border-bottom: 1px solid #ccc; padding: 2px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
            th, td { border: 1px solid #bbb; padding: 6px 8px; }
            th { background: #f5f5f5; text-transform: uppercase; font-weight: 600; font-size: 11px; }
            .footer { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 24px; text-align: center; }
            .sign { border-top: 1px solid #333; padding-top: 6px; font-size: 12px; }
            .header { display:flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
            .folio { font-size: 18px; font-weight: bold; color: #c00; }
            .title { font-size: 18px; font-weight: 800; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          ${html}
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleDownload = () => {
    handlePrint();
  };

  // helper para mostrar folio legible
  const displayFolio = (s) => {
    if (!s) return "";
    if (s.folio) return String(s.folio).padStart(5, "0");
    if (s.folioNumero) return String(s.folioNumero).padStart(5, "0");
    if (s.id) return String(s.id).slice(0, 8).toUpperCase();
    if (s.createdAt) return new Date(s.createdAt).getTime();
    return "—";
  };

  // Data para tabla paginada localmente cuando limitOption !== "all"
  const visibleRows =
    limitOption === "all"
      ? salidas
      : salidas.slice(
          (pagination.currentPage - 1) * limit,
          (pagination.currentPage - 1) * limit + limit
        );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto font-inter">
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

      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Ítems</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Pzas Retiradas</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalPzas}</p>
              </div>
              <Box className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          {/* Puedes agregar más tarjetas si tienes más datos */}
        </div>
      </div>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salidas</h1>
          <p className="text-gray-600 mt-1">Registra y emite vales de salida desde almacén</p>
        </div>
        <div className="flex gap-3">
          <select
            value={almacenId}
            onChange={(e) => setAlmacenId(Number(e.target.value))}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
            aria-label="Seleccionar almacén"
            data-tooltip="Cambiar almacén"
          >
            {seen.almacenes.length === 0 ? (
              <option value={5}>Almacén 5</option>
            ) : (
              seen.almacenes.map((a) => (
                <option key={a.id} value={Number(a.id)}>
                  {a.name}
                </option>
              ))
            )}
          </select>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors"
            aria-label="Crear nueva salida"
            data-tooltip="Iniciar nueva salida"
          >
            <Plus className="w-5 h-5" />
            Nueva salida
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por folio, usuario, producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all"
            aria-label="Buscar salidas"
          />
        </div>
        <select
          value={limitOption}
          onChange={(e) => setLimitOption(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
          aria-label="Seleccionar elementos por página"
          data-tooltip="Ajustar elementos por página"
        >
          <option value="5">5 por página</option>
          <option value="10">10 por página</option>
          <option value="20">20 por página</option>
          <option value="all">Mostrar todos</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Folio
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Almacén origen
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Recibe
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Autoriza
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Ítems
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center">
                        <svg className="animate-spin h-12 w-12 text-green-600" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                        </svg>
                        <p className="mt-4 text-gray-600">Cargando salidas...</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : visibleRows.length ? (
                visibleRows.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50 transition-colors duration-200 odd:bg-gray-50 animate-fade-in"
                  >
                    <td className="px-6 py-5 text-sm text-gray-700">
                      {displayFolio(s)}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-700">
                      {s.fecha
                        ? new Date(s.fecha).toLocaleString()
                        : s.createdAt
                        ? new Date(s.createdAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-700">
                      {s.almacenOrigen?.name ?? "-"}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-700">
                      {s.recibidaPor?.name ?? "-"}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-700">
                      {s.authoriza?.name ?? "-"}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-700 truncate max-w-sm">
                      {(s.items || [])
                        .map(
                          (it) =>
                            `${it.cantidadRetirada ?? it.cantidad ?? 0} x ${
                              it.producto?.name ?? it.productoId ?? "—"
                            }`
                        )
                        .join(", ")}
                    </td>
                    <td className="px-6 py-5 text-sm flex gap-2">
                      <button
                        onClick={() => openDetail(s)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        aria-label={`Ver detalles de la salida ${displayFolio(s)}`}
                        data-tooltip="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelected(s);
                          setIsDetailOpen(true);
                          setTimeout(handlePrint, 0);
                        }}
                        className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label={`Imprimir vale de salida ${displayFolio(s)}`}
                        data-tooltip="Imprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelected(s);
                          setIsDetailOpen(true);
                          setTimeout(handleDownload, 0);
                        }}
                        className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label={`Descargar PDF de salida ${displayFolio(s)}`}
                        data-tooltip="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sin salidas
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Crea una nueva salida para comenzar
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      aria-label="Crear nueva salida"
                      data-tooltip="Iniciar nueva salida"
                    >
                      Crear Nueva Salida
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            aria-label="Ir a la primera página"
            data-tooltip="Ir al inicio"
          >
            1
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagination.currentPage <= 1}
            className="px-4 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            aria-label="Página anterior"
            data-tooltip="Página anterior"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-600">
            Página {pagination.currentPage} de {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            aria-label="Página siguiente"
            data-tooltip="Página siguiente"
          >
            Siguiente
          </button>
          <button
            onClick={() => setPage(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            aria-label="Ir a la última página"
            data-tooltip="Ir al final"
          >
            Última
          </button>
        </div>
      )}

      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto transform animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-green-50 text-green-600">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Nueva Salida</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar modal"
                data-tooltip="Cerrar formulario"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            <form onSubmit={onCreate} className="px-6 py-5 space-y-6">
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Encabezado</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Almacén origen
                    </label>
                    <select
                      value={form.almacenOrigenId}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          almacenOrigenId: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                      aria-label="Seleccionar almacén origen"
                    >
                      <option value="">Selecciona...</option>
                      {seen.almacenes.map((a) => (
                        <option key={a.id} value={Number(a.id)}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Equipo/Máquina (ID)
                    </label>
                    <input
                      type="number"
                      value={form.equipoId}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          equipoId: Number(e.target.value),
                        }))
                      }
                      placeholder="Ej. 5"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                      aria-label="ID de equipo/máquina"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recibe (usuario)
                    </label>
                    <select
                      value={form.recibidaPorId}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          recibidaPorId: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                      aria-label="Seleccionar usuario que recibe"
                    >
                      <option value="">Selecciona...</option>
                      {seen.usuarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Autoriza (usuario)
                    </label>
                    <select
                      value={form.autorizaId}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          autorizaId: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                      aria-label="Seleccionar usuario que autoriza"
                    >
                      <option value="">Selecciona...</option>
                      {seen.usuarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Ítems</h3>
                <div className="space-y-4">
                  {form.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="relative border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="absolute -top-3 -right-3 p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 shadow transition-colors"
                        aria-label={`Eliminar ítem ${idx + 1}`}
                        data-tooltip="Eliminar ítem"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Producto
                          </label>
                          <select
                            value={it.productoId}
                            onChange={(e) =>
                              updateItem(idx, "productoId", e.target.value)
                            }
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                            aria-label={`Seleccionar producto para el ítem ${idx + 1}`}
                          >
                            <option value="">Selecciona...</option>
                            {seen.productos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={it.cantidad}
                            onChange={(e) =>
                              updateItem(idx, "cantidad", e.target.value)
                            }
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                            aria-label={`Cantidad para el ítem ${idx + 1}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                    aria-label="Agregar renglón"
                    data-tooltip="Añadir ítem"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar renglón
                  </button>
                </div>
              </section>
              <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-100 py-4 rounded-b-xl flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  aria-label="Cancelar creación de salida"
                  data-tooltip="Cancelar"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md hover:from-green-600 hover:to-green-700 transition-colors"
                  aria-label="Guardar salida"
                  data-tooltip="Confirmar salida"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={closeDetail}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto transform animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 text-blue-600">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Vale de salida
                  </h2>
                  <p className="text-xs text-gray-500">
                    Folio {displayFolio(selected)} •{" "}
                    {selected.fecha
                      ? new Date(selected.fecha).toLocaleDateString()
                      : selected.createdAt
                      ? new Date(selected.createdAt).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                  aria-label="Imprimir vale de salida"
                  data-tooltip="Imprimir"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  aria-label="Descargar PDF"
                  data-tooltip="Descargar PDF"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  onClick={closeDetail}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  aria-label="Cerrar vista de detalle"
                  data-tooltip="Cerrar"
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs font-medium text-gray-500">Almacén</p>
                  <p className="text-sm text-gray-900">{selected.almacenOrigen?.name ?? "-"}</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs font-medium text-gray-500">Recibe</p>
                  <p className="text-sm text-gray-900">{selected.recibidaPor?.name ?? "-"}</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs font-medium text-gray-500">Autoriza</p>
                  <p className="text-sm text-gray-900">{selected.authoriza?.name ?? "-"}</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs font-medium text-gray-500">Equipo / Máquina</p>
                  <p className="text-sm text-gray-900">{selected.equipoId ?? "-"}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Cant.
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Producto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selected.items || []).map((it, idx) => (
                      <tr key={it.id ?? `${it.productoId}-${idx}`} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-4 py-2 text-sm text-gray-700 text-right">
                          {it.cantidadRetirada ?? it.cantidad ?? "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {it.producto?.name ?? it.productoId ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div ref={printableRef} className="hidden">
                <div className="sheet">
                  <div className="header">
                    <div className="title">VALE DE SALIDA</div>
                    <div>
                      <div className="label" style={{ textAlign: "right" }}>
                        FECHA
                      </div>
                      <div className="value" style={{ textAlign: "right" }}>
                        {selected.fecha
                          ? new Date(selected.fecha).toLocaleDateString("es-MX")
                          : selected.createdAt
                          ? new Date(
                              selected.createdAt
                            ).toLocaleDateString("es-MX")
                          : "-"}
                      </div>
                      <div className="folio" style={{ textAlign: "right" }}>
                        {displayFolio(selected)}
                      </div>
                    </div>
                  </div>

                  <div className="grid" style={{ marginBottom: 8 }}>
                    <div className="row">
                      <div style={{ flex: 1 }}>
                        <div className="label">ALMACÉN</div>
                        <div className="value">
                          {selected.almacenOrigen?.name ?? "-"}
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div style={{ flex: 1 }}>
                        <div className="label">RECIBE</div>
                        <div className="value">
                          {selected.recibidaPor?.name ?? "-"}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="label">AUTORIZA</div>
                        <div className="value">
                          {selected.authoriza?.name ?? "-"}
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div style={{ flex: 1 }}>
                        <div className="label">EQUIPO / MÁQUINA</div>
                        <div className="value">{selected.equipoId ?? "-"}</div>
                      </div>
                    </div>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>CANT.</th>
                        <th style={{ width: 180 }}>PRODUCTO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td>{it.cantidadRetirada ?? it.cantidad ?? ""}</td>
                          <td>{it.producto?.name ?? it.productoId ?? ""}</td>
                        </tr>
                      ))}
                      {Array.from({
                        length: Math.max(0, 10 - (selected.items || []).length),
                      }).map((_, i) => (
                        <tr key={`empty-${i}`}>
                          <td style={{ height: 24 }}></td>
                          <td></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="footer">
                    <div className="sign">AUTORIZA</div>
                    <div className="sign">
                      ALMACÉN (ENTREGA): {selected.almacenOrigen?.name ?? "-"}
                    </div>
                    <div className="sign">
                      RECIBE: {selected.recibidaPor?.name ?? "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalidasPage;