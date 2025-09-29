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
} from "lucide-react";
import Swal from "sweetalert2";
import { useDebounce } from "../../hooks/customHooks";

// Config
const PERSISTIR_EN_STORAGE = true;
const STORAGE_KEY_SALIDAS = "mock_salidas";
const STORAGE_KEY_FOLIO = "mock_salidas_folio";

// Helpers almacenamiento
const loadSalidas = () =>
  JSON.parse(localStorage.getItem(STORAGE_KEY_SALIDAS) || "[]");

const saveSalidas = (data) =>
  localStorage.setItem(STORAGE_KEY_SALIDAS, JSON.stringify(data));

const loadFolio = () => {
  const n = Number(localStorage.getItem(STORAGE_KEY_FOLIO) || "2100");
  return Number.isFinite(n) ? n : 2100;
};

const saveFolio = (n) =>
  localStorage.setItem(STORAGE_KEY_FOLIO, String(n));

const nextFolio = () => {
  const n = loadFolio() + 1;
  saveFolio(n);
  return n;
};

// Componente
const SalidasPage = () => {
  // Estado listado
  const [salidas, setSalidas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("10");

  // Modal crear
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState(() => ({
    folio: PERSISTIR_EN_STORAGE ? nextFolio() : 2101,
    fecha: new Date().toISOString().slice(0, 10),
    proyecto: "",
    obra: "",
    maquina: "",
    entrega: "", // almacén
    recibe: "", // quien se lo llevó
    items: [
      { cantidad: "", noParte: "", descripcion: "" },
    ],
  }));

  // Modal detalles
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const limit =
    limitOption === "all" ? salidas.length || 0 : parseInt(limitOption, 10);

  // Cargar inicial
  useEffect(() => {
    if (PERSISTIR_EN_STORAGE) {
      setSalidas(loadSalidas());
    } else {
      setSalidas([]); // sin persistencia, arranca vacío por reload
    }
  }, []);

  // Filtro + paginación
  const filtered = useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    let data = salidas;
    if (s) {
      data = data.filter((x) => {
        return (
          String(x.folio || "").includes(s) ||
          (x.proyecto || "").toLowerCase().includes(s) ||
          (x.obra || "").toLowerCase().includes(s) ||
          (x.maquina || "").toLowerCase().includes(s) ||
          (x.recibe || "").toLowerCase().includes(s) ||
          (x.entrega || "").toLowerCase().includes(s)
        );
      });
    }
    // más recientes primero
    data = [...data].sort(
      (a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime() ||
        (b.folio || 0) - (a.folio || 0)
    );
    return data;
  }, [salidas, debouncedSearch]);

  const totalItems = filtered.length;
  const totalPages =
    limitOption === "all" ? 1 : Math.max(1, Math.ceil(totalItems / limit));
  const currentPage =
    limitOption === "all" ? 1 : Math.min(page, totalPages);
  const start = limitOption === "all" ? 0 : (currentPage - 1) * limit;
  const end = limitOption === "all" ? undefined : start + limit;
  const pageData = filtered.slice(start, end);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limitOption]);

  // Form helpers
  const addItem = () =>
    setForm((p) => ({
      ...p,
      items: [...p.items, { cantidad: "", noParte: "", descripcion: "" }],
    }));

  const removeItem = (i) =>
    setForm((p) => ({
      ...p,
      items: p.items.filter((_, idx) => idx !== i),
    }));

  const updateItem = (i, field, value) =>
    setForm((p) => {
      const items = [...p.items];
      items[i] = { ...items[i], [field]: value };
      return { ...p, items };
    });

  const resetForm = () =>
    setForm({
      folio: PERSISTIR_EN_STORAGE ? nextFolio() : 2101,
      fecha: new Date().toISOString().slice(0, 10),
      proyecto: "",
      obra: "",
      maquina: "",
      entrega: "",
      recibe: "",
      items: [{ cantidad: "", noParte: "", descripcion: "" }],
    });

  const validateForm = () => {
    if (!form.fecha) return "La fecha es requerida";
    if (!form.proyecto) return "El proyecto es requerido";
    if (!form.obra) return "La obra es requerida";
    if (!form.maquina) return "La máquina es requerida";
    if (!form.entrega) return "Campo 'Entrega' (Almacén) es requerido";
    if (!form.recibe) return "Campo 'Recibe' es requerido";
    if (form.items.length === 0) return "Agrega al menos un renglón";
    const bad = form.items.find((it) => {
      const c = Number(it.cantidad);
      return (
        !it.descripcion ||
        Number.isNaN(c) ||
        c <= 0
      );
    });
    if (bad) return "Verifica cantidad (> 0) y descripción en los ítems";
    return null;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      Swal.fire("Validación", err, "warning");
      return;
    }
    const payload = {
      id: crypto.randomUUID(),
      ...form,
      folio: Number(form.folio),
      items: form.items.map((it, idx) => ({
        id: `${Date.now()}-${idx}`,
        cantidad: Number(it.cantidad),
        noParte: it.noParte || "",
        descripcion: it.descripcion,
      })),
      createdAt: new Date().toISOString(),
    };

    const next = [payload, ...salidas];
    setSalidas(next);
    if (PERSISTIR_EN_STORAGE) saveSalidas(next);

    Swal.fire("Éxito", "Salida registrada", "success");
    setIsCreateModalOpen(false);
    resetForm();
  };

  // Detalles e impresión
  const openDetail = (s) => {
    setSelected(s);
    setIsDetailOpen(true);
  };
  const closeDetail = () => {
    setSelected(null);
    setIsDetailOpen(false);
  };

  const printableRef = useRef(null);

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
            body { font-family: Arial, sans-serif; padding: 16px; }
            .sheet { border: 1px solid #ddd; padding: 12px; }
            .grid { display: grid; gap: 8px; }
            .row { display:flex; gap: 12px; }
            .label { font-size: 12px; color: #555; }
            .value { font-size: 14px; border-bottom: 1px solid #ccc; padding: 2px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #bbb; padding: 6px 8px; font-size: 12px; }
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
    // Para simplificar: abre el print (el usuario puede “Guardar como PDF”)
    handlePrint();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salidas</h1>
          <p className="text-gray-600 mt-1">
            Registra y emite vales de salida desde almacén
          </p>
        </div>
        <div />
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por folio, proyecto, obra, máquina..."
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

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Nueva salida
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Folio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
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
                  Entrega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Recibe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pageData.length > 0 ? (
                pageData.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{s.folio}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(s.fecha).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{s.proyecto}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{s.obra}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{s.maquina}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{s.entrega}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{s.recibe}</td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        onClick={() => openDetail(s)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Ver"
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
                        title="Imprimir"
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
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay salidas registradas
                    </h3>
                    <p className="text-gray-600">
                      Crea una nueva salida para comenzar
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

      {/* Modal crear */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-green-50 text-green-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Nueva salida de almacén
                  </h2>
                  <p className="text-xs text-gray-500">
                    Llena los campos para emitir el vale
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <form onSubmit={onSubmit} className="px-6 py-5 space-y-8">
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Encabezado
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Folio
                    </label>
                    <input
                      type="number"
                      value={form.folio}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, folio: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={form.fecha}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, fecha: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proyecto
                    </label>
                    <input
                      type="text"
                      value={form.proyecto}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, proyecto: e.target.value }))
                      }
                      required
                      placeholder="Nombre del proyecto"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Obra
                    </label>
                    <input
                      type="text"
                      value={form.obra}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, obra: e.target.value }))
                      }
                      required
                      placeholder="Obra / Ubicación"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máquina
                    </label>
                    <input
                      type="text"
                      value={form.maquina}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, maquina: e.target.value }))
                      }
                      required
                      placeholder="Identificador de máquina / equipo"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Ítems
                </h3>
                <div className="space-y-3">
                  {form.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="relative border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="absolute -top-3 -right-3 p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 shadow"
                        title="Eliminar renglón"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-8 gap-3">
                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cant.
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={it.cantidad}
                            onChange={(e) =>
                              updateItem(idx, "cantidad", e.target.value)
                            }
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            No. de parte
                          </label>
                          <input
                            type="text"
                            value={it.noParte}
                            onChange={(e) =>
                              updateItem(idx, "noParte", e.target.value)
                            }
                            placeholder="Opcional"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          />
                        </div>
                        <div className="md:col-span-5">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                          </label>
                          <input
                            type="text"
                            value={it.descripcion}
                            onChange={(e) =>
                              updateItem(idx, "descripcion", e.target.value)
                            }
                            required
                            placeholder="Describe el material que sale"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
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
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar renglón
                  </button>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Firmas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entrega (Almacén)
                    </label>
                    <input
                      type="text"
                      value={form.entrega}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, entrega: e.target.value }))
                      }
                      required
                      placeholder="Nombre de quien entrega"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recibe
                    </label>
                    <input
                      type="text"
                      value={form.recibe}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, recibe: e.target.value }))
                      }
                      required
                      placeholder="Nombre de quien recibe"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                  </div>
                </div>
              </section>

              <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 -mx-6 px-6 py-4 rounded-b-xl flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles + plantilla imprimible */}
      {isDetailOpen && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={closeDetail}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto"
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
                    Vale de salida
                  </h2>
                  <p className="text-xs text-gray-500">
                    Folio {selected.folio} • {new Date(selected.fecha).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  onClick={closeDetail}
                  className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Preview simple */}
            <div className="px-6 py-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Proyecto</p>
                  <p className="text-sm font-medium">{selected.proyecto}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Obra</p>
                  <p className="text-sm font-medium">{selected.obra}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Máquina</p>
                  <p className="text-sm font-medium">{selected.maquina}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Entrega</p>
                  <p className="text-sm font-medium">{selected.entrega}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recibe</p>
                  <p className="text-sm font-medium">{selected.recibe}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Cant.
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        No. de parte
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Descripción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selected.items.map((it) => (
                      <tr key={it.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {it.cantidad}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {it.noParte || "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {it.descripcion}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Plantilla imprimible oculta */}
              <div ref={printableRef} className="hidden">
                <div className="sheet">
                  <div className="header">
                    <div className="title">VALE DE SALIDA</div>
                    <div>
                      <div className="label" style={{ textAlign: "right" }}>
                        FECHA
                      </div>
                      <div className="value" style={{ textAlign: "right" }}>
                        {new Date(selected.fecha).toLocaleDateString("es-MX")}
                      </div>
                      <div className="folio" style={{ textAlign: "right" }}>
                        {String(selected.folio).padStart(5, "0")}
                      </div>
                    </div>
                  </div>

                  <div className="grid" style={{ marginBottom: 8 }}>
                    <div className="row">
                      <div style={{ flex: 1 }}>
                        <div className="label">PROYECTO</div>
                        <div className="value">{selected.proyecto}</div>
                      </div>
                    </div>
                    <div className="row">
                      <div style={{ flex: 1 }}>
                        <div className="label">OBRA</div>
                        <div className="value">{selected.obra}</div>
                      </div>
                    </div>
                    <div className="row">
                      <div style={{ flex: 1 }}>
                        <div className="label">MÁQUINA</div>
                        <div className="value">{selected.maquina}</div>
                      </div>
                    </div>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>CANT.</th>
                        <th style={{ width: 180 }}>No. DE PARTE</th>
                        <th>DESCRIPCIÓN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>{it.cantidad}</td>
                          <td>{it.noParte || ""}</td>
                          <td>{it.descripcion}</td>
                        </tr>
                      ))}
                      {/* filas vacías para simular formato físico */}
                      {Array.from({
                        length: Math.max(0, 10 - selected.items.length),
                      }).map((_, i) => (
                        <tr key={`empty-${i}`}>
                          <td style={{ height: 24 }}></td>
                          <td></td>
                          <td></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="footer">
                    <div className="sign">AUTORIZA</div>
                    <div className="sign">ALMACÉN (ENTREGA): {selected.entrega}</div>
                    <div className="sign">RECIBE: {selected.recibe}</div>
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
