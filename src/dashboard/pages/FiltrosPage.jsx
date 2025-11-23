"use client"

import React, { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Edit2,
  Search,
  AlertTriangle,
} from "lucide-react";
import { useFiltros } from "../../hooks/useFiltros";
import Swal from "sweetalert2";
import { useDebounce } from "../../hooks/customHooks";

export const FiltrosPage = () => {
  const {
    listCategoriaFiltros,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    getFiltrosByCategoria,
    addFiltros,
    updateFiltro,
    deleteFiltro,
  } = useFiltros();

  const REQUERIMIENTOS = [250, 500, 1000, 2000];

  // Estados categorías
  const [categorias, setCategorias] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [loading, setLoading] = useState(false);

  // Estados requerimientos y filtros
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [selectedHrs, setSelectedHrs] = useState("");
  const [filtros, setFiltros] = useState([]);
  const [filtrosLoading, setFiltrosLoading] = useState(false);

  // Estados formularios
  const [isCreateCategoriaModalOpen, setIsCreateCategoriaModalOpen] =
    useState(false);
  const [isAddFiltrosModalOpen, setIsAddFiltrosModalOpen] = useState(false);
  const [isEditCategoriaModalOpen, setIsEditCategoriaModalOpen] =
    useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailFiltro, setSelectedDetailFiltro] = useState(null);

  const [newCategoriaName, setNewCategoriaName] = useState("");
  const [editCategoriaName, setEditCategoriaName] = useState("");
  const [newFiltros, setNewFiltros] = useState([
    {
      numero: "",
      equivalente: "",
      descripcion: "",
      cantidad: 1,
      unidad: "",
    },
  ]);
  const [editingFiltro, setEditingFiltro] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchCategorias();
  }, [page, debouncedSearch]);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const res = await listCategoriaFiltros({
        page,
        limit: 10,
        search: debouncedSearch,
        order: "ASC",
      });
      setCategorias(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire(
        "Error",
        "Error al cargar categorías",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategoria = (categoria) => {
    setSelectedCategoria(categoria);
    setSelectedHrs("");
    setFiltros([]);
    setIsEditCategoriaModalOpen(false);
    setIsAddFiltrosModalOpen(false);
    setEditingFiltro(null);
  };

  const handleCreateCategoria = async () => {
    if (!newCategoriaName.trim()) {
      Swal.fire("Error", "Ingresa el nombre de la categoría", "error");
      return;
    }

    setFormLoading(true);
    try {
      await createCategoria(newCategoriaName);
      Swal.fire("Éxito", "Categoría creada exitosamente", "success");
      setNewCategoriaName("");
      setIsCreateCategoriaModalOpen(false);
      setPage(1);
      fetchCategorias();
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "Error al crear categoría", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateCategoria = async () => {
    if (!editCategoriaName.trim()) {
      Swal.fire("Error", "Ingresa el nombre de la categoría", "error");
      return;
    }

    setFormLoading(true);
    try {
      await updateCategoria(selectedCategoria.id, editCategoriaName);
      Swal.fire("Éxito", "Categoría actualizada", "success");
      setIsEditCategoriaModalOpen(false);
      fetchCategorias();
      setSelectedCategoria(null);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "Error al actualizar categoría", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCategoria = async () => {
    const confirm = await Swal.fire({
      title: "¿Eliminar categoría?",
      text: `Se eliminará "${selectedCategoria.nombre}" y todos sus filtros`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    setFormLoading(true);
    try {
      await deleteCategoria(selectedCategoria.id);
      Swal.fire("Éxito", "Categoría eliminada", "success");
      fetchCategorias();
      setSelectedCategoria(null);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "Error al eliminar categoría", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSelectHrs = async (hrsValue) => {
    setSelectedHrs(hrsValue);
    setFiltros([]);
    setIsAddFiltrosModalOpen(false);
    setEditingFiltro(null);

    setFiltrosLoading(true);
    try {
      const res = await getFiltrosByCategoria(selectedCategoria.id, hrsValue);
      const items = res.data.items || [];
      setFiltros(items);
    } catch (error) {
      console.error("Error al obtener filtros:", error);
      Swal.fire("Error", "Error al obtener filtros", "error");
    } finally {
      setFiltrosLoading(false);
    }
  };

  const handleAddFiltro = () => {
    setNewFiltros([
      ...newFiltros,
      {
        numero: "",
        equivalente: "",
        descripcion: "",
        cantidad: 1,
        unidad: "",
      },
    ]);
  };

  const handleRemoveFiltro = (index) => {
    setNewFiltros(newFiltros.filter((_, i) => i !== index));
  };

  const handleUpdateFiltroForm = (index, field, value) => {
    const updated = [...newFiltros];
    updated[index][field] = value;
    setNewFiltros(updated);
  };

  const handleSubmitFiltros = async () => {
    if (!selectedCategoria || !selectedHrs) {
      Swal.fire(
        "Error",
        "Selecciona categoría y requerimiento",
        "error"
      );
      return;
    }

    if (
      newFiltros.some(
        (f) => !f.numero || !f.descripcion || !f.unidad
      )
    ) {
      Swal.fire(
        "Error",
        "Completa: número, descripción y unidad (equivalente es opcional)",
        "error"
      );
      return;
    }

    setFormLoading(true);
    try {
      await addFiltros(selectedCategoria.id, selectedHrs, newFiltros);
      Swal.fire("Éxito", "Filtros creados exitosamente", "success");
      setNewFiltros([
        {
          numero: "",
          equivalente: "",
          descripcion: "",
          cantidad: 1,
          unidad: "",
        },
      ]);
      setIsAddFiltrosModalOpen(false);
      handleSelectHrs(selectedHrs);
    } catch (error) {
      console.error("Error completo:", error);
      Swal.fire("Error", "Error al crear filtros", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditFiltro = (filtro) => {
    setEditingFiltro({ ...filtro });
  };

  const handleSaveEditFiltro = async () => {
    if (
      !editingFiltro.numero ||
      !editingFiltro.descripcion ||
      !editingFiltro.unidad
    ) {
      Swal.fire(
        "Error",
        "Completa: número, descripción y unidad",
        "error"
      );
      return;
    }

    setFormLoading(true);
    try {
      await updateFiltro(editingFiltro.id, {
        numero: editingFiltro.numero,
        equivalente: editingFiltro.equivalente,
        descripcion: editingFiltro.descripcion,
        cantidad: editingFiltro.cantidad,
        unidad: editingFiltro.unidad,
      });
      Swal.fire("Éxito", "Filtro actualizado", "success");
      setEditingFiltro(null);
      handleSelectHrs(selectedHrs);
    } catch (error) {
      console.error("Error al actualizar:", error);
      Swal.fire("Error", "Error al actualizar filtro", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteFiltro = async (filtroId) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar filtro?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    setFormLoading(true);
    try {
      await deleteFiltro(filtroId);
      Swal.fire("Éxito", "Filtro eliminado", "success");
      handleSelectHrs(selectedHrs);
    } catch (error) {
      console.error("Error al eliminar:", error);
      Swal.fire("Error", "Error al eliminar filtro", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // Componentes reutilizables
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  );

  const Detail = ({ label, value }) => (
    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value || "N/A"}</p>
    </div>
  );

  const Th = ({ children }) => (
    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {children}
    </th>
  );

  const Td = ({ children }) => (
    <td className="px-4 py-2 text-sm text-gray-700">{children}</td>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Filtros
          </h1>
          <p className="text-gray-600 mt-1">
            Administra categorías y filtros por requerimiento
          </p>
        </div>
        <button
          onClick={() => setIsCreateCategoriaModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Categoría
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar categoría..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Grid de categorías */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {categorias.length > 0 ? (
              categorias.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleSelectCategoria(cat)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCategoria?.id === cat.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-green-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {cat.nombre}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">ID: {cat.id}</p>
                    </div>
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay categorías registradas</p>
              </div>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mb-8">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-gray-600">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Detalles de categoría seleccionada */}
      {selectedCategoria && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCategoria.nombre}
              </h2>
              <p className="text-gray-600 mt-1">
                Gestiona los filtros para cada requerimiento
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditCategoriaModalOpen(true);
                  setEditCategoriaName(selectedCategoria.nombre);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={handleDeleteCategoria}
                disabled={formLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>

          {/* Requerimientos */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Requerimientos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {REQUERIMIENTOS.map((hrs) => (
                <button
                  key={hrs}
                  onClick={() => handleSelectHrs(hrs)}
                  className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                    selectedHrs === hrs
                      ? "border-green-500 bg-green-50 text-green-900"
                      : "border-gray-200 bg-white text-gray-700 hover:border-green-300"
                  }`}
                >
                  {hrs} HRS
                </button>
              ))}
            </div>
          </div>

          {/* Filtros */}
          {selectedHrs && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">
                  Filtros - {selectedHrs} HRS
                </h3>
                <button
                  onClick={() => setIsAddFiltrosModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Filtros
                </button>
              </div>

              {filtrosLoading ? (
                <LoadingSpinner />
              ) : filtros.length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <Th>Número</Th>
                          <Th>Equivalente</Th>
                          <Th>Descripción</Th>
                          <Th>Cantidad</Th>
                          <Th>Unidad</Th>
                          <Th>Acciones</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filtros.map((filtro) => (
                          <tr key={filtro.id} className="hover:bg-gray-50">
                            <Td className="font-medium">{filtro.numero}</Td>
                            <Td>{filtro.equivalente || "-"}</Td>
                            <Td>{filtro.descripcion}</Td>
                            <Td>{filtro.cantidad}</Td>
                            <Td>{filtro.unidad}</Td>
                            <Td>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditFiltro(filtro)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteFiltro(filtro.id)
                                  }
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    No hay filtros para este requerimiento
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal - Crear categoría */}
      {isCreateCategoriaModalOpen && (
        <ModalCreateCategoria
          isOpen={isCreateCategoriaModalOpen}
          onClose={() => setIsCreateCategoriaModalOpen(false)}
          onSubmit={handleCreateCategoria}
          value={newCategoriaName}
          onChange={setNewCategoriaName}
          loading={formLoading}
        />
      )}

      {/* Modal - Editar categoría */}
      {isEditCategoriaModalOpen && (
        <ModalEditCategoria
          isOpen={isEditCategoriaModalOpen}
          onClose={() => setIsEditCategoriaModalOpen(false)}
          onSubmit={handleUpdateCategoria}
          value={editCategoriaName}
          onChange={setEditCategoriaName}
          loading={formLoading}
        />
      )}

      {/* Modal - Agregar filtros */}
      {isAddFiltrosModalOpen && (
        <ModalAddFiltros
          isOpen={isAddFiltrosModalOpen}
          onClose={() => setIsAddFiltrosModalOpen(false)}
          filtros={newFiltros}
          onAddFiltro={handleAddFiltro}
          onRemoveFiltro={handleRemoveFiltro}
          onUpdateFiltro={handleUpdateFiltroForm}
          onSubmit={handleSubmitFiltros}
          loading={formLoading}
        />
      )}

      {/* Modal - Editar filtro */}
      {editingFiltro && (
        <ModalEditFiltro
          isOpen={!!editingFiltro}
          onClose={() => setEditingFiltro(null)}
          filtro={editingFiltro}
          onUpdate={(field, value) =>
            setEditingFiltro({ ...editingFiltro, [field]: value })
          }
          onSubmit={handleSaveEditFiltro}
          loading={formLoading}
        />
      )}
    </div>
  );
};

// Modal Components
const ModalCreateCategoria = ({
  isOpen,
  onClose,
  onSubmit,
  value,
  onChange,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-green-50 text-green-600">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Nueva Categoría
              </h2>
              <p className="text-xs text-gray-500">
                Se crearán automáticamente los 4 requerimientos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la categoría <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Tractores Komatsu"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ModalEditCategoria = ({
  isOpen,
  onClose,
  onSubmit,
  value,
  onChange,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 text-blue-600">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Editar Categoría
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la categoría <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ModalAddFiltros = ({
  isOpen,
  onClose,
  filtros,
  onAddFiltro,
  onRemoveFiltro,
  onUpdateFiltro,
  onSubmit,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-green-50 text-green-600">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Agregar Filtros
              </h2>
              <p className="text-xs text-gray-500">
                Puedes agregar uno o varios filtros a la vez
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {filtros.map((filtro, idx) => (
            <div
              key={idx}
              className="relative border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <button
                type="button"
                onClick={() => onRemoveFiltro(idx)}
                className="absolute -top-3 -right-3 p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 shadow"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. FILT-001"
                    value={filtro.numero}
                    onChange={(e) =>
                      onUpdateFiltro(idx, "numero", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equivalente (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. REF-456"
                    value={filtro.equivalente}
                    onChange={(e) =>
                      onUpdateFiltro(idx, "equivalente", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Filtro de aire"
                    value={filtro.descripcion}
                    onChange={(e) =>
                      onUpdateFiltro(idx, "descripcion", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={filtro.cantidad}
                    onChange={(e) =>
                      onUpdateFiltro(idx, "cantidad", parseInt(e.target.value) || 1)
                    }
                    min={1}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. pieza"
                    value={filtro.unidad}
                    onChange={(e) =>
                      onUpdateFiltro(idx, "unidad", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={onAddFiltro}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition"
          >
            <Plus className="w-4 h-4" />
            Agregar otra fila
          </button>
        </div>

        <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 px-6 py-4 flex justify-end gap-2 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Filtros"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ModalEditFiltro = ({
  isOpen,
  onClose,
  filtro,
  onUpdate,
  onSubmit,
  loading,
}) => {
  if (!isOpen || !filtro) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 text-blue-600">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Editar Filtro
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="px-6 py-5 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={filtro.numero}
                onChange={(e) => onUpdate("numero", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equivalente (opcional)
              </label>
              <input
                type="text"
                value={filtro.equivalente || ""}
                onChange={(e) => onUpdate("equivalente", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={filtro.descripcion}
                onChange={(e) => onUpdate("descripcion", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={filtro.cantidad}
                onChange={(e) =>
                  onUpdate("cantidad", parseInt(e.target.value) || 1)
                }
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={filtro.unidad}
                onChange={(e) => onUpdate("unidad", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FiltrosPage;
