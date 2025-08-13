"use client"

import React, { useEffect, useState } from "react"
import { Eye } from 'lucide-react';
import { FaCirclePlus } from "react-icons/fa6"
import Swal from "sweetalert2"
import { useDebounce } from "../../hooks/customHooks"
import { useProductos } from "../../hooks/useProductos"
import { useAuthFlags } from "../../hooks/useAuth"
import { Package, DollarSign, Tag, AlignLeft, Ruler, Image, Search, Box, Edit, Trash2 } from 'lucide-react'

function ReportesOperadorPage() {
  // Hey this is just to rewrite history
  const { listProductos, createProducto, deleteProducto, updateProducto } = useProductos()

  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState(null)

  const [page, setPage] = useState(1)
  const [limitOption, setLimitOption] = useState("5")
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 500)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0, // Added totalItems for stats
  })

  // Form fields
  const [productoId, setProductoId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [unidad, setUnidad] = useState("")
  const [precio, setPrecio] = useState(0)
  const [imageUrl, setImageUrl] = useState("")
  const [previewImage, setPreviewImage] = useState(null)

  const limit = limitOption === "all" ? pagination.totalItems || 0 : Number.parseInt(limitOption)

  const toggleModal = () => setIsModalOpen(!isModalOpen)

  const clearForm = () => {
    setProductoId("")
    setName("")
    setDescription("")
    setUnidad("")
    setPrecio(0)
    setImageUrl("")
    setPreviewImage(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPreviewImage(reader.result)
      reader.readAsDataURL(file)
    } else {
      setPreviewImage(null)
    }
  }

  const handleCloseModal = () => {
    setIsEditing(false)
    toggleModal()
    clearForm()
  }

  const fetchProductos = () => {
    setLoading(true)
    listProductos({ page, limit, search: debouncedSearch, order: "ASC" })
      .then((res) => {
        setProductos(res.data.data)
        setPagination(res.data.meta)
      })
      .catch((err) => {
        Swal.fire("Error", err.message || "Error al cargar productos", "error")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    fetchProductos()
  }, [page, limit, debouncedSearch])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      id: productoId,
      name,
      description,
      unidad,
      precio,
      imageUrl: previewImage || imageUrl,
    }

    const updatePayload = {
      name,
      description,
      unidad,
      precio,
      imageUrl: previewImage || imageUrl,
    }

    try {
      if (isEditing) {
        await updateProducto(editId, updatePayload)
        Swal.fire("Actualizado", "Reporte actualizado con éxito", "success")
      } else {
        await createProducto(payload)
        Swal.fire("Registrado", "Reporte agregado con éxito", "success")
      }
      fetchProductos()
      handleCloseModal()
    } catch (err) {
      console.error(err)
      Swal.fire("Error", err.message || "Ocurrió un error", "error")
    }
  }

  const handleEdit = (producto) => {
    setIsEditing(true)
    setEditId(producto.id)
    setProductoId(producto.id)
    setName(producto.name)
    setPrecio(producto.precio)
    setDescription(producto.description)
    setUnidad(producto.unidad)
    setImageUrl(producto.imageUrl)
    setPreviewImage(producto.imageUrl)
    toggleModal()
  }


  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setLoading(true)
  }

  // Componente de loading
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Cargando productos...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Reportes</h1>
            <p className="text-gray-600 mt-1">Administra tus propios reportes</p>
          </div>
            <button
              onClick={toggleModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaCirclePlus className="w-5 h-5 mr-2" />
              Nuevo Reporte
            </button>
        </div>
      </div>


      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar reportes..."
            value={searchTerm}
            onChange={handleSearchChange}
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

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Modern Table */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Package className="w-4 h-4 inline mr-1" />
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <AlignLeft className="w-4 h-4 inline mr-1" />
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Ruler className="w-4 h-4 inline mr-1" />
                      Unidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Image className="w-4 h-4 inline mr-1" />
                      Imagen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productos.length > 0 ? (
                    productos.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.unidad}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${p.precio || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            src={p.imageUrl || "/placeholder.svg?height=48&width=48&query=product"}
                            alt={p.name || "Producto"}
                            className="h-12 w-12 object-cover rounded-lg mx-auto border border-gray-200"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                              <button
                                onClick={() => console.log(p)}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Mostrar detalles"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(p)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Editar producto"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
                        <p className="text-gray-600">
                          {searchTerm ? "Intenta ajustar los filtros de búsqueda" : "Comienza creando tu primer producto"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
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

      {/* Modal - Mantengo tu modal original con pequeños ajustes visuales */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleCloseModal}>
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{isEditing ? "Editar Reporte" : "Nuevo Reporte"}</h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-gray-400 hover:text-gray-600 text-xl">&times;</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    ID (Refacción) *
                  </label>
                  <input
                    type="text"
                    value={productoId}
                    onChange={(e) => setProductoId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 inline mr-1" />
                  Nombre *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlignLeft className="w-4 h-4 inline mr-1" />
                  Descripción
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Ruler className="w-4 h-4 inline mr-1" />
                  Unidad
                </label>
                <input
                  type="text"
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Precio
                </label>
                <input
                  type="text"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Image className="w-4 h-4 inline mr-1" />
                  Imagen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {previewImage && (
                  <img
                    src={previewImage || "/placeholder.svg"}
                    alt="Preview"
                    className="h-24 mt-2 rounded-lg object-cover border border-gray-300"
                  />
                )}
              </div>
              <div className="flex justify-end gap-2 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? "Actualizar" : "Crear"} Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportesOperadorPage

