"use client"

import React, { useEffect, useState } from "react"
import { FaCirclePlus } from "react-icons/fa6"
import { User, Mail, HardHat, Shield, Search, Users, UserCheck, UserX, Edit, Trash2, Eye } from 'lucide-react'
import { useAuthFlags } from "../../../hooks/useAuth"
import { useUser } from "../../../hooks/useUser"
import { useDebounce } from "../../../hooks/customHooks"
import { useObras } from "../../../hooks/useObras"
import { useAlmacenes } from "../../../hooks/useAlmacenes"
import Swal from "sweetalert2"

function UsersPage() {
  const [isUserFormOpen, setIsUserFormOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const { canCreateUsers, canDeleteUsers, canEditUsers } = useAuthFlags()

  const [isEditing, setIsEditing] = useState(false)
  const [editUserId, setEditUserId] = useState(null)

  const { listUsers, createUser, listRoles, deleteUser, updateUser } = useUser()

  const [loading, setLoading] = useState(false)

  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  })

  const [page, setPage] = useState(1)
  const [limitOption, setLimitOption] = useState("5")
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const limit = limitOption === "all" ? pagination.totalItems || 0 : Number.parseInt(limitOption, 10)

  // Persist the roles after update
  const [originalRoles, setOriginalRoles] = useState([])

  // Select obras
  const [obras, setObras] = useState([])
  const [selectedObra, setSelectedObra] = useState("")

  // Select almacenes
  const [almacenes, setAlmacenes] = useState([])
  const [selectedAlmacen, setSelectedAlmacen] = useState("")

  // Fields for the form
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Roles
  const [roleOptions, setRoleOptions] = useState([])
  const [selectedRole, setSelectedRol] = useState("")

  const { listObras } = useObras()
  const { listAlmacenes } = useAlmacenes()

  useEffect(() => {
    if (selectedRole) {
      const roleObj = roleOptions.find(r => r.id === selectedRole)
      console.log("Role Object:", roleObj) // Ver el rol completo
      console.log("Role Name:", roleObj?.name)
      const roleNameLower = roleObj?.name?.toLowerCase()
      console.log("Role Name Lower:", roleNameLower)

      if (roleNameLower === "operador") {
        listObras({ limit: 0 })
          .then(res => setObras(res.data.data))
          console.log("Almacenes response:", res) 
          .catch(err => console.error("Error fetching obras", err))
      } else if (roleNameLower === "admin conta") {
        listAlmacenes({ limit: 0 })
          .then(res => setAlmacenes(res.data.data))
          .catch(err => console.error("Error fetching almacenes", err))
      }
    }
  }, [selectedRole, roleOptions])

  // Fetch roles
  useEffect(() => {
    setLoading(true)
    listRoles()
      .then((res) => {
        setRoleOptions(res.data)
      })
      .catch((err) => {
        console.log(err)
        Swal.fire({
          title: "Error",
          text: err.message || "Fallo al traer roles",
          icon: "error",
          confirmButtonColor: "#1F2937",
          confirmButtonText: "Ok",
        })
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearchTerm])

  // Fetch users
  useEffect(() => {
    setLoading(true)
    listUsers({
      page,
      limit,
      search: debouncedSearchTerm,
      order: "ASC",
    })
      .then((res) => {
        setUsers(res.data.data)
        setPagination(res.data.meta)
      })
      .catch((err) => {
        console.log(err)
        Swal.fire({
          title: "Error",
          text: err.message || "Fallo al traer usuarios",
          icon: "error",
          confirmButtonColor: "#1F2937",
          confirmButtonText: "Ok",
        })
      })
      .finally(() => setLoading(false))
  }, [page, limit, debouncedSearchTerm])

  const toggleUsersModal = () => setIsUserFormOpen(!isUserFormOpen)

  const handleImageChange = (e) => {
    const file = e.target.files[0]

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewImage(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      Swal.fire({
        title: "Error",
        text: "Las contrasenas no coinciden",
        icon: "error",
        confirmButtonColor: "#1F2937",
        confirmButtonText: "Ok",
      })
      return
    }

    const rolesToSend = isEditing ? originalRoles : selectedRole ? [selectedRole] : []

    // Get the role name for the insert
    const roleName = rolesToSend.map((rid) => {
      const found = roleOptions.find((r) => r.id === rid)
      return found ? found.name : rid
    })

    const roleObj = roleOptions.find(r => r.id === selectedRole)
    const isOperador = roleObj?.name?.toLowerCase() === "operador"
    const isContador = roleObj?.name?.toLowerCase() === "admin conta"

    const basePayload = {
      name,
      email,
      password,
      image: "",
    }

    const payload = {
      ...basePayload,
      ...(!isEditing && {
        roles: rolesToSend,
      }),
      ...(isOperador && { obraId: Number(selectedObra) }),
      ...(isContador && { almacenId: Number(selectedAlmacen) }),
    }

    try {
      if (isEditing) {
        try {
          const { data: updatedUser } = await updateUser(editUserId, payload)
          Swal.fire({
            title: "Usuario actualizado",
            icon: "success",
            confirmButtonColor: "#1F2937",
          }).then(() => {
            setUsers((users) =>
              users.map((u) =>
                u.id === updatedUser.id ? { ...updatedUser, roles: updatedUser.roles ?? rolesToSend } : u,
              ),
            )
            clearForm()
          })
        } catch (err) {
          console.log(err?.response?.data)
          Swal.fire({
            title: "Error",
            text: err?.response?.data?.message || "Fallo al registrar usuario",
            icon: "error",
            confirmButtonColor: "#1F2937",
            confirmButtonText: "Ok",
          })
        }
      } else {
        try {
          console.log(payload)
          const { data: newUser } = await createUser(payload)
          Swal.fire({
            title: "¡Nuevo Usuario!",
            text: "Se ha registrado un nuevo usuario",
            icon: "success",
            confirmButtonColor: "#1F2937",
            confirmButtonText: "Ok",
          }).then(() => {
            setUsers((prevUsers) => [
              {
                ...newUser,
                roles: roleName,
              },
              ...prevUsers,
            ])

            clearForm()
          })
        } catch (err) {
          Swal.fire({
            title: "Error",
            text: err?.response?.data?.message || "Fallo al registrar usuario",
            icon: "error",
            confirmButtonColor: "#1F2937",
            confirmButtonText: "Ok",
          })
        }
      }
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "Fallo al registrar usuario",
        icon: "error",
        confirmButtonColor: "#1F2937",
        confirmButtonText: "Ok",
      })
    }

    setIsUserFormOpen(!isUserFormOpen)
  }

  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    })

    if (!result.isConfirmed) return

    deleteUser(id)
      .then(() => {
        Swal.fire({
          title: "¡Usuario Eliminado Correctamente!",
          text: "El usuario ha sido eliminado",
          icon: "success",
          confirmButtonColor: "#1F2937",
          confirmButtonText: "Ok",
        }).then(() => {
          // Get rid of the user in the UI
          setUsers((current) => current.filter((user) => user.id !== id))
        })
      })
      .catch((err) => {
        Swal.fire({
          title: "Error",
          text: err.message || "Fallo al eliminar usuario",
          icon: "error",
          confirmButtonColor: "#1F2937",
          confirmButtonText: "Ok",
        })
      })
  }

  const handleEditUser = (user) => {
    setIsEditing(true)

    setOriginalRoles(user.roles || [])

    // Find the role that belongs to the user to edit
    const role = user.roles?.[0] ?? ""
    const match = roleOptions.find((r) => r.name === role)

    setEditUserId(user.id)
    setName(user.name)
    setEmail(user.email)
    setSelectedRol(match?.id ?? "")
    setPassword("")
    setConfirmPassword("")
    setPreviewImage("")
    setIsUserFormOpen(true)
    if (user.obraId) {
      setSelectedObra(user.obraId)
    }
    if (user.almacenId) {
      setSelectedAlmacen(user.almacenId)
    }
  }

  const handleCloseModal = () => {
    setIsEditing(false)
    setIsUserFormOpen(!isUserFormOpen)
    clearForm()
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setLoading(true)
  }

  const clearForm = () => {
    setName("")
    setPassword("")
    setConfirmPassword("")
    setEmail("")
    setSelectedRol("")
    setSelectedObra("")
    setSelectedAlmacen("")
  }

  // Componente de estadísticas
  const StatsSection = () => {
    const totalUsers = users.length
    const activeUsers = users.filter((u) => u.isActive).length
    const inactiveUsers = users.filter((u) => !u.isActive).length

    const stats = [
      {
        title: "Total Usuarios",
        value: pagination.totalItems || totalUsers,
        icon: Users,
        color: "bg-blue-500",
        textColor: "text-blue-600",
      },
      {
        title: "Usuarios Activos",
        value: activeUsers,
        icon: UserCheck,
        color: "bg-green-500",
        textColor: "text-green-600",
      },
      {
        title: "Usuarios Inactivos",
        value: inactiveUsers,
        icon: UserX,
        color: "bg-red-500",
        textColor: "text-red-600",
      },
      {
        title: "Por Página",
        value: limitOption === "all" ? "Todos" : limitOption,
        icon: Eye,
        color: "bg-purple-500",
        textColor: "text-purple-600",
      },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
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

  // Componente de loading
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Cargando usuarios...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600 mt-1">
              Administra usuarios, roles y permisos del sistema
            </p>
          </div>
          {canCreateUsers && (
            <button
              onClick={toggleUsersModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaCirclePlus className="w-5 h-5 mr-2" />
              Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsSection />

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
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
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.image ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={user.image || "/placeholder.svg"}
                                  alt={user.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.roles || "Sin rol"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {canEditUsers && (
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Editar usuario"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteUsers && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No se encontraron usuarios
                        </h3>
                        <p className="text-gray-600">
                          {searchTerm
                            ? "Intenta ajustar los filtros de búsqueda"
                            : "Comienza creando tu primer usuario"}
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

      {/* Modal */}
      {isUserFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-gray-400 hover:text-gray-600 text-xl">
                  &times;
                </span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Escribe el nombre"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Escribe el email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Escribe la contraseña"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar contraseña"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Roles
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRol(e.target.value)}
                  disabled={isEditing}
                  required
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isEditing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {!isEditing && (
                    <option value="" disabled>
                      — Selecciona un rol —
                    </option>
                  )}

                  {roleOptions.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const selectedRoleObj = roleOptions.find(
                  r => r.id === selectedRole
                )
                if (selectedRoleObj?.name?.toLowerCase() === "operador") {
                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <HardHat className="w-4 h-4 inline mr-1" />
                        Obra
                      </label>
                      <select
                        value={selectedObra}
                        onChange={(e) => setSelectedObra(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="" disabled>
                          — Selecciona una obra —
                        </option>
                        {obras.map((obra) => (
                          <option key={obra.id} value={obra.id}>
                            {obra.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                }
                return null
              })()}

              {(() => {
                const selectedRoleObj = roleOptions.find(
                  r => r.id === selectedRole
                )
                if (selectedRoleObj?.name?.toLowerCase() === "admin conta") {
                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <HardHat className="w-4 h-4 inline mr-1" />
                        Almacén
                      </label>
                      <select
                        value={selectedAlmacen}
                        onChange={(e) => setSelectedAlmacen(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="" disabled>
                          — Selecciona un almacén —
                        </option>
                        {almacenes.map((almacen) => (
                          <option key={almacen.id} value={almacen.id}>
                            {almacen.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                }
                return null
              })()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen de perfil
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />

                {previewImage && (
                  <div className="mt-4">
                    <img
                      src={previewImage || "/placeholder.svg"}
                      alt="Preview"
                      className="h-24 w-auto rounded-lg object-cover border border-gray-300"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
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
                  {isEditing ? "Actualizar" : "Crear"} Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
