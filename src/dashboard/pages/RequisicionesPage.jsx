import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import NewRequisicionForm from "../components/requisiciones/NewRequisicionForm";
import RequisicionTable from "../components/requisiciones/RequisicionTable";
import RequisicionFilters from "../components/requisiciones/RequisicionFilters";
import RequisicionStats from "../components/requisiciones/RequisicionStats";
import { useRequisiciones } from "../../hooks/useRequisiciones";

const RequisicionesPage = () => {
  const { createServiceRequisicion, listRequisiciones } = useRequisiciones();
  const [requisiciones, setRequisiciones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRequisicion, setEditingRequisicion] = useState(null);
  const [filters, setFilters] = useState({
    estado: "todos",
    fechaInicio: "",
    fechaFin: "",
    departamento: "",
    busqueda: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await listRequisiciones();
        setRequisiciones(response.data);
      } catch (error) {
        console.error("Error fetching requisiciones:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateRequisicion = () => {
    setEditingRequisicion(null);
    setShowForm(true);
  };

  const handleSaveRequisicion = async (requisicionData) => {
    try {
      await createServiceRequisicion(requisicionData);
      setRequisiciones((prev) => [requisicionData, ...prev]);
    } catch (error) {
      console.error("Error creating requisicion:", error);
    }
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Requisiciones</h1>
            <p className="text-gray-600 mt-1">
              Gestiona las solicitudes de materiales y productos
            </p>
          </div>
          <button
            onClick={handleCreateRequisicion}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Nueva Requisición
          </button>
        </div>
        <RequisicionStats requisiciones={requisiciones} />
      </div>

      <RequisicionFilters filters={filters} onFiltersChange={setFilters} className="mb-6" />

      <RequisicionTable requisiciones={requisiciones} />

      {showForm && (
        <NewRequisicionForm
          onSave={handleSaveRequisicion}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default RequisicionesPage;