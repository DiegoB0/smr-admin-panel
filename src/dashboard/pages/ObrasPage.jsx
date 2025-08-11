"use client"

import { useEffect, useState } from "react"
import { FaCirclePlus } from "react-icons/fa6"
import { MapPin, FileText, Edit, Trash2, Search, TrendingUp, AlertTriangle, Package } from "lucide-react"
import Swal from "sweetalert2"
import { useObras } from "../../hooks/useObras"
import { useDebounce } from "../../hooks/customHooks"
import { useAuthFlags } from '../../hooks/useAuth';

function ObrasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState(null)

  const { isAdmin } = useAuthFlags();

  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const [limitOption, setLimitOption] = useState("5")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  })

  const { listObras, createObra, updateObra, deleteObra } = useObras()

  useEffect(() => {
    setPage(1)
  }, [debouncedSearchTerm])

  useEffect(() => {
    fetchObras()
  }, [page, limitOption, debouncedSearchTerm])

  const fetchObras = async () => {
    setLoading(true)
    try {
      const limit = limitOption === "all" ? 100 : Number.parseInt(limitOption, 10)
      const res = await listObras({
        page,
        limit,
        search: debouncedSearchTerm,
        order: "ASC",
      })
      setObras(res.data.data)
      setPagination(res.data.meta)
    } catch (err) {
      console.error(err)
      Swal.fire("Error", "Fallo al traer obras", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { name, description, location }

    try {
      if (isEditing) {
        await updateObra(editId, payload)
        Swal.fire("Obra actualizada", "", "success")
      } else {
        const { data: newObra } = await createObra(payload)
        setObras((prev) => [newObra, ...prev])
        Swal.fire("Nueva obra creada", "", "success")
      }
      closeModal()
      fetchObras()
    } catch (err) {
      console.error(err)
      Swal.fire("Error", err.message || "Fallo al guardar", "error")
    }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    })

    if (!result.isConfirmed) return

    try {
      await deleteObra(id)
      setObras((current) => current.filter((o) => o.id !== id))
      Swal.fire("Eliminado", "La obra ha sido eliminada", "success")
    } catch (err) {
      Swal.fire("Error", err.message || "Fallo al eliminar", "error")
    }
  }

  const handleEdit = (obra) => {
    setIsEditing(true)
    setEditId(obra.id)
    setName(obra.name)
    setDescription(obra.description)
    setLocation(obra.location)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsEditing(false)
    setEditId(null)
    setName("")
    setDescription("")
    setLocation("")
    setIsModalOpen(false)
  }

  const StatsSection = () => {
    const totalObras = obras.length

    const stats = [
      {
        title: "Total Obras",
        value: pagination.totalItems || totalObras,
        icon: Package,
        color: "bg-blue-500",
        textColor: "text-blue-600",
      },
      {
        title: "Página Actual",
        value: `${pagination.currentPage}/${pagination.totalPages}`,
        icon: TrendingUp,
        color: "bg-purple-500",
        textColor: "text-purple-600",
      },
      {
        title: "Por Página",
        value: limitOption === "all" ? "Todos" : limitOption,
        icon: AlertTriangle,
        color: "bg-orange-500",
        textColor: "text-orange-600",
      },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {isAdmin && stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
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

  const ObraCard = ({ obra }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="p-6 pb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{obra.name}</h3>
        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="text-sm">{obra.location}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <FileText className="w-4 h-4 mr-2" />
          <span className="text-sm">{obra.description}</span>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between items-center">
        <span className="text-xs text-gray-500">Obra #{obra.id}</span>
        {isAdmin && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleEdit(obra)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              title="Editar obra"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(obra.id)}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Eliminar obra"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Cargando obras...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Obras</h1>
          <p className="text-gray-600 mt-1">Administra y monitorea todas tus obras</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaCirclePlus className="w-5 h-5 mr-2" />
            Nueva Obra
          </button>
        )}
      </div>

      <StatsSection />

      {isAdmin && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar obras..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setLoading(true)
              }}
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
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {obras.map((obra) => (
              <ObraCard key={obra.id} obra={obra} />
            ))}
          </div>

          {obras.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron obras</h3>
              <p className="text-gray-600">
                {searchTerm ? "Intenta ajustar los filtros de búsqueda" : "Comienza creando tu primera obra"}
              </p>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
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
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{isEditing ? "Editar Obra" : "Nueva Obra"}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-gray-400 hover:text-gray-600 text-xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 inline mr-1" />
                  Nombre de la Obra *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre de la obra"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Descripción *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción de la obra"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Ubicación *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ubicación de la obra"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? "Actualizar" : "Crear"} Obra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ObrasPage


