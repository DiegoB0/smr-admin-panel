"use client";

import { useParams, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  FileText,
  Search,
  Plus,
  Trash2,
  Eye,
  Printer,
  Download,
} from "lucide-react";
import Swal from "sweetalert2";
import { useDebounce } from "../../hooks/customHooks";
import { useSalidas } from "../../hooks/useSalidas";
import { useEquipos } from "../../hooks/useEquipos";
import { useAlmacenes } from "../../hooks/useAlmacenes";

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

const SalidasPage = () => {
  const { listSalidas, crearSalida } = useSalidas();
  const { listEquipos } = useEquipos();
  const { getAlmacenProducts } = useAlmacenes();
  const { almacenId: almacenIdParam } = useParams();
  const almacenIdNum = Number(almacenIdParam);
  const navigate = useNavigate();

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

  // Catalogs for form
  const [equipos, setEquipos] = useState([]);
  const [products, setProducts] = useState([]);
  const [catalogsLoading, setCatalogsLoading] = useState(false);

  // Crear salida - UPDATED FORM STRUCTURE (removed almacenOrigenId)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    recibidaPor: "",
    equipoId: "",
    items: [{ productoId: "", cantidad: "" }],
  });

  const limit =
    limitOption === "all" ? pagination.totalItems || 0 : parseInt(limitOption, 10);

  // Detalles / impresión
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const printableRef = useRef(null);

  // Fetch catalogs for form
  const fetchCatalogs = async () => {
    setCatalogsLoading(true);
    try {
      const [equiposRes, productsRes] = await Promise.all([
        listEquipos({ limit: 100 }),
        getAlmacenProducts({ almacenId: almacenIdNum, limit: 100 })
      ]);
      console.log('Products response:', productsRes.data);

      setEquipos(Array.isArray(equiposRes.data?.data) ? equiposRes.data.data : []);
      setProducts(Array.isArray(productsRes.data?.data) ? productsRes.data.data : []);
    } catch (err) {
      console.error("Error fetching catalogs:", err);
      Swal.fire("Error", "Error cargando catálogos", "error");
    } finally {
      setCatalogsLoading(false);
    }
  };

  async function fetchData() {
    setLoading(true);
    try {
      const { data } = await listSalidas({
        almacenId: almacenIdNum,
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
    } catch (err) {
      Swal.fire("Error", getApiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [page, limitOption, debouncedSearch, almacenIdNum]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limitOption]);

  // Fetch catalogs when modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      fetchCatalogs();
    }
  }, [isCreateModalOpen]);

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
    if (!form.recibidaPor.trim()) return "Campo 'Recibe' requerido";
    if (!form.equipoId || Number(form.equipoId) <= 0)
      return "Selecciona un equipo";
    if (!Array.isArray(form.items) || form.items.length === 0)
      return "Agrega al menos un ítem";
    const bad = form.items.find((it) => {
      const c = Number(it.cantidad);
      return !it.productoId.trim() || Number.isNaN(c) || c <= 0;
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
        almacenOrigenId: almacenIdNum, // Use almacenIdNum directly
        recibidaPor: String(form.recibidaPor).trim(),
        equipoId: Number(form.equipoId),
        items: form.items.map((it) => ({
          productoId: String(it.productoId).trim(),
          cantidad: Number(it.cantidad),
        })),
      };

      await crearSalida(body);

      Swal.fire("Éxito", "Salida registrada", "success");
      setIsCreateModalOpen(false);
      setForm({
        recibidaPor: "",
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
            .footer { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; text-align: center; }
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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto font-inter">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <button
            className="flex gap-2 items-center mb-2"
            onClick={() => navigate(`/dashboard/almacenes/`)}
          >
            <ChevronLeft className="text-gray-500" />
            <span className="text-gray-600 uppercase text-lg">Regresar</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Salidas</h1>
          <p className="text-gray-600 mt-1">Registra y emite vales de salida desde almacén {almacenIdNum}</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva salida
        </button>
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
          />
        </div>
        <select
          value={limitOption}
          onChange={(e) => setLimitOption(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Folio
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Recibe
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Equipo
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
                  <td colSpan={6} className="px-6 py-12 text-center">
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
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors duration-200">
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
                      {s.recibidaPor?.name ?? s.recibidaPor ?? "-"}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-700">
                      {s.equipoId ?? "-"}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-700 truncate max-w-sm">
                      {(s.items || [])
                        .map(
                          (it) =>
                            `${it.cantidadRetirada ?? it.cantidad ?? 0} x ${it.producto?.name ?? it.productoId ?? "—"
                            }`
                        )
                        .join(", ")}
                    </td>
                    <td className="px-6 py-5 text-sm flex gap-2">
                      <button
                        onClick={() => openDetail(s)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelected(s);
                          setIsDetailOpen(true);
                          setTimeout(handlePrint, 100);
                        }}
                        className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sin salidas</h3>
                    <p className="text-gray-600 mb-4">Crea una nueva salida para comenzar</p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
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
          >
            1
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagination.currentPage <= 1}
            className="px-4 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
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
          >
            Siguiente
          </button>
          <button
            onClick={() => setPage(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            Última
          </button>
        </div>
      )}

      {/* CREATE MODAL - UPDATED WITH SELECTS */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
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
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <form onSubmit={onCreate} className="px-6 py-5 space-y-6">
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Información general</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Equipo *
                    </label>
                    <select
                      value={form.equipoId}
                      onChange={(e) => setForm((p) => ({ ...p, equipoId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                      required
                      disabled={catalogsLoading}
                    >
                      <option value="">
                        {catalogsLoading ? "Cargando equipos..." : "Selecciona un equipo"}
                      </option>
                      {equipos.map((equipo) => (
                        <option key={equipo.id} value={equipo.id}>
                          {equipo.equipo} - {equipo.no_economico}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recibe *
                    </label>
                    <input
                      type="text"
                      value={form.recibidaPor}
                      onChange={(e) => setForm((p) => ({ ...p, recibidaPor: e.target.value }))}
                      placeholder="Nombre de quien recibe"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                      required
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Ítems</h3>
                <div className="space-y-4">
                  {form.items.map((it, idx) => (
                    <div key={idx} className="relative border border-gray-200 rounded-lg p-4 bg-gray-50">
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="absolute -top-3 -right-3 p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 shadow transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Producto *
                          </label>
                          <select
                            value={it.productoId}
                            onChange={(e) => updateItem(idx, "productoId", e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                            required
                            disabled={catalogsLoading}
                          >
                            <option value="">
                              {catalogsLoading ? "Cargando productos..." : "Selecciona un producto"}
                            </option>
                            {products.map((product) => (
                              <option key={product.id} value={product.producto.id} className="text-black">
                                {`ID ${product.producto.id} - ${product.producto.name}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad *
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={it.cantidad}
                            onChange={(e) => updateItem(idx, "cantidad", e.target.value)}
                            placeholder="10"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                            required
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
                  >
                    <Plus className="w-4 h-4" />
                    Agregar ítem
                  </button>
                </div>
              </section>

              <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-100 py-4 rounded-b-xl flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || catalogsLoading}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md hover:from-green-600 hover:to-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailOpen && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={closeDetail}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 text-blue-600">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Vale de salida</h2>
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
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button
                  onClick={closeDetail}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs font-medium text-gray-500">Almacén</p>
                  <p className="text-sm text-gray-900">{selected.almacenOrigen?.name ?? almacenIdNum}</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs font-medium text-gray-500">Recibe</p>
                  <p className="text-sm text-gray-900">{selected.recibidaPor?.name ?? selected.recibidaPor ?? "-"}</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs font-medium text-gray-500">Equipo</p>
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
                      <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
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

              {/* Print template */}
              <div ref={printableRef} className="hidden">
                <div className="sheet">
                  <div className="header">
                    <div className="title">VALE DE SALIDA</div>
                    <div>
                      <div className="label" style={{ textAlign: "right" }}>FECHA</div>
                      <div className="value" style={{ textAlign: "right" }}>
                        {selected.fecha
                          ? new Date(selected.fecha).toLocaleDateString("es-MX")
                          : selected.createdAt
                            ? new Date(selected.createdAt).toLocaleDateString("es-MX")
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
                        <div className="value">{selected.almacenOrigen?.name ?? almacenIdNum}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="label">EQUIPO</div>
                        <div className="value">{selected.equipoId ?? "-"}</div>
                      </div>
                    </div>
                    <div className="row">
                      <div style={{ flex: 1 }}>
                        <div className="label">RECIBE</div>
                        <div className="value">{selected.recibidaPor?.name ?? selected.recibidaPor ?? "-"}</div>
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
                    <div className="sign">ALMACÉN (ENTREGA)</div>
                    <div className="sign">RECIBE: {selected.recibidaPor?.name ?? selected.recibidaPor ?? "-"}</div>
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
