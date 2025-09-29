"use client"

import React, { useEffect, useState } from "react"
import { Truck, Eye, Award, FileText, Package, ClipboardList, Hash, Search, CircleCheck, CircleX, Timer } from "lucide-react"
import { FaCirclePlus } from "react-icons/fa6"
import Swal from "sweetalert2"
import { COMPONENTE_KEYS, FASE_KEYS } from "../../types/reportes.types"
import { useDebounce } from "../../hooks/customHooks"
import { useRequisiciones } from "../../hooks/useRequisiciones"
import { useProductos } from "../../hooks/useProductos"
import { useEquipos } from "../../hooks/useEquipos"
import { useSelector } from "react-redux"

function ReportesOperadorPage() {
  const userId = useSelector((state) => state.auth.user?.id)
  const { listMyReportes, createReporte } = useRequisiciones()
  const { listProductos } = useProductos()
  const { listEquipos } = useEquipos()

  const [reportes, setReportes] = useState([])
  const [loading, setLoading] = useState(false)

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedReporte, setSelectedReporte] = useState(null)

  const [page, setPage] = useState(1)
  const [limitOption, setLimitOption] = useState("5")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 500)

  const [selectedComponentes, setSelectedComponentes] = React.useState([]);
  const [selectedFases, setSelectedFases] = React.useState([]);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  })

  // --- FORM STATE ---
  const [observaciones, setObservaciones] = useState("")
  const [items, setItems] = useState([{ productoId: "", cantidad: "" }])
  const [productos, setProductos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [equipoId, setEquipoId] = useState("");

  const limit =
    limitOption === "all" ? pagination.totalItems || 0 : Number.parseInt(limitOption)

  const toggleFormModal = () => setIsFormModalOpen(!isFormModalOpen)
  const closeDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedReporte(null)
  }

  const clearForm = () => {
    setObservaciones("")
    setEquipoId("")
    setSelectedComponentes([]);
    setSelectedFases([]);
    setItems([{ productoId: "", cantidad: "" }])
  }

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false)
    clearForm()
  }


  function CheckboxPill({ label, checked, onChange }) {
    return (
      <label
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer select-none ${checked
          ? 'bg-blue-50 border-blue-300 text-blue-700'
          : 'bg-white border-gray-300 text-gray-700'
          }`}
      >
        <input
          type="checkbox"
          className="hidden"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={`w-4 h-4 inline-flex items-center justify-center rounded-full border ${checked
            ? 'bg-blue-600 border-blue-600 text-white'
            : 'bg-white border-gray-300 text-transparent'
            }`}
        >
          ✓
        </span>
        <span className="text-sm">{label}</span>
      </label>
    );
  }

  function formatDate(isoString) {
    if (!isoString) return "-"
    const date = new Date(isoString)
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }


  function Th({ children }) {
    return (
      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
        {children}
      </th>
    );
  }

  function Td({ children }) {
    return <td className="px-4 py-2 text-sm text-gray-900">{children}</td>;
  }

  function Detail({ label, value }) {
    return (
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-900">{value ?? "N/A"}</p>
      </div>
    );
  }

  const fetchReportes = () => {
    if (!userId) return
    setLoading(true)
    listMyReportes({ page, limit, search: debouncedSearch, order: "ASC", userId })
      .then((res) => {
        let data = res.data.data
        if (statusFilter !== "ALL") {
          data = data.filter((r) => r.status === statusFilter)
        }
        setReportes(data)
        setPagination(res.data.meta)
      })
      .catch((err) => {
        Swal.fire("Error", err.message || "Error al cargar reportes", "error")
      })
      .finally(() => setLoading(false))
  }

  const fetchProductos = () => {
    listProductos({ page: 1, limit: 100, order: "ASC" })
      .then((res) => {
        setProductos(res.data.data)
      })
      .catch((err) => {
        console.error("Error cargando productos:", err)
      })
  }

  const fetchEquipos = () => {
    listEquipos({ page: 1, limit: 100, order: "ASC" })
      .then((res) => {
        setEquipos(res.data.data)
      })
      .catch((err) => {
        console.error("Error cargando productos:", err)
      })
  }

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    fetchReportes()
  }, [page, limit, debouncedSearch, statusFilter])

  useEffect(() => {
    fetchProductos()
  }, [])

  useEffect(() => {
    fetchEquipos()
  }, [])

  // --- FORM LOGIC ---
  const handleAddItem = () => {
    setItems([...items, { productoId: "", cantidad: "" }])
  }

  const handleChangeItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!observaciones.trim()) {
      Swal.fire("Error", "Las observaciones son requeridas", "error")
      return
    }

    if (!equipoId.trim()) {
      Swal.fire("Error", "El ID del equipo es requerido", "error")
      return
    }

    if (!selectedComponentes.length) {
      Swal.fire('Error', 'Selecciona al menos un componente', 'error');
      return;
    }

    if (!selectedFases.length) {
      Swal.fire('Error', 'Selecciona al menos una fase', 'error');
      return;
    }

    if (items.length === 0) {
      Swal.fire("Error", "Debes agregar al menos un item", "error")
      return
    }

    console.log('sending componentes:', selectedComponentes);
    console.log('sending fases:', selectedFases);

    for (let i = 0; i < items.length; i++) {
      const { productoId, cantidad } = items[i]
      if (!productoId.trim()) {
        Swal.fire("Error", `El item ${i + 1} no tiene Producto seleccionado`, "error")
        return
      }
      if (!cantidad || isNaN(Number(cantidad)) || Number(cantidad) <= 0) {
        Swal.fire("Error", `El item ${i + 1} debe tener cantidad mayor a 0`, "error")
        return
      }
    }

    const payload = {
      observaciones,
      equipoId,
      componentes: selectedComponentes,
      fases: selectedFases,
      items: items.map((i) => ({
        productoId: String(i.productoId),
        cantidad: Number(i.cantidad),
      })),
    }

    console.log(payload)

    try {
      await createReporte(payload)
      Swal.fire("Éxito", "Reporte creado correctamente", "success")
      fetchReportes()
      handleCloseFormModal()
    } catch (err) {
      const backendMsg = err.response?.data?.message
      const errorMessage = Array.isArray(backendMsg)
        ? backendMsg.join(", ")
        : backendMsg || "No se pudo crear el reporte"
      Swal.fire("Error", errorMessage, "error")
    }
  }

  function formatDate(isoString) {
    if (!isoString) return "-"
    const date = new Date(isoString)
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  // --- Stats Section ---
  const StatsSection = ({ reportes }) => {
    const total = reportes.length
    const pendientes = reportes.filter((r) => r.status === "PENDIENTE").length
    const procesados = reportes.filter((r) => r.status === "PROCESADO").length
    const aprobados = reportes.filter((r) => r.status === "APROBADO").length
    const rechazados = reportes.filter((r) => r.status === "RECHAZADO").length

    const stats = [
      {
        title: "Total Reportes",
        value: total,
        icon: FileText,
        color: "bg-blue-500",
        textColor: "text-blue-600",
      },
      {
        title: "Procesados",
        value: procesados,
        icon: Award,
        color: "bg-gray-500",
        textColor: "text-gray-600",
      },
      {
        title: "Aprobados",
        value: aprobados,
        icon: CircleCheck,
        color: "bg-green-500",
        textColor: "text-green-600",
      },
      {
        title: "Pendientes",
        value: pendientes,
        icon: Timer,
        color: "bg-yellow-500",
        textColor: "text-yellow-600",
      },
      {
        title: "Rechazados",
        value: rechazados,
        icon: CircleX,
        color: "bg-red-500",
        textColor: "text-red-600",
      },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // --- UI ---
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Reportes</h1>
          <p className="text-gray-600 mt-1">Administra tus propios reportes</p>
        </div>
        <button
          onClick={toggleFormModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaCirclePlus className="w-5 h-5 mr-2" />
          Nuevo Reporte
        </button>
      </div>

      {/* Stats */}
      <StatsSection reportes={reportes} />

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar reportes..."
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
          <option value="PROCESADO">Procesados</option>
          <option value="APROBADO">Aprobados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="RECHAZADO">Rechazados</option>
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
        <p>Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estatus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Revisado por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportes.length > 0 ? (
                  reportes.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{formatDate(r.fechaCreacion || r.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${r.status === "PENDIENTE"
                            ? "bg-yellow-100 text-yellow-800"
                            : r.status === "APROBADO"
                              ? "bg-green-100 text-green-800"
                              : r.status === "PROCESADO"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-red-100 text-red-800"
                            }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{r.revisadoPor?.email || "Pendiente"}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                          onClick={() => {
                            setSelectedReporte(r)
                            setIsDetailModalOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No se encontraron reportes</h3>
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
            onClick={() => setPage((prev) => prev - 1)}
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

      {/* Modal Form */}
      {isFormModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleCloseFormModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Reporte</h2>
              <button
                onClick={handleCloseFormModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-gray-400 hover:text-gray-600 text-xl">&times;</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClipboardList className="w-4 h-4 inline mr-1" />
                  Observaciones *
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Escribe las observaciones del reporte..."
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 inline mr-1" />
                  Euquipo *
                </label>
                <select
                  value={equipoId}
                  onChange={(e) => setEquipoId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Selecciona un equipo --</option>
                  {equipos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.equipo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Componentes */}
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Componentes (al menos uno) *
                </p>
                <div className="flex flex-wrap gap-2">
                  {COMPONENTE_KEYS.map((k) => {
                    const checked = selectedComponentes.includes(k);
                    return (
                      <CheckboxPill
                        key={k}
                        label={k.replace(/_/g, ' ')}
                        checked={checked}
                        onChange={(next) => {
                          setSelectedComponentes((prev) =>
                            next ? [...prev, k] : prev.filter((x) => x !== k)
                          );
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Fases */}
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Fases (al menos una) *
                </p>
                <div className="flex flex-wrap gap-2">
                  {FASE_KEYS.map((k) => {
                    const checked = selectedFases.includes(k);
                    return (
                      <CheckboxPill
                        key={k}
                        label={k.replace(/_/g, ' ')}
                        checked={checked}
                        onChange={(next) => {
                          setSelectedFases((prev) =>
                            next ? [...prev, k] : prev.filter((x) => x !== k)
                          );
                        }}
                      />
                    );
                  })}
                </div>
              </div>


              {/* Items */}
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Package className="w-4 h-4 inline mr-1" />
                      Producto *
                    </label>
                    <select
                      value={item.productoId}
                      onChange={(e) => handleChangeItem(index, "productoId", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">-- Selecciona un producto --</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Hash className="w-4 h-4 inline mr-1" />
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={item.cantidad}
                      onChange={(e) => handleChangeItem(index, "cantidad", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar item"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Botón agregar item */}
              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Agregar otro +
              </button>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {isDetailModalOpen && selectedReporte && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={closeDetailModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 text-blue-600">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Detalle del Reporte</h2>
                  <p className="text-xs text-gray-500">Vista resumen con información clave</p>
                </div>
              </div>
              <button
                onClick={closeDetailModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-8">
              {/* Badges */}
              <section className="flex flex-wrap items-center gap-2">

                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${selectedReporte.status === "APROBADO"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : selectedReporte.status === "PENDIENTE"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : selectedReporte.status === "PROCESADO"
                        ? "bg-gray-50 text-gray-700 border-gray-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                >
                  {selectedReporte.status}
                </span>

                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200">
                  Almacén: {selectedReporte.almacen?.name || "N/A"}
                </span>
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  Equipo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Detail label="Equipo" value={selectedReporte.equipo || "Sin equipo"} />
                  <Detail label="Horometro" value={selectedReporte.horometro || "N/A"} />
                  <Detail label="Modelo" value={selectedReporte.modelo || "N/A"} />
                  <Detail label="Serie" value={selectedReporte.serie || "N/A"}
                  />
                </div>
              </section>

              {/* Información general */}
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Información general
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Detail label="Observaciones" value={selectedReporte.observaciones || "Sin observaciones"} />
                  <Detail label="Revisado por" value={selectedReporte.revisadoPor?.email || "Pendiente"} />
                  <Detail label="Fecha creación" value={formatDate(selectedReporte.fechaCreacion)} />
                  <Detail
                    label="Fecha revisión"
                    value={selectedReporte.fechaRevision ? formatDate(selectedReporte.fechaRevision) : "N/A"}
                  />
                </div>
              </section>

              {/* Componentes y Fases */}
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Clasificación</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Componentes</p>
                    {selectedReporte.componentes?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedReporte.componentes.map((c, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">Sin componentes</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Fases</p>
                    {selectedReporte.fases?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedReporte.fases.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">Sin fases</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Items */}
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  Refacciones
                </h3>
                {selectedReporte.items?.length ? (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <Th>Producto</Th>
                          <Th>Cantidad</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedReporte.items.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <Td>
                              {item.producto
                                ? `${item.producto.id} - ${item.producto.name || "Sin nombre"}`
                                : item.productoId}
                            </Td>
                            <Td>{item.cantidad}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600">No hay items registrados en este reporte</p>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 px-6 py-4 rounded-b-xl flex flex-wrap gap-2 justify-end">
              <button
                onClick={closeDetailModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ReportesOperadorPage

