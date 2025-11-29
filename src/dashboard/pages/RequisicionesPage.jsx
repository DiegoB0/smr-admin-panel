"use client";

import React, { useEffect, useState } from "react";
import { IoSearch } from "react-icons/io5";
import {
  Check,
  X,
  FileText,
  CircleDollarSign,
  CheckCheck,
  Timer,
  AlertTriangle,
  Eye,
  Pencil,
  CircleX,
  CircleCheck,
  Search,
  Plus,
  Trash2,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { useRequisiciones } from "../../hooks/useRequisiciones";
import { useFiltros } from "../../hooks/useFiltros";
import Swal from "sweetalert2";
import { useDebounce } from "../../hooks/customHooks";
import { printRequisicion } from "../../utils/printPdf";
import { useAuthFlags } from "../../hooks/useAuth";
import { useProveedores } from "../../hooks/useProveedores"
import { useAlmacenes } from "../../hooks/useAlmacenes";
import PrintableRequisicion from "./PrintableRequisicion";


const RequisicionesPage = () => {
  const {
    getStats,
    listRequisiciones,
    createRequisicion,
    approveRequisicion,
    rejectRequisicion,
    updateItems
  } = useRequisiciones();

  const { getFiltrosByHrs } = useFiltros();

  const [requisiciones, setRequisiciones] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState("10");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [proveedores, setProveedores] = useState([])

  const [almacenes, setAlmacenes] = useState([])

  const [stats, setStats] = useState({
    pagada: 0,
    aprobada: 0,
    pendiente: 0,
    rechazada: 0,
    total: 0,
  })

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRequisicion, setSelectedRequisicion] = useState(null);

  const [filtroQuery, setFiltroQuery] = useState({
    hrs: '',
    no_economico: ''
  })

  // Modal de creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    rcp: "",
    titulo: "",
    observaciones: "",
    prioridad: "alta",
    hrm: null,
    concepto: "",
    requisicionType: "refacciones",
    almacenCargoId: "",
    proveedorId: "",
    metodo_pago: "sin_pagar",
    currency: "USD",
    items: [
      {
        cantidad: "",
        unidad: "",
        descripcion: "",
        precio: "",
        currency: "USD",
        customId: "",
        no_economico: "",
        hrs: "",
        is_product: false,
      },
    ],
  });

  const getItemLabel = () => {
    return formData.requisicionType === "filtros" ? "ID Filtro" : "ID Refaccion";
  };

  // For the concept
  const conceptos = [
    "consumibles",
    "equipos seguridad",
    "maquinas y herramientas",
    "oficina",
    "refaccion",
    "refaccion y servicio",
    "reparacion",
    "servicio",
    "traslado y viaticos",
    "viaticos",
    "material",
    "herramientas",
    "EPP",
    "higiene",
    "servicio preventivo"
  ];


  // Admin flags
  const { isAdmin, isAdminAlmacen } = useAuthFlags();

  const { listProveedores } = useProveedores()
  const { listAlmacenes } = useAlmacenes()

  const limit =
    limitOption === "all" ? -1 : Number(limitOption);

  const fetchRequisiciones = () => {
    setLoading(true);
    listRequisiciones({
      page,
      limit,
      order: "DESC",
      search: debouncedSearch,
      status: statusFilter,
    })
      .then((res) => {
        console.log(res.data.data)
        setRequisiciones(res.data.data);
        setPagination(res.data.meta);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err.message ||
          "Error al cargar requisiciones";
        Swal.fire("Error", Array.isArray(msg) ? msg.join(", ") : msg, "error");
      })
      .finally(() => setLoading(false));
  };


  const fetchProveedores = () => {
    listProveedores({ page: 1, limit: 100, order: "ASC" })
      .then((res) => {
        setProveedores(res.data)
      })
      .catch((err) => {
        console.error("Error cargando productos:", err)
      })
  }


  useEffect(() => {
    fetchProveedores()
  }, [])


  const fetchAlmacenes = () => {
    listAlmacenes({ page: 1, limit: 100, order: "ASC" })
      .then((res) => {
        setAlmacenes(res.data.data)
      })
      .catch((err) => {
        console.error("Error cargando productos:", err)
      })
  }

  const fetchStats = () => {
    getStats()
      .then((res) => {
        setStats(res.data)
      })
      .catch((err) => {
        console.error("Error cargando productos:", err)
      })

  }


  useEffect(() => {
    fetchAlmacenes()
    fetchStats()
  }, [])

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  useEffect(() => {
    fetchRequisiciones();
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);
  useEffect(() => {
    setPage(1);
  }, [limitOption]);

  const openDetailModal = (requisicion) => {
    setSelectedRequisicion(requisicion);
    setIsDetailModalOpen(true);
  };

  const openEditModal = (requisicion) => {
    setIsEditing(true)
    setSelectedRequisicion(requisicion);

    const itemsMap = {
      consumibles: requisicion.insumos || [],
      refacciones: requisicion.refacciones || [],
      filtros: requisicion.filtros || [],
    };

    const itemsArray = itemsMap[requisicion.requisicionType] || [];

    setFormData({
      requisicionType: requisicion.requisicionType,
      items: itemsArray.map((item) => ({
        id: item.id,
        customId: item.customId || "",
        no_economico: item.no_economico || "",
        cantidad: item.cantidad || 0,
        unidad: item.unidad || "",
        descripcion: item.descripcion || "",
        precio: item.precio || 0,
        currency: item.currency || "USD",
        is_product: item.is_product || false,
      })),
    });

    setIsEditModalOpen(true)
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRequisicion(null);

  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormData({
      rcp: "",
      titulo: "",
      observaciones: "",
      prioridad: "alta",
      hrm: null,
      concepto: "",
      requisicionType: "refacciones",
      almacenCargoId: "",
      proveedorId: "",
      metodo_pago: "sin_pagar",
      currency: "USD",
      items: [
        {
          cantidad: "",
          unidad: "",
          descripcion: "",
          precio: "",
          currency: "USD",
          customId: "",
          no_economico: "",
          hrs: "",
          is_product: false,
        },
      ],
    })
  };

  const closeEditModal = () => {
    setIsEditing(false)
    setIsEditModalOpen(false);
    setSelectedRequisicion(null);
    setFormData({
      rcp: "",
      titulo: "",
      observaciones: "",
      prioridad: "alta",
      hrm: null,
      concepto: "",
      requisicionType: "refacciones",
      almacenCargoId: "",
      proveedorId: "",
      metodo_pago: "sin_pagar",
      currency: "USD",
      items: [
        {
          cantidad: "",
          unidad: "",
          descripcion: "",
          precio: "",
          currency: "USD",
          customId: "",
          no_economico: "",
          hrs: "",
          is_product: false,
        },
      ],
    })
  };

  const handleTipoChange = (newTipo) => {
    setFormData((prev) => ({
      ...prev,
      requisicionType: newTipo,
      items:
        newTipo === "filtros"
          ? []
          : prev.items.length === 0
            ? [
              {
                cantidad: "",
                unidad: "",
                descripcion: "",
                precio: "",
                currency: "",
                equipo: "",
              },
            ]
            : prev.items,
    }));
  };

  // Acciones aprobar/rechazar
  const handleApprove = async (id) => {
    try {
      const confirm = await Swal.fire({
        title: "Aprobar requisición",
        text: "¿Confirmas aprobar esta requisición?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, aprobar",
        cancelButtonText: "Cancelar",
      });
      if (!confirm.isConfirmed) return;

      await approveRequisicion(id);
      Swal.fire("Éxito", "Requisición aprobada", "success");
      fetchRequisiciones();
      fetchStats();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "No se pudo aprobar";
      Swal.fire("Error", Array.isArray(msg) ? msg.join(", ") : msg, "error");
    }
  };

  const handleReject = async (id) => {
    try {
      const { isConfirmed } = await Swal.fire({
        title: "Rechazar requisición",
        text: "¿Confirmas rechazar esta requisición?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Rechazar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;

      await rejectRequisicion(id /*, { motivo } si tu API lo soporta */);
      Swal.fire("Listo", "Requisición rechazada", "success");
      fetchRequisiciones();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "No se pudo rechazar";
      Swal.fire("Error", Array.isArray(msg) ? msg.join(", ") : msg, "error");
    }
  };

  //Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      // Validate required fields
      if (!formData.almacenCargoId) {
        Swal.fire("Error", "Selecciona un almacén cargo", "error");
        return;
      }

      if (!formData.proveedorId) {
        Swal.fire("Error", "Selecciona un proveedor", "error");
        return;
      }

      if (formData.items.length === 0) {
        Swal.fire("Error", "Agrega al menos un item", "error");
        return;
      }

      // Build payload based on requisicion type
      let payload = {
        rcp: formData.rcp,
        titulo: formData.titulo,
        observaciones: formData.observaciones,
        prioridad: formData.prioridad,
        concepto: formData.concepto,
        requisicionType: formData.requisicionType,
        almacenCargoId: Number(formData.almacenCargoId),
        proveedorId: Number(formData.proveedorId),
        hrs: filtroQuery.hrs ? Number(filtroQuery.hrs) : null,
        metodo_pago: formData.metodo_pago,
        currency: formData.currency,
        items: formData.items.map((item) => {
          const baseItem = {
            cantidad: Number(item.cantidad) || 0,
            unidad: item.unidad,
            descripcion: item.descripcion,
            precio: Number(item.precio) || 0,
            currency: item.currency || formData.currency,
          };

          if (formData.requisicionType === "refacciones") {
            return {
              ...baseItem,
              customId: item.customId,
              no_economico: item.no_economico,
            };
          }

          if (formData.requisicionType === "filtros") {
            return {
              ...baseItem,
              customId: item.customId,
              no_economico: item.no_economico,
              hrs_snapshot: item.hrs ? Number(item.hrs) : null,
            };
          }

          if (formData.requisicionType === "consumibles") {
            return {
              ...baseItem,
              is_product: item.is_product || false,
            };
          }

          return baseItem;
        }),
      };

      // Validate items
      const invalidItem = payload.items.find((it) => {
        const missingBasics = !it.cantidad || it.cantidad <= 0 || !it.unidad;

        const missingDescripcion = !it.descripcion || it.descripcion.trim() === '';
        return missingBasics || missingDescripcion;

      });

      if (invalidItem) {
        const msg =
          formData.requisicionType === 'consumibles'
            ? 'Todos los items deben tener cantidad > 0, unidad y descripción'
            : 'Todos los items deben tener cantidad > 0 y unidad y nombre';
        Swal.fire('Error', msg, 'error');
        return;
      }

      await createRequisicion(payload);

      Swal.fire("Éxito", "Requisición creada correctamente", "success");
      setIsCreateModalOpen(false);
      setFormData({
        rcp: "",
        titulo: "",
        prioridad: "alta",
        hrm: null,
        concepto: "",
        requisicionType: "refacciones",
        almacenCargoId: "",
        proveedorId: "",
        observaciones: "",
        metodo_pago: "sin_pagar",
        currency: "USD",
        items: [
          {
            cantidad: "",
            unidad: "",
            descripcion: "",
            precio: "",
            currency: "USD",
            no_economico: "",
            hrs: "",
            is_product: false,
          },
        ],
      });

      setFiltroQuery({
        hrs: '',
        no_economico: ''
      })


      fetchRequisiciones();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Error al crear requisición";
      Swal.fire("Error", Array.isArray(msg) ? msg.join(", ") : msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const payload = {
      requisicionType: formData.requisicionType,
      items: formData.items.map((item) => ({
        id: item.id,
        cantidad: item.cantidad,
        precio: item.precio,
        currency: item.currency,
        unidad: item.unidad,
        descripcion: item.descripcion,
        customId: item.customId,
        no_economico: item.no_economico,
        hrs_snapshot: item.hrs_snapshot,
        is_product: item.is_product,
      })),
    };

    try {

      await updateItems(
        selectedRequisicion.id,
        payload,
      );

      fetchRequisiciones();

      Swal.fire("Éxito", "Requisición actualizada", "success");
      closeEditModal();
    } catch (error) {
      Swal.fire('Error!', 'Ocurrio un error al actualizar', 'warning');
    }

  }

  const handleBuscarFiltros = async () => {
    const { hrs, no_economico } = filtroQuery;
    if (!hrs || !no_economico) {
      Swal.fire('Faltan datos', 'Ingresa HRS y No. económico', 'warning');
      return;
    }

    try {
      const res = await getFiltrosByHrs({
        no_economico: no_economico.trim(),
        hrs: Number(hrs),
      });

      // If using axios, data is in res.data
      const payload = res.data || res;

      const items = Array.isArray(payload.items) ? payload.items : [];
      if (items.length === 0) {
        Swal.fire('Sin resultados', 'No se encontraron filtros', 'info');
        return;
      }

      // Map fetched filtro items into your requisición items
      setFormData((prev) => ({
        ...prev,
        requisicionType: 'filtros',
        items: items.map((it) => ({
          customId: it.numero,
          descripcion: it.descripcion || '',
          cantidad: Number(it.cantidad) || 1,
          unidad: it.unidad || 'pieza',
          precio: '',
          currency: prev.currency || 'USD',
          no_economico: no_economico.trim(),
          hrs: String(hrs),
          is_product: false,
        })),
      }));

      Swal.fire(
        'Listo',
        `Se cargaron ${items.length} filtros para ${no_economico} (${hrs} HRS)`,
        'success'
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Error buscando filtros';
      Swal.fire('Error', Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    }
  };

  const currency = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n || 0);

  // Stats 
  const StatsSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <StatCard label="Total" count={stats.total} color="blue" icon={FileText} />
      <StatCard label="Pagadas" count={stats.pagada} color="blue" icon={CircleDollarSign} />
      <StatCard label="Aprobadas" count={stats.aprobada} color="green" icon={CheckCheck} />
      <StatCard label="Pendientes" count={stats.pendiente} color="yellow" icon={Timer} />
      <StatCard label="Rechazadas" count={stats.rechazada} color="red" icon={AlertTriangle} />
    </div>
  );

  // Extract stat card into component
  const StatCard = ({ label, count, color, icon: Icon }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium text-${color}-600 mb-1`}>
            {label}
          </p>
          <p className={`text-2xl font-bold text-${color}-600`}>{count}</p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-500`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="mt-4 text-gray-600">Cargando requisiciones...</p>
      </div>
    </div>
  );

  // Helpers items
  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { cantidad: "", unidad: "", descripcion: "", precio: "" },
      ],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const lower = (s) => (s || "").toLowerCase();

  const updateItem = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      return {
        ...prev,
        items: newItems,
      };
    });
  };

  // Total estimado (UI)
  const totalEstimado = formData.items.reduce((acc, it) => {
    const q = Number(it.cantidad) || 0;
    const p = Number(it.precio) || 0;
    return acc + q * p;
  }, 0);
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Requisiciones
          </h1>
          <p className="text-gray-600 mt-1">Administra todas las requisiciones</p>
        </div>
        <div />
      </div>

      <StatsSection />

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por RCP, Titulo o por Producto ID..."
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
      </div>

      {isAdminAlmacen && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Crear Requisición
          </button>
        </div>
      )}

      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => handleStatusChange("ALL")}
          className={`px-3 py-1.5 rounded-lg border ${statusFilter === "ALL"
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-700 border-gray-300"
            }`}
        >
          Todas
        </button>
        <button
          onClick={() => handleStatusChange("pendiente")}
          className={`px-3 py-1.5 rounded-lg border ${statusFilter === "pendiente"
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-700 border-gray-300"
            }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => handleStatusChange("aprobada")}
          className={`px-3 py-1.5 rounded-lg border ${statusFilter === "aprobada"
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-700 border-gray-300"
            }`}
        >
          Aprobadas
        </button>
        <button
          onClick={() => handleStatusChange("rechazada")}
          className={`px-3 py-1.5 rounded-lg border ${statusFilter === "rechazada"
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-700 border-gray-300"
            }`}
        >
          Rechazadas
        </button>
        <button
          onClick={() => handleStatusChange("pagada")}
          className={`px-3 py-1.5 rounded-lg border ${statusFilter === "pagada"
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-700 border-gray-300"
            }`}
        >
          Pagadas
        </button>
      </div>
      {/* Tabla */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    RCP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha Solicitud
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo de requisición
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Precio estimado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Monto final
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requisiciones.length > 0 ? (
                  requisiciones.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.rcp || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.fechaSolicitud
                          ? new Date(r.fechaSolicitud).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.titulo || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.prioridad || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${lower(r.status) === "pendiente"
                            ? "bg-yellow-100 text-yellow-800"
                            : ["aprobado", "aprobada"].includes(lower(r.status))
                              ? "bg-green-100 text-green-800"
                              : ["pendiente"].includes(lower(r.status))
                                ? "bg-yellow-100 text-yellow-800"
                                : ["pagada"].includes(lower(r.status))
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                        >
                          {r.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.requisicionType === "refacciones"
                          ? "Refacciones"
                          : r.requisicionType === "filtros"
                            ? "Filtros"
                            : r.requisicionType === "consumibles"
                              ? "Consumibles"
                              : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.cantidadEstimada ? currency(r.cantidadEstimada) : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {r.cantidadActual ? currency(r.cantidadActual) : "N/A"}
                      </td>

                      <td className="px-6 py-4 text-sm flex space-x-2">
                        {lower(r.status) === "pagada" ? (
                          <>
                            <button
                              onClick={() => openDetailModal(r)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <span className="text-blue-800 text-sm bg-blue-200 rounded-xl px-2 py-1 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3" />
                              pagada
                            </span>

                          </>

                        ) : lower(r.status) === "aprobada" ? (
                          <>
                            <button
                              onClick={() => openDetailModal(r)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <span className="text-green-800 text-sm bg-green-200 rounded-xl px-2 py-1 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3" />
                              abrobado
                            </span>

                          </>

                        ) : (


                          <>
                            <button
                              onClick={() => openDetailModal(r)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {isAdminAlmacen && (
                              <button
                                onClick={() => openEditModal(r)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Editar detalles"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )
                            }

                            {isAdmin && lower(r.status) === "pendiente" && (
                              <>
                                <button
                                  onClick={() => handleApprove(r.id)}
                                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                  title="Aprobar"
                                >
                                  <CircleCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(r.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Rechazar"
                                >
                                  <CircleX className="w-4 h-4" />
                                </button>
                              </>
                            )}


                          </>
                        )}

                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No se encontraron requisiciones
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm
                          ? "Intenta ajustar los filtros de búsqueda"
                          : "No hay requisiciones registradas"}
                      </p>
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
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"

          onClick={() => closeCreateModal()}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left pane - Form */}
            <div className="flex-1 overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-green-50 text-green-600">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Nueva Requisición
                    </h2>
                    <p className="text-xs text-gray-500">
                      Completa los campos para crear la requisición
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => closeCreateModal()}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Cerrar"
                >
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-8">
                {/* Sección: Datos generales */}
                <section>

                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    Datos generales
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* RCP */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RCP (opcional)
                      </label>
                      <input
                        type="number"
                        placeholder="Ej. 12345"
                        value={formData.rcp}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            rcp:
                              e.target.value === "" ? "" : Number(e.target.value),
                          }))
                        }
                        min={1}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Número de requisición de compra.
                      </p>
                    </div>

                    {/* Título */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Mantenimiento de bomba hidráulica"
                        value={formData.titulo}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, titulo: e.target.value }))
                        }
                        required
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      />
                    </div>

                    {/* Prioridad */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prioridad <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.prioridad}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            prioridad: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                      >
                        <option value="alta">Alta</option>
                        <option value="media">Media</option>
                        <option value="baja">Baja</option>
                      </select>
                    </div>

                    {/* Almacén Cargo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID Almacén Cargo <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="almacenCargoId"
                        value={formData.almacenCargoId}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            almacenCargoId:
                              e.target.value === "" ? "" : Number(e.target.value),
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="" disabled>
                          -- Selecciona un almacén --
                        </option>
                        {almacenes.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Almacén que cubrirá el gasto.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Concepto <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.concepto}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            concepto: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      >
                        <option value="">-- Selecciona concepto --</option>
                        {conceptos.map((concepto) => (
                          <option key={concepto} value={concepto}>
                            {concepto}
                          </option>
                        ))}
                      </select>
                    </div>


                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proveedor <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="proveedorId"
                        value={
                          formData.proveedorId === null
                            ? ""
                            : String(formData.proveedorId)
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            proveedorId: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="" disabled>
                          -- Selecciona un proveedor --
                        </option>
                        {proveedores.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observaciones <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        placeholder="Observaciones de la requisicion"
                        value={formData.observaciones}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            observaciones: e.target.value,
                          }))
                        }
                        required
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition resize-none"
                      />
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Tipo de requisición <span className="text-red-500">*</span>
                      </label>

                      <div className="flex gap-3">
                        {["Refacciones", "Filtros", "Consumibles"].map((tipo) => (
                          <button
                            key={tipo}
                            type="button"
                            onClick={() => handleTipoChange(tipo.toLowerCase())}
                            className={`px-4 py-2 rounded-lg font-medium transition ${formData.requisicionType === tipo.toLowerCase()
                              ? "bg-green-600 text-white border-2 border-green-600"
                              : "bg-gray-100 text-gray-700 border-2 border-gray-300 hover:border-green-500"
                              }`}
                          >
                            {tipo}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </section>

                <section>
                  {formData.requisicionType === "filtros" && (
                    <>
                      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-4">
                        <ClipboardList className="w-4 h-4 text-green-600" />
                        Busqueda de filtros
                      </h3>

                      <div className="flex gap-2">
                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            HRS <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={filtroQuery.hrs}
                            onChange={(e) =>
                              setFiltroQuery((prev) => ({ ...prev, hrs: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                          >
                            <option value="">-- Selecciona HRS --</option>
                            <option value="250">250</option>
                            <option value="500">500</option>
                            <option value="1000">1000</option>
                            <option value="2000">2000</option>
                          </select>


                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Equipo <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. TD-27"
                            value={filtroQuery.no_economico}
                            onChange={(e) =>
                              setFiltroQuery((prev) => ({ ...prev, no_economico: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          />
                        </div>

                        <div>

                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            * Encuentra los filtros segun el equipo *
                          </label>

                          <button
                            type="button"
                            className="bg-gray-500 hover:bg-gray-600 ease-in-out duration-200 px-4 py-2 text-white border-none rounded-lg"
                            onClick={handleBuscarFiltros}
                          >
                            Buscar filtros
                          </button>
                        </div>

                      </div>


                    </>
                  )}

                </section>

                {/* Sección: Items */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-green-600" />
                      Items de la requisicion
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-white hover:bg-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-800 duration-300 ease-in-out border-2 border-gray-600"
                      >
                        <IoSearch />
                        Buscar en otros almacenes
                      </button>
                      <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar item
                      </button>

                    </div>
                  </div>

                  {formData.items.length === 0 && (
                    <p className="text-sm text-gray-500 mb-2">
                      Agrega al menos un item para crear la requisicion.
                    </p>
                  )}

                  <div className="space-y-3">

                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        className="relative border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        {/* Botón eliminar item */}
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="absolute -top-3 -right-3 p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 shadow"
                          title="Eliminar item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                          {(formData.requisicionType === "refacciones" || formData.requisicionType === "filtros") && (
                            <>
                              <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {getItemLabel()} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ej. REF-001"
                                  value={item.customId || ""}
                                  onChange={(e) =>
                                    updateItem(index, "customId", e.target.value)
                                  }
                                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                                />
                              </div>

                              <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  No. Economico <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ej. Bomba hidráulica"
                                  value={item.no_economico || ""}
                                  onChange={(e) =>
                                    updateItem(index, "no_economico", e.target.value)
                                  }
                                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                                />
                              </div>
                            </>
                          )}

                          <>
                            <div className="md:col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                placeholder="0"
                                value={item.cantidad}
                                onChange={(e) =>
                                  updateItem(index, "cantidad", e.target.value)
                                }
                                required
                                min={1}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                              />
                            </div>

                            <div className="md:col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unidad <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Ej. hr, día, pieza"
                                value={item.unidad}
                                onChange={(e) =>
                                  updateItem(index, "unidad", e.target.value)
                                }
                                required
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.requisicionType === 'consumibles' ? (
                                  <span className="text-gray-700 flex items-center gap-1">
                                    Descripcion <p className="text-red-500">*</p>
                                  </span>
                                ) : (
                                  <span className="text-gray-700 text-medium flex items-center gap-1">Nombre <p className="text-red-500">*</p></span>
                                )}
                              </label>
                              <input
                                type="text"
                                placeholder="Escribe el nombre del item"
                                value={item.descripcion}
                                required={formData.requisicionType === 'consumibles'}
                                onChange={(e) =>
                                  updateItem(index, "descripcion", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                              />
                            </div>

                            <div className="md:col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio unitario (opcional)
                              </label>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={item.precio}
                                onChange={(e) =>
                                  updateItem(index, "precio", e.target.value)
                                }
                                min={0}
                                step="0.01"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                              />
                            </div>

                            <div className="md:col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Moneda (opcional)
                              </label>
                              <select
                                value={item.currency || "no especificado"}
                                onChange={(e) =>
                                  updateItem(index, "currency", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                              >
                                <option value="">No especificado</option>
                                <option value="USD">USD</option>
                                <option value="MXN">MX Pesos</option>
                              </select>
                            </div>


                            {(formData.requisicionType === "consumibles") && (
                              <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Guardar en inventario
                                </label>
                                <input
                                  type="checkbox"
                                  checked={item.is_product || false}
                                  onChange={(e) =>
                                    updateItem(index, "is_product", e.target.checked)
                                  }
                                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                />
                              </div>
                            )}
                          </>

                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 -mx-6 px-6 py-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => closeCreateModal()}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </form>
            </div>

            {/* Right pane - Search other warehouses */}
            <div className="w-80 border-l border-gray-200 bg-gray-50 rounded-r-xl flex flex-col overflow-hidden">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Buscar en otros almacenes
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Disponibilidad en otros ubicaciones
                </p>
              </div>

              {/* Search results area */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 text-center py-8">
                    Los artículos aparecerán aquí
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Modal Detalles */}
      {
        isDetailModalOpen && selectedRequisicion && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={closeDetailModal}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto"
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
                      Detalles de la Requisición
                    </h2>
                    <p className="text-xs text-gray-500">
                      Vista resumen con información clave
                    </p>
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
                {/* Encabezado con badges */}
                <section className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200">
                    RCP: {selectedRequisicion.rcp || "N/A"}
                  </span>

                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200">
                    {selectedRequisicion.requisicionType === "consumibles"
                      ? "Consumibles"
                      : selectedRequisicion.requisicionType === "refacciones"
                        ? "Refacciones"
                        : selectedRequisicion.requisicionType === "filtros"
                          ? "Filtros"
                          : "Tipo N/A"}
                  </span>

                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${["aprobado", "aprobada"].includes(lower(selectedRequisicion.status))
                      ? "bg-green-50 text-green-700 border-green-200"
                      : lower(selectedRequisicion.status) === "pendiente"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-red-50 text-red-700 border-red-200"
                      }`}
                  >
                    {selectedRequisicion.status || "Sin status"}
                  </span>
                </section>

                {/* Grid datos principales */}
                <section>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Información general
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Detail label="Título" value={selectedRequisicion.titulo} />
                    <Detail label="HRS" value={selectedRequisicion.hrs} />
                    <Detail
                      label="Concepto"
                      value={selectedRequisicion.concepto || "Sin concepto"}
                    />
                    <Detail
                      label="Método de pago"
                      value={selectedRequisicion.metodo_pago}
                    />
                    <Detail label="Prioridad" value={selectedRequisicion.prioridad} />
                    <Detail
                      label="Fecha creación"
                      value={
                        selectedRequisicion.fechaSolicitud
                          ? new Date(
                            selectedRequisicion.fechaSolicitud
                          ).toLocaleDateString()
                          : "N/A"
                      }
                    />
                    <Detail
                      label="Fecha revisión"
                      value={
                        selectedRequisicion.fechaRevision
                          ? new Date(
                            selectedRequisicion.fechaRevision
                          ).toLocaleDateString()
                          : "N/A"
                      }
                    />
                  </div>
                </section>

                {/* Relacionados */}
                <section>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Relacionados
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Detail label="Pedido por" value={selectedRequisicion.pedidoPor?.name} />
                    <Detail label="Revisado por" value={selectedRequisicion.revisadoPor?.name} />
                    <Detail
                      label="Almacén Destino"
                      value={selectedRequisicion.almacenDestino?.name}
                    />
                    <Detail label="Almacén Cargo" value={selectedRequisicion.almacenCargo?.name} />
                  </div>
                </section>


                <section>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Observaciones
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <Detail label="Notas de almacen" value={selectedRequisicion.observaciones} />
                    <Detail label="Notas de compras" value={selectedRequisicion.observacionesCompras} />
                  </div>
                </section>


                {/* Items */}
                <section>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Items
                  </h3>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {selectedRequisicion.requisicionType === "consumibles"
                        ? "Consumibles"
                        : selectedRequisicion.requisicionType === "refacciones"
                          ? "Refacciones"
                          : selectedRequisicion.requisicionType === "filtros"
                            ? "Filtros"
                            : "Tipo N/A"}
                    </h3>
                    {selectedRequisicion.insumos?.length > 0 ? (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr key={selectedRequisicion.insumos?.id}>
                              <Th>Descripción</Th>
                              <Th>Unidad</Th>
                              <Th>Cantidad Esperada</Th>
                              <Th>Cantidad Comprada</Th>
                              <Th>Precio Unitario</Th>
                              <Th>Tipo de moneda</Th>
                              <Th>Pagado</Th>

                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {
                              selectedRequisicion.insumos.map((item, i) => (
                                <tr key={i}>
                                  <Td>{item.descripcion}</Td>
                                  <Td>{item.unidad}</Td>
                                  <Td>{item.cantidad}</Td>
                                  <Td>{item.cantidadPagada || 'N/A'}</Td>
                                  <Td>{item.precio}</Td>
                                  <Td>{item.currency}</Td>
                                  <Td>{item.paid === true ? <Check /> : <X />}</Td>
                                </tr>
                              ))
                            }

                          </tbody>
                        </table>
                      </div>

                    ) : selectedRequisicion.refacciones?.length > 0 ? (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr key={selectedRequisicion.refacciones?.id}>
                              <Th>ID</Th>
                              <Th>No. Economico</Th>
                              <Th>Unidad</Th>
                              <Th>Cantidad Esperada</Th>
                              <Th>Cantidad Comprada</Th>
                              <Th>Precio</Th>
                              <Th>Moneda</Th>
                              <Th>Pagado</Th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {
                              selectedRequisicion.refacciones.map((item, i) => (
                                <tr key={i}>
                                  <Td>{item.customId}</Td>
                                  <Td>{item.no_economico}</Td>
                                  <Td>{item.unidad}</Td>
                                  <Td>{item.cantidad}</Td>
                                  <Td>{item.cantidadPagada || 'N/A'}</Td>
                                  <Td>{item.precio}</Td>
                                  <Td>{item.currency}</Td>
                                  <Td>{item.paid === true ? <Check /> : <X />}</Td>
                                </tr>
                              ))
                            }

                          </tbody>
                        </table>
                      </div>

                    ) : selectedRequisicion.filtros?.length > 0 ? (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr key={selectedRequisicion.filtros?.id}>
                              <Th>ID</Th>
                              <Th>No. Economico</Th>
                              <Th>Unidad</Th>
                              <Th>Cantidad Esperada</Th>
                              <Th>Cantidad Comprada</Th>
                              <Th>Precio</Th>
                              <Th>Moneda</Th>
                              <Th>Pagado</Th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {
                              selectedRequisicion.filtros.map((item, i) => (
                                <tr key={i}>
                                  <Td>{item.customId}</Td>
                                  <Td>{item.no_economico}</Td>
                                  <Td>{item.unidad}</Td>
                                  <Td>{item.cantidad}</Td>
                                  <Td>{item.cantidadPagada || 'N/A'}</Td>
                                  <Td>{item.precio}</Td>
                                  <Td>{item.currency}</Td>
                                  <Td>{item.paid === true ? <Check /> : <X />}</Td>
                                </tr>
                              ))
                            }

                          </tbody>
                        </table>
                      </div>

                    ) : (

                      <p className="text-gray-600">
                        No hay items registrados en esta requisición
                      </p>
                    )}

                  </div>
                </section>
              </div>
              {/* Contenido oculto para exportar (layout imprimible) */}
              <PrintableRequisicion requisicion={selectedRequisicion} />
              {/* Footer */}
              <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 px-6 py-4 rounded-b-xl flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() =>
                    printRequisicion(
                      `req-print-${selectedRequisicion.id}`,
                      `RCP${selectedRequisicion.rcp || selectedRequisicion.id}`
                    )
                  }
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Imprimir / Guardar PDF
                </button>
                <button
                  onClick={closeDetailModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit modal */}
      {
        isEditModalOpen && selectedRequisicion && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={closeEditModal}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 text-blue-600">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Editar Requisición
                    </h2>
                    <p className="text-xs text-gray-500">
                      Actualizar precios de los items
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeEditModal}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Cerrar"
                >
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>

              <form onSubmit={handleEdit} className="px-6 py-5 space-y-8">

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-green-600" />
                      Items de la requisicion
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar item
                      </button>

                    </div>
                  </div>

                  {formData.items.length === 0 && (
                    <p className="text-sm text-gray-500 mb-2">
                      Agrega al menos un item para crear la requisicion.
                    </p>
                  )}

                  <div className="space-y-3">

                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        className="relative border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        {/* Botón eliminar item */}
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="absolute -top-3 -right-3 p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 shadow"
                          title="Eliminar item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                          {(formData.requisicionType === "refacciones" || formData.requisicionType === "filtros") && (
                            <>
                              <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {getItemLabel()} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ej. REF-001"
                                  value={item.customId || ""}
                                  onChange={(e) =>
                                    updateItem(index, "customId", e.target.value)
                                  }
                                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                                />
                              </div>

                              <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  No. Economico <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ej. Bomba hidráulica"
                                  value={item.no_economico || ""}
                                  onChange={(e) =>
                                    updateItem(index, "no_economico", e.target.value)
                                  }
                                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                                />
                              </div>
                            </>
                          )}

                          <>
                            <div className="md:col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                placeholder="0"
                                value={item.cantidad}
                                onChange={(e) =>
                                  updateItem(index, "cantidad", e.target.value)
                                }
                                required
                                min={1}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                              />
                            </div>

                            <div className="md:col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unidad <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Ej. hr, día, pieza"
                                value={item.unidad}
                                onChange={(e) =>
                                  updateItem(index, "unidad", e.target.value)
                                }
                                required
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción{' '}
                                {formData.requisicionType === 'consumibles' ? (
                                  <span className="text-red-500">*</span>
                                ) : (
                                  <span className="text-gray-700 text-medium">(opcional)</span>
                                )}
                              </label>
                              <input
                                type="text"
                                placeholder="Describe el servicio (ej. mantenimiento correctivo)"
                                value={item.descripcion}
                                required={formData.requisicionType === 'consumibles'}
                                onChange={(e) =>
                                  updateItem(index, "descripcion", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                              />
                            </div>

                            <div className="md:col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio unitario (opcional)
                              </label>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={item.precio}
                                onChange={(e) =>
                                  updateItem(index, "precio", e.target.value)
                                }
                                min={0}
                                step="0.01"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                              />
                            </div>

                            <div className="md:col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Moneda (opcional)
                              </label>
                              <select
                                value={item.currency || "USD"}
                                onChange={(e) =>
                                  updateItem(index, "currency", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                              >
                                <option value="">No especificado</option>
                                <option value="USD">USD</option>
                                <option value="MXN">MX Pesos</option>
                              </select>
                            </div>


                            {(formData.requisicionType === "consumibles") && (
                              <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Guardar en inventario
                                </label>
                                <input
                                  type="checkbox"
                                  checked={item.is_product || false}
                                  onChange={(e) =>
                                    updateItem(index, "is_product", e.target.checked)
                                  }
                                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                />
                              </div>
                            )}
                          </>

                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 px-6 py-4 rounded-b-xl flex flex-wrap gap-2 justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    Actualizar
                  </button>
                  <button
                    onClick={closeEditModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>

              </form>




            </div>
          </div>
        )
      }


    </div >
  );
};

export default RequisicionesPage;
