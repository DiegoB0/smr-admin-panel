import React from "react"
import { useParams } from "react-router-dom"
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from "react-router-dom";

function AlmacenenInventarioPage() {
  const { id } = useParams();

  const navigate = useNavigate()

  return (
    <div className="p-6">
      <button className="flex gap-2 items-center text-lg text-gray-600"
          onClick={() => navigate(`/dashboard/almacenes`)}
      >
        <span>
        <ChevronLeft />
        </span>
        REGRESAR
      </button>
      <div className="mt-2">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Almacenes</h1>
      </div>

      Inventario del almacen {id}
    </div>
  )
}


export default AlmacenenInventarioPage
