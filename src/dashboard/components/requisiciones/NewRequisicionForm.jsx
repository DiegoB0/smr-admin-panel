import React, { useState } from "react";

const NewRequisicionForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    almacenCargoId: "",
    almacenDestinoId: "",
    cantidadDinero: "",
    description: "",
    concepto: "",
    prioridad: "alta",
    metodoPago: "tarjeta",
    requisicionType: "service",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-xl font-semibold">Nueva Requisición</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <input
              type="number"
              name="almacenCargoId"
              value={formData.almacenCargoId}
              onChange={handleChange}
              placeholder="Almacen Cargo ID"
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="number"
              name="almacenDestinoId"
              value={formData.almacenDestinoId}
              onChange={handleChange}
              placeholder="Almacen Destino ID"
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="number"
              name="cantidadDinero"
              value={formData.cantidadDinero}
              onChange={handleChange}
              placeholder="Cantidad Dinero"
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción"
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              name="concepto"
              value={formData.concepto}
              onChange={handleChange}
              placeholder="Concepto"
              className="w-full px-3 py-2 border rounded"
            />
            <select name="prioridad" value={formData.prioridad} onChange={handleChange} className="w-full px-3 py-2 border rounded">
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
            <select name="metodoPago" value={formData.metodoPago} onChange={handleChange} className="w-full px-3 py-2 border rounded">
              <option value="tarjeta">Tarjeta</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onCancel} className="px-6 py-2 text-gray-700 border rounded hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRequisicionForm;