"use client";

import React, { useEffect, useState, useRef } from "react";
import { Truck, Eye, Award, FileText, Package, ClipboardList, Hash, Search, CircleCheck, CircleX, Timer } from "lucide-react";
import { FaCirclePlus } from "react-icons/fa6";
import Swal from "sweetalert2";
import { COMPONENTE_KEYS, FASE_KEYS } from "../../types/reportes.types";
import { useDebounce } from "../../hooks/customHooks";
import { useRequisiciones } from "../../hooks/useRequisiciones";
import { useProductos } from "../../hooks/useProductos";
import { useEquipos } from "../../hooks/useEquipos";
import { useSelector } from "react-redux";

// Componente SearchableSelect personalizado
function SearchableSelect({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Buscar...", 
  displayKey = "name",
  valueKey = "id",
  className = "",
  required = false,
  "aria-label": ariaLabel 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filtrar opciones basado en el término de búsqueda
  const filteredOptions = options.filter(option => 
    option[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option[valueKey]?.toString().includes(searchTerm)
  );

  // Encontrar la opción seleccionada cuando cambia el valor
  useEffect(() => {
    const option = options.find(opt => opt[valueKey] === value || opt[valueKey] === String(value));
    setSelectedOption(option || null);
    if (option) {
      setSearchTerm(`${option[valueKey]} - ${option[displayKey]}`);
    } else if (!value) {
      setSearchTerm("");
    }
  }, [value, options, displayKey, valueKey]);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        // Restaurar el texto si no hay selección válida
        if (selectedOption) {
          setSearchTerm(`${selectedOption[valueKey]} - ${selectedOption[displayKey]}`);
        } else {
          setSearchTerm("");
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption, displayKey, valueKey]);

  const handleInputChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(true);
    
    // Si se borra el input, limpiar la selección
    if (!newSearchTerm.trim()) {
      onChange("");
      setSelectedOption(null);
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setSearchTerm(`${option[valueKey]} - ${option[displayKey]}`);
    onChange(option[valueKey]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // Limpiar el input para facilitar la búsqueda
    setSearchTerm("");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length === 1) {
        handleOptionSelect(filteredOptions[0]);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm pr-10"
        aria-label={ariaLabel}
        required={required}
        autoComplete="off"
      />
      
      {/* Icono de búsqueda/flecha */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        {isOpen ? (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <Search className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Dropdown con opciones */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={option[valueKey]}
                type="button"
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                  index !== filteredOptions.length - 1 ? 'border-b border-gray-100' : ''
                } ${selectedOption && selectedOption[valueKey] === option[valueKey] ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                onClick={() => handleOptionSelect(option)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{option[displayKey]}</div>
                    <div className="text-sm text-gray-500">ID: {option[valueKey]}</div>
                  </div>
                  {selectedOption && selectedOption[valueKey] === option[valueKey] && (
                    <CircleCheck className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 text-center">
              <Search className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              No se encontraron resultados para "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReportesOperadorPage() {
  const userId = useSelector((state) => state.auth.user?.id);
  const { listMyReportes, createReporte } = useRequisiciones();
  const { listProductos } = useProductos();
  const { listEquipos } = useEquipos();

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("5");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedComponentes, setSelectedComponentes] = React.useState([]);
  const [selectedFases, setSelectedFases] = React.useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  });
  const [observaciones, setObservaciones] = useState("");
  const [items, setItems] = useState([{ productoId: "", cantidad: "" }]);
  const [productos, setProductos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [equipoId, setEquipoId] = useState("");

  const limit =
    limitOption === "all" ? pagination.totalItems || 0 : Number.parseInt(limitOption);

  const toggleFormModal = () => setIsFormModalOpen(!isFormModalOpen);
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedReporte(null);
  };

  const clearForm = () => {
    setObservaciones("");
    setEquipoId("");
    setSelectedComponentes([]);
    setSelectedFases([]);
    setItems([{ productoId: "", cantidad: "" }]);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    clearForm();
  };

  function CheckboxPill({ label, checked, onChange }) {
    return (
      <label
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer select-none ${
          checked
            ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-200"
            : "bg-white border-gray-200 text-gray-700"
        }`}
      >
        <input
          type="checkbox"
          className="hidden"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={`w-4 h-4 inline-flex items-center justify-center rounded-full border ${
            checked
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-gray-200 text-transparent"
          }`}
        >
          ✓
        </span>
        <span className="text-sm">{label}</span>
      </label>
    );
  }

  function formatDate(isoString) {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const fetchReportes = () => {
    if (!userId) return;
    setLoading(true);
    const params = {
      page,
      limit,
      search: debouncedSearch,
      order: "ASC",
      userId,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
    };
    listMyReportes(params)
      .then((res) => {
        setReportes(res.data.data);
        setPagination(res.data.meta);
      })
      .catch((err) => {
        Swal.fire("Error", err.message || "Error al cargar reportes", "error");
      })
      .finally(() => setLoading(false));
  };

  const fetchProductos = () => {
    listProductos({ page: 1, limit: 100, order: "ASC" })
      .then((res) => {
        setProductos(res.data.data);
      })
      .catch((err) => {
        console.error("Error cargando productos:", err);
      });
  };

  const fetchEquipos = () => {
    listEquipos({ page: 1, limit: 100, order: "ASC" })
      .then((res) => {
        setEquipos(res.data.data);
      })
      .catch((err) => {
        console.error("Error cargando equipos:", err);
      });
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchReportes();
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    fetchEquipos();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { productoId: "", cantidad: "" }]);
  };

  const handleChangeItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("=== DEBUG FORM SUBMISSION ===");
    console.log("observaciones:", observaciones);
    console.log("equipoId:", equipoId, typeof equipoId);
    console.log("selectedComponentes:", selectedComponentes);
    console.log("selectedFases:", selectedFases);
    console.log("items:", items);
    console.log("==============================");

    if (!observaciones.trim()) {
      Swal.fire("Error", "Las observaciones son requeridas", "error");
      return;
    }

    if (!equipoId || String(equipoId).trim() === "") {
      console.log("❌ Error: equipoId vacío:", equipoId);
      Swal.fire("Error", "El ID del equipo es requerido", "error");
      return;
    }

    if (!selectedComponentes.length) {
      console.log("❌ Error: sin componentes:", selectedComponentes);
      Swal.fire("Error", "Selecciona al menos un componente", "error");
      return;
    }

    if (!selectedFases.length) {
      console.log("❌ Error: sin fases:", selectedFases);
      Swal.fire("Error", "Selecciona al menos una fase", "error");
      return;
    }

    if (items.length === 0) {
      console.log("❌ Error: sin items:", items);
      Swal.fire("Error", "Debes agregar al menos un item", "error");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const { productoId, cantidad } = items[i];
      console.log(`Item ${i + 1}:`, { productoId, cantidad });
      
      if (!productoId || String(productoId).trim() === "") {
        console.log(`❌ Error en item ${i + 1}: productoId vacío`);
        Swal.fire("Error", `El item ${i + 1} no tiene producto seleccionado`, "error");
        return;
      }
      if (!cantidad || isNaN(Number(cantidad)) || Number(cantidad) <= 0) {
        console.log(`❌ Error en item ${i + 1}: cantidad inválida:`, cantidad);
        Swal.fire("Error", `El item ${i + 1} debe tener cantidad mayor a 0`, "error");
        return;
      }
    }

    const payload = {
      observaciones,
      equipoId: String(equipoId),
      componentes: selectedComponentes,
      fases: selectedFases,
      items: items.map((i) => ({
        productoId: String(i.productoId),
        cantidad: Number(i.cantidad),
      })),
    };

    console.log("✅ Payload final:", payload);

    try {
      console.log("🚀 Enviando reporte...");
      await createReporte(payload);
      console.log("✅ Reporte creado exitosamente");
      Swal.fire("Éxito", "Reporte creado correctamente", "success");
      fetchReportes();
      handleCloseFormModal();
    } catch (err) {
      console.error("❌ Error al crear reporte:", err);
      const backendMsg = err.response?.data?.message;
      const errorMessage = Array.isArray(backendMsg)
        ? backendMsg.join(", ")
        : backendMsg || "No se pudo crear el reporte";
      console.log("Error message:", errorMessage);
      Swal.fire("Error", errorMessage, "error");
    }
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
        </svg>
        <p className="mt-4 text-gray-600">Cargando reportes...</p>
      </div>
    </div>
  );

  const StatCard = ({ title, value, color, icon }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 h-28 flex items-center transition-all duration-300 hover:shadow-md animate-fade-in">
      <div className="flex items-center justify-between w-full">
        <div>
          <p className={`text-sm font-medium ${color.text} mb-1`}>{title}</p>
          <p className={`text-2xl font-bold ${color.text}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${color.bg} to-${color.bg.split('-')[1]}-600`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const StatsSection = ({ reportes }) => {
    const total = reportes.length;
    const pendientes = reportes.filter((r) => r.status === "PENDIENTE").length;
    const procesados = reportes.filter((r) => r.status === "PROCESADO").length;
    const aprobados = reportes.filter((r) => r.status === "APROBADO").length;
    const rechazados = reportes.filter((r) => r.status === "RECHAZADO").length;

    const stats = [
      {
        title: "Total Reportes",
        value: total,
        icon: <FileText className="w-8 h-8 text-white" />,
        color: { text: "text-blue-600", bg: "bg-blue-500/90" },
      },
      {
        title: "Procesados",
        value: procesados,
        icon: <Award className="w-8 h-8 text-white" />,
        color: { text: "text-gray-600", bg: "bg-gray-500/90" },
      },
      {
        title: "Aprobados",
        value: aprobados,
        icon: <CircleCheck className="w-8 h-8 text-white" />,
        color: { text: "text-green-600", bg: "bg-green-500/90" },
      },
      {
        title: "Pendientes",
        value: pendientes,
        icon: <Timer className="w-8 h-8 text-white" />,
        color: { text: "text-yellow-600", bg: "bg-yellow-500/90" },
      },
      {
        title: "Rechazados",
        value: rechazados,
        icon: <CircleX className="w-8 h-8 text-white" />,
        color: { text: "text-red-600", bg: "bg-red-500/90" },
      },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Estilos CSS normales */}
      <style>{`
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          letter-spacing: -0.01em;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
        @keyframes scaleIn {
          from { 
            transform: scale(0.95); 
            opacity: 0; 
          }
          to { 
            transform: scale(1); 
            opacity: 1; 
          }
        }
        [data-tooltip] {
          position: relative;
        }
        [data-tooltip]:hover:after {
          content: attr(data-tooltip);
          position: absolute;
          background-color: rgb(31 41 55);
          color: white;
          font-size: 0.75rem;
          border-radius: 0.25rem;
          padding: 0.25rem 0.5rem;
          top: -2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }
      `}</style>
      
      <div className="p-4 sm:p-6 max-w-7xl mx-auto font-inter">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Reportes</h1>
            <p className="text-gray-600 mt-1">Administra tus propios reportes</p>
          </div>
          <button
            onClick={toggleFormModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            aria-label="Crear nuevo reporte"
           
          >
            <FaCirclePlus className="w-5 h-5 mr-2" />
            Nuevo Reporte
          </button>
        </div>

        <StatsSection reportes={reportes} />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar reportes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
              aria-label="Buscar reportes"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            aria-label="Filtrar por estatus"
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
            className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            aria-label="Seleccionar elementos por página"
          >
            <option value="5">5 por página</option>
            <option value="10">10 por página</option>
            <option value="20">20 por página</option>
            <option value="all">Mostrar todos</option>
          </select>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Estatus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Revisado por
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportes.length > 0 ? (
                    reportes.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-gray-50 transition-colors duration-200 odd:bg-gray-50 animate-fade-in"
                      >
                        <td className="px-6 py-5 text-sm text-gray-700">{formatDate(r.fechaCreacion || r.createdAt)}</td>
                        <td className="px-6 py-5 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              r.status === "PENDIENTE"
                                ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800"
                                : r.status === "APROBADO"
                                ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800"
                                : r.status === "PROCESADO"
                                ? "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700"
                                : "bg-gradient-to-r from-red-100 to-red-200 text-red-800"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-700">{r.revisadoPor?.email || "Pendiente"}</td>
                        <td className="px-6 py-5 text-sm flex gap-2">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            onClick={() => {
                              setSelectedReporte(r);
                              setIsDetailModalOpen(true);
                            }}
                            aria-label={`Ver detalles del reporte ${r.id}`}
                            data-tooltip={`Ver detalles`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron reportes</h3>
                        <p className="text-gray-600 mb-4">No hay reportes registrados</p>
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          onClick={toggleFormModal}
                          aria-label="Crear nuevo reporte"
                        >
                          Crear Nuevo Reporte
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!pagination.hasPreviousPage}
              className="px-4 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              aria-label="Página anterior"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-gray-600">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              aria-label="Página siguiente"
            >
              Siguiente
            </button>
            <button
              onClick={() => setPage(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              aria-label="Ir a la última página"
            >
              Última
            </button>
          </div>
        )}

        {isFormModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={handleCloseFormModal}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Nuevo Reporte</h2>
                </div>
                <button
                  onClick={handleCloseFormModal}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Cerrar modal"
                  data-tooltip="Cerrar formulario"
                >
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <ClipboardList className="w-4 h-4 mr-1 text-blue-600" />
                    Observaciones *
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    placeholder="Escribe las observaciones del reporte..."
                    aria-label="Observaciones"
                  />
                </div>
                
                {/* Sección de Equipos con SearchableSelect */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Truck className="w-4 h-4 mr-1 text-blue-600" />
                    Equipo *
                  </label>
                  <SearchableSelect
                    options={equipos}
                    value={equipoId}
                    onChange={setEquipoId}
                    placeholder="Buscar equipo..."
                    displayKey="equipo"
                    valueKey="id"
                    required
                    aria-label="Seleccionar equipo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Componentes (al menos uno) *</label>
                  <div className="flex flex-wrap gap-2">
                    {COMPONENTE_KEYS.map((k) => {
                      const checked = selectedComponentes.includes(k);
                      return (
                        <CheckboxPill
                          key={k}
                          label={k.replace(/_/g, " ")}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fases (al menos una) *</label>
                  <div className="flex flex-wrap gap-2">
                    {FASE_KEYS.map((k) => {
                      const checked = selectedFases.includes(k);
                      return (
                        <CheckboxPill
                          key={k}
                          label={k.replace(/_/g, " ")}
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

                {/* Sección de Items con SearchableSelect para productos */}
                {items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Package className="w-4 h-4 mr-1 text-blue-600" />
                        Producto *
                      </label>
                      <SearchableSelect
                        options={productos}
                        value={item.productoId}
                        onChange={(value) => handleChangeItem(index, "productoId", value)}
                        placeholder="Buscar producto..."
                        displayKey="name"
                        valueKey="id"
                        required
                        aria-label={`Seleccionar producto para el item ${index + 1}`}
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Hash className="w-4 h-4 mr-1 text-blue-600" />
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={item.cantidad}
                        onChange={(e) => handleChangeItem(index, "cantidad", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                        required
                        aria-label={`Cantidad para el item ${index + 1}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      aria-label={`Eliminar item ${index + 1}`}
                      data-tooltip={`Quitar item ${index + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  aria-label="Agregar nuevo item"
                >
                  Agregar otro +
                </button>

                <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-100 px-6 py-4 rounded-b-xl flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseFormModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    aria-label="Cancelar creación de reporte"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    aria-label="Crear reporte"
                  >
                    Crear Reporte
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDetailModalOpen && selectedReporte && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={closeDetailModal}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto transform animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
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
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Cerrar modal"
                >
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>
              <div className="px-6 py-5 space-y-8">
                <section className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      selectedReporte.status === "APROBADO"
                        ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800"
                        : selectedReporte.status === "PENDIENTE"
                        ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800"
                        : selectedReporte.status === "PROCESADO"
                        ? "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700"
                        : "bg-gradient-to-r from-red-100 to-red-200 text-red-800"
                    }`}
                  >
                    {selectedReporte.status}
                  </span>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700"
                  >
                    Almacén: {selectedReporte.almacen?.name || "N/A"}
                  </span>
                </section>
                <section>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    Equipo
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-gray-100 p-3">
                      <p className="text-xs font-medium text-gray-500">Equipo</p>
                      <p className="text-sm text-gray-900">{selectedReporte.equipo || "Sin equipo"}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-3">
                      <p className="text-xs font-medium text-gray-500">Horometro</p>
                      <p className="text-sm text-gray-900">{selectedReporte.horometro || "N/A"}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-3">
                      <p className="text-xs font-medium text-gray-500">Modelo</p>
                      <p className="text-sm text-gray-900">{selectedReporte.modelo || "N/A"}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-3">
                      <p className="text-xs font-medium text-gray-500">Serie</p>
                      <p className="text-sm text-gray-900">{selectedReporte.serie || "N/A"}</p>
                    </div>
                  </div>
                </section>
                <section>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Información general
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-gray-100 p-3">
                      <p className="text-xs font-medium text-gray-500">Observaciones</p>
                      <p className="text-sm text-gray-900">{selectedReporte.observaciones || "Sin observaciones"}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-3">
                      <p className="text-xs font-medium text-gray-500">Revisado por</p>
                      <p className="text-sm text-gray-900">{selectedReporte.revisadoPor?.email || "Pendiente"}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-3">
                      <p className="text-xs font-medium text-gray-500">Fecha creación</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedReporte.fechaCreacion)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-3">
                      <p className="text-xs font-medium text-gray-500">Fecha revisión</p>
                      <p className="text-sm text-gray-900">
                        {selectedReporte.fechaRevision ? formatDate(selectedReporte.fechaRevision) : "N/A"}
                      </p>
                    </div>
                  </div>
                </section>
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
                              className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700"
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
                              className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700"
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
                <section>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Refacciones
                  </h3>
                  {selectedReporte.items?.length ? (
                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Producto
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Cantidad
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedReporte.items.map((item, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors duration-200">
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {item.producto
                                  ? `${item.producto.id} - ${item.producto.name || "Sin nombre"}`
                                  : item.productoId}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700 text-right">{item.cantidad}</td>
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
              <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-100 px-6 py-4 rounded-b-xl flex justify-end">
                <button
                  onClick={closeDetailModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  aria-label="Cerrar modal"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ReportesOperadorPage;
