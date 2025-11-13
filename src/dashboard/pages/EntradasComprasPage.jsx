"use client";

import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  FileText,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";
import { useEntradas } from "../../hooks/useEntradas";
import { useAlmacenes } from "../../hooks/useAlmacenes";

const EntradasComprasPage = () => {
  const navigate = useNavigate();
  const { listEntradas } = useEntradas();
  const { listAlmacen, listAlmacenes } = useAlmacenes();

  const [almacenes, setAlmacenes] = useState([]);
  const [entradasCount, setEntradasCount] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlmacenesYEntradas = async () => {
      try {
        let res;
        try {
          res = await listAlmacen({ page: 1, limit: 100 });
        } catch {
          res = await listAlmacenes({ page: 1, limit: 100 });
        }

        const data = res?.data?.data || [];
        setAlmacenes(data);

        const counts = {};
        for (const a of data) {
          try {
            const entradasRes = await listEntradas({
              almacenId: a.id,
              page: 1,
              limit: 100,
            });
            counts[a.id] = (entradasRes?.data?.data || []).length;
          } catch {
            counts[a.id] = 0;
          }
        }

        setEntradasCount(counts);
      } catch (err) {
        console.error(err);
        Swal.fire(
          "Error",
          "No se pudieron cargar los almacenes o entradas",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAlmacenesYEntradas();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <div className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3"></div>
        <p>Cargando almacenes...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        className="flex gap-2 items-center mb-4"
        onClick={() => navigate("/dashboard")}
      >
        <ChevronLeft className="text-gray-500" />
        <span className="text-gray-600 uppercase">Regresar</span>
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Entradas por Almacén
      </h1>

      {almacenes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay almacenes registrados.</p>
        </div>
      ) : (
        almacenes.map((almacen) => (
          <div key={almacen.id} className="mb-6 bg-white rounded-lg shadow">
            <button
              onClick={() =>
                navigate(`/dashboard/entradas-compras/${almacen.id}`)
              }
              className="w-full flex justify-between items-center px-6 py-4
               text-left hover:bg-gray-50 transition-colors"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {almacen.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {entradasCount[almacen.id] || 0} entradas registradas
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default EntradasComprasPage;





