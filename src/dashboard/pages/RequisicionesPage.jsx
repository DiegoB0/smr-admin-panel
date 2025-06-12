"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import RequisicionForm from "../components/requisiciones/RequisicionForm"
import RequisicionTable from "../components/requisiciones/RequisicionTable"
import RequisicionFilters from "../components/requisiciones/RequisicionFilters"
import RequisicionStats from "../components/requisiciones/RequisicionStats"

const RequisicionesPage = () => {
  const [requisiciones, setRequisiciones] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingRequisicion, setEditingRequisicion] = useState(null)
  const [filters, setFilters] = useState({
    estado: "todos",
    fechaInicio: "",
    fechaFin: "",
    departamento: "",
    busqueda: "",
  })
  const [loading, setLoading] = useState(true)

  // Datos de ejemplo - aquí conectarías con tu API
  const mockRequisiciones = [
    {
      id: 1,
      numero: "REQ-2024-001",
      fecha: "2024-01-15",
      departamento: "Producción",
      solicitante: "Juan Pérez",
      estado: "pendiente",
      prioridad: "alta",
      items: [
        { producto: "Tornillos M8", cantidad: 100, unidad: "pcs" },
        { producto: "Aceite hidráulico", cantidad: 5, unidad: "L" },
      ],
      total: 2500.0,
      observaciones: "Urgente para línea de producción",
    },
    {
      id: 2,
      numero: "REQ-2024-002",
      fecha: "2024-01-14",
      departamento: "Mantenimiento",
      solicitante: "María García",
      estado: "aprobada",
      prioridad: "media",
      items: [{ producto: "Filtros de aire", cantidad: 10, unidad: "pcs" }],
      total: 1200.0,
      observaciones: "",
    },
    {
      id: 3,
      numero: "REQ-2024-003",
      fecha: "2024-01-13",
      departamento: "Almacén",
      solicitante: "Carlos López",
      estado: "completada",
      prioridad: "baja",
      items: [{ producto: "Papel A4", cantidad: 20, unidad: "paquetes" }],
      total: 400.0,
      observaciones: "Material de oficina",
    },
  ]

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setRequisiciones(mockRequisiciones)
      setLoading(false)
    }, 1000)
  }, [])

  const handleCreateRequisicion = () => {
    setEditingRequisicion(null)
    setShowForm(true)
  }

  const handleEditRequisicion = (requisicion) => {
    setEditingRequisicion(requisicion)
    setShowForm(true)
  }

  const handleDeleteRequisicion = (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta requisición?")) {
      setRequisiciones((prev) => prev.filter((req) => req.id !== id))
    }
  }

  const handleSaveRequisicion = (requisicionData) => {
    if (editingRequisicion) {
      // Editar requisición existente
      setRequisiciones((prev) =>
        prev.map((req) => (req.id === editingRequisicion.id ? { ...req, ...requisicionData } : req)),
      )
    } else {
      // Crear nueva requisición
      const newRequisicion = {
        ...requisicionData,
        id: Date.now(),
        numero: `REQ-2024-${String(requisiciones.length + 1).padStart(3, "0")}`,
        fecha: new Date().toISOString().split("T")[0],
      }
      setRequisiciones((prev) => [newRequisicion, ...prev])
    }
    setShowForm(false)
    setEditingRequisicion(null)
  }

  const filteredRequisiciones = requisiciones.filter((req) => {
    const matchesEstado = filters.estado === "todos" || req.estado === filters.estado
    const matchesDepartamento =
      !filters.departamento || req.departamento.toLowerCase().includes(filters.departamento.toLowerCase())
    const matchesBusqueda =
      !filters.busqueda ||
      req.numero.toLowerCase().includes(filters.busqueda.toLowerCase()) ||
      req.solicitante.toLowerCase().includes(filters.busqueda.toLowerCase())

    return matchesEstado && matchesDepartamento && matchesBusqueda
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Requisiciones</h1>
            <p className="text-gray-600 mt-1">Gestiona las solicitudes de materiales y productos</p>
          </div>
          <button
            onClick={handleCreateRequisicion}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Nueva Requisición
          </button>
        </div>

        {/* Estadísticas */}
        <RequisicionStats requisiciones={requisiciones} />
      </div>

      {/* Filtros */}
      <RequisicionFilters filters={filters} onFiltersChange={setFilters} className="mb-6" />

      {/* Tabla de requisiciones */}
      <RequisicionTable
        requisiciones={filteredRequisiciones}
        onEdit={handleEditRequisicion}
        onDelete={handleDeleteRequisicion}
      />

      {/* Modal de formulario */}
      {showForm && (
        <RequisicionForm
          requisicion={editingRequisicion}
          onSave={handleSaveRequisicion}
          onCancel={() => {
            setShowForm(false)
            setEditingRequisicion(null)
          }}
        />
      )}
    </div>
  )
}

export default RequisicionesPage
