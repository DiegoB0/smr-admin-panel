"use client"

import React, { useEffect, useState } from "react";
import { FaCirclePlus } from "react-icons/fa6";
import Swal from "sweetalert2";
import { useDebounce } from "../../hooks/customHooks";
import { useAuthFlags } from "../../hooks/useAuth";
import {
  Truck, Hash, Tag, Clipboard,
  Search, Edit, Trash2, CheckCircle2, Wrench, AlertTriangle
} from "lucide-react";

import { useEquipos } from "../../hooks/useEquipos";

function EquiposPage() {
  const { canCreateUsers, canDeleteUsers, canEditUsers } = useAuthFlags();
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const { listEquipos, createEquipo, getOneEquipo, deleteEquipo, updateEquipo } = useEquipos();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("5");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  });

  // Form fields
  const [tipoEquipo, setTipoEquipo] = useState("");
  const [numeroEconomico, setNumeroEconomico] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [estatus, setEstatus] = useState("Activo");

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const clearForm = () => {
    setTipoEquipo("");
    setNumeroEconomico("");
    setModelo("");
    setSerie("");
    setEstatus("Activo");
    setEditId(null);
  };

  const handleCloseModal = () => {
    setIsEditing(false);
    toggleModal();
    clearForm();
  };

  const fetchEquipos = async () => {
    setLoading(true);
    try {
      const response = await listEquipos({ page, limit: limitOption, search: debouncedSearch });
      setEquipos(response.data.data);
      setPagination(response.data.meta);
    } catch (err) {
      Swal.fire("Error", "Fallo al cargar equipos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    fetchEquipos();
  }, [page, limitOption, debouncedSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { equipo: tipoEquipo, no_economico: numeroEconomico, modelo, serie };

    try {
      if (isEditing) {
        await updateEquipo(editId, payload);
        Swal.fire("Actualizado", "Equipo actualizado con éxito", "success");
      } else {
        const { data: newEquipo } = await createEquipo(payload);
        setEquipos((prev) => [newEquipo, ...prev]);
        Swal.fire("Registrado", "Equipo agregado con éxito", "success");
      }
      handleCloseModal();
      fetchEquipos();
    } catch (err) {
      Swal.fire("Error", err.message || "Ocurrió un error", "error");
    }
  };

  const handleEdit = async (equipo) => {
    setIsEditing(true);
    setEditId(equipo.id);
    setTipoEquipo(equipo.equipo);
    setNumeroEconomico(equipo.no_economico);
    setModelo(equipo.modelo);
    setSerie(equipo.serie);
    setEstatus(equipo.isActive ? "Activo" : "Caído");
    toggleModal();
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar?",
      text: "No podrás revertir esta acción",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteEquipo(id);
      setEquipos((prev) => prev.filter(e => e.id !== id));
      Swal.fire("Eliminado", "Equipo eliminado con éxito", "success");
    } catch (err) {
      Swal.fire("Error", "Fallo al eliminar equipo", "error");
    }
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const renderEstatus = (estatus) => {
    switch (estatus) {
      case "Activo":
        return <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-4 h-4" /> Activo</span>;
      case "En reparación":
        return <span className="flex items-center gap-1 text-yellow-600"><Wrench className="w-4 h-4" /> Reparación</span>;
      case "Caído":
        return <span className="flex items-center gap-1 text-red-600"><AlertTriangle className="w-4 h-4" /> Caído</span>;
      default:
        return estatus;
    }
  };

  // --------- Stats ----------
  const StatsSection = () => {
    const activos = equipos.filter(e => e.isActive).length;
    const caidos = equipos.filter(e => !e.isActive).length;

    const stats = [
      { title: "Total Equipos", value: pagination.totalItems, icon: Truck, color: "bg-blue-500", textColor: "text-blue-600" },
      { title: "Activos", value: activos, icon: CheckCircle2, color: "bg-green-500", textColor: "text-green-600" },
      { title: "Caídos", value: caidos, icon: AlertTriangle, color: "bg-red-500", textColor: "text-red-600" },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{s.title}</p>
                <p className={`text-2xl font-bold ${s.textColor}`}>{s.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${s.color}`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Equipos</h1>
          <p className="text-gray-600 mt-1">Administra tu flota de maquinaria y vehículos</p>
        </div>
        {canCreateUsers && (
          <button
            onClick={toggleModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaCirclePlus className="w-5 h-5 mr-2" />
            Nuevo Equipo
          </button>
        )}
      </div>

      {/* Stats */}
      <StatsSection />

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar..."
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número Económico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estatus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipos.length > 0 ? (
                equipos.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm">{e.id}</td>
                    <td className="px-6 py-4 text-sm">{e.equipo}</td>
                    <td className="px-6 py-4 text-sm">{e.no_economico}</td>
                    <td className="px-6 py-4 text-sm">{e.modelo}</td>
                    <td className="px-6 py-4 text-sm">{e.serie}</td>
                    <td className="px-6 py-4 text-sm">{renderEstatus(e.isActive ? "Activo" : "Caído")}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        {canEditUsers && (
                          <button onClick={() => handleEdit(e)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDeleteUsers && (
                          <button onClick={() => handleDelete(e.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">No hay equipos registrados</td>
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
            className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-600">Página {pagination.currentPage} de {pagination.totalPages}</span>
          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleCloseModal}>
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{isEditing ? "Editar Equipo" : "Nuevo Equipo"}</h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <span className="text-gray-400 hover:text-gray-600 text-xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Truck className="w-4 h-4 inline mr-1" /> Equipo *
                </label>
                <input type="text" value={tipoEquipo} onChange={(e) => setTipoEquipo(e.target.value)} required
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" /> Número Económico *
                </label>
                <input type="text" value={numeroEconomico} onChange={(e) => setNumeroEconomico(e.target.value)} required
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" /> Modelo *
                </label>
                <input type="text" value={modelo} onChange={(e) => setModelo(e.target.value)} required
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clipboard className="w-4 h-4 inline mr-1" /> Serie *
                </label>
                <input type="text" value={serie} onChange={(e) => setSerie(e.target.value)} required
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estatus *</label>
                <select value={estatus} onChange={(e) => setEstatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option>Activo</option>
                  <option>En reparación</option>
                  <option>Caído</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-6 border-t border-gray-200">
                <button type="button" onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {isEditing ? "Actualizar" : "Crear"} Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EquiposPage;
