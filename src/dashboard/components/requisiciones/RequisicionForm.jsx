"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2 } from "lucide-react"

const RequisicionForm = ({ requisicion, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    numero: "",
    fecha: new Date().toISOString().split("T")[0],
    proveedor: "ALMACEN CENTRAL",
    prioridad: "ALTA",
    equipo: "",
    obraUbicacion: "",
    numeroEconomico: "",
    conCargoA: "",
    hrm: "",
    hrmUltimoServ: "",
    solicita: "",
    hrmProxServ: "",
    concepto: "REFACCIÓN",
    hrsFaltantes: "",
    metodoPago: "ORDEN DE COMPRA",
    estatusEntrega: "PENDIENTE",
    datosAdicionales: "",
    nombreRcp: "",
    refacciones: [
      {
        numeroParte: "",
        cantidad: "",
        unidad: "PZAS",
        cargo: "",
        precioUnitario: 0,
        subTotal: 0,
        iva: 0,
        importeTotal: 0,
      },
    ],
  })

  useEffect(() => {
    if (requisicion) {
      setFormData({
        numero: requisicion.numero || "",
        fecha: requisicion.fecha || new Date().toISOString().split("T")[0],
        proveedor: requisicion.proveedor || "ALMACEN CENTRAL",
        prioridad: requisicion.prioridad || "ALTA",
        equipo: requisicion.equipo || "",
        obraUbicacion: requisicion.obraUbicacion || "",
        numeroEconomico: requisicion.numeroEconomico || "",
        conCargoA: requisicion.conCargoA || "",
        hrm: requisicion.hrm || "",
        hrmUltimoServ: requisicion.hrmUltimoServ || "",
        solicita: requisicion.solicita || "",
        hrmProxServ: requisicion.hrmProxServ || "",
        concepto: requisicion.concepto || "REFACCIÓN",
        hrsFaltantes: requisicion.hrsFaltantes || "",
        metodoPago: requisicion.metodoPago || "ORDEN DE COMPRA",
        estatusEntrega: requisicion.estatusEntrega || "PENDIENTE",
        datosAdicionales: requisicion.datosAdicionales || "",
        nombreRcp: requisicion.nombreRcp || "",
        refacciones: requisicion.refacciones || [
          {
            numeroParte: "",
            cantidad: "",
            unidad: "PZAS",
            cargo: "",
            precioUnitario: 0,
            subTotal: 0,
            iva: 0,
            importeTotal: 0,
          },
        ],
      })
    }
  }, [requisicion])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleRefaccionChange = (index, field, value) => {
    setFormData((prev) => {
      const newRefacciones = [...prev.refacciones]
      newRefacciones[index] = { ...newRefacciones[index], [field]: value }

      // Calcular automáticamente si es precio o cantidad
      if (field === "precioUnitario" || field === "cantidad") {
        const cantidad =
          field === "cantidad" ? Number.parseFloat(value) || 0 : Number.parseFloat(newRefacciones[index].cantidad) || 0
        const precio =
          field === "precioUnitario"
            ? Number.parseFloat(value) || 0
            : Number.parseFloat(newRefacciones[index].precioUnitario) || 0
        const subTotal = cantidad * precio
        const iva = subTotal * 0.16 // 16% IVA
        const importeTotal = subTotal + iva

        newRefacciones[index].subTotal = subTotal
        newRefacciones[index].iva = iva
        newRefacciones[index].importeTotal = importeTotal
      }

      return {
        ...prev,
        refacciones: newRefacciones,
      }
    })
  }

  const addRefaccion = () => {
    setFormData((prev) => ({
      ...prev,
      refacciones: [
        ...prev.refacciones,
        {
          numeroParte: "",
          cantidad: "",
          unidad: "PZAS",
          cargo: "",
          precioUnitario: 0,
          subTotal: 0,
          iva: 0,
          importeTotal: 0,
        },
      ],
    }))
  }

  const removeRefaccion = (index) => {
    if (formData.refacciones.length > 1) {
      setFormData((prev) => ({
        ...prev,
        refacciones: prev.refacciones.filter((_, i) => i !== index),
      }))
    }
  }

  const calculateTotal = () => {
    return formData.refacciones.reduce((total, refaccion) => {
      return total + (refaccion.importeTotal || 0)
    }, 0)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const total = calculateTotal()
    onSave({
      ...formData,
      total,
      estado: requisicion ? requisicion.estado : "pendiente",
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {requisicion ? "Editar Requisición" : "Nueva Requisición de Compra"}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Header de la requisición */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">REQUISICIÓN DE COMPRA</h1>
          </div>

          {/* Primera fila: NO, FECHA, PROVEEDOR, PRIORIDAD */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">NO.</label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => handleInputChange("numero", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="RCP4239"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">FECHA</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => handleInputChange("fecha", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">PROVEEDOR</label>
              <input
                type="text"
                value={formData.proveedor}
                onChange={(e) => handleInputChange("proveedor", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">PRIORIDAD</label>
              <select
                value={formData.prioridad}
                onChange={(e) => handleInputChange("prioridad", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALTA">ALTA</option>
                <option value="MEDIA">MEDIA</option>
                <option value="BAJA">BAJA</option>
              </select>
            </div>
          </div>

          {/* Segunda sección: Información del equipo */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">EQUIPO</label>
              <input
                type="text"
                value={formData.equipo}
                onChange={(e) => handleInputChange("equipo", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VIBRO CAT 0457"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">OBRA/UBICACIÓN</label>
              <input
                type="text"
                value={formData.obraUbicacion}
                onChange={(e) => handleInputChange("obraUbicacion", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="PEÑASQUITO"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">NO. ECONÓMICO</label>
              <input
                type="text"
                value={formData.numeroEconomico}
                onChange={(e) => handleInputChange("numeroEconomico", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VC-457"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">CON CARGO A</label>
              <input
                type="text"
                value={formData.conCargoA}
                onChange={(e) => handleInputChange("conCargoA", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="PEÑASQUITO"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">HRM</label>
              <input
                type="text"
                value={formData.hrm}
                onChange={(e) => handleInputChange("hrm", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="148.6"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">HRM ÚLTIMO SERV.</label>
              <input
                type="text"
                value={formData.hrmUltimoServ}
                onChange={(e) => handleInputChange("hrmUltimoServ", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">SOLICITA</label>
              <input
                type="text"
                value={formData.solicita}
                onChange={(e) => handleInputChange("solicita", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="FATIMA GONZALEZ"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">HRM PRÓX. SERV.</label>
              <input
                type="text"
                value={formData.hrmProxServ}
                onChange={(e) => handleInputChange("hrmProxServ", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">CONCEPTO</label>
              <input
                type="text"
                value={formData.concepto}
                onChange={(e) => handleInputChange("concepto", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">HRS FALTANTES</label>
              <input
                type="text"
                value={formData.hrsFaltantes}
                onChange={(e) => handleInputChange("hrsFaltantes", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">MÉTODO DE PAGO</label>
              <select
                value={formData.metodoPago}
                onChange={(e) => handleInputChange("metodoPago", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ORDEN DE COMPRA">ORDEN DE COMPRA</option>
                <option value="EFECTIVO">EFECTIVO</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">ESTATUS DE ENTREGA</label>
              <select
                value={formData.estatusEntrega}
                onChange={(e) => handleInputChange("estatusEntrega", e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="EN PROCESO">EN PROCESO</option>
                <option value="ENTREGADO">ENTREGADO</option>
              </select>
            </div>
          </div>

          {/* Datos adicionales */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-1">DATOS ADICIONALES</label>
            <textarea
              rows={3}
              value={formData.datosAdicionales}
              onChange={(e) => handleInputChange("datosAdicionales", e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="REFACCION PARA GATOS DE COFRE DE VIBRO CAT 0457"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-1">NOMBRE RCP</label>
            <input
              type="text"
              value={formData.nombreRcp}
              onChange={(e) => handleInputChange("nombreRcp", e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="REFACCION PARA GATOS DE COFRE DE VIBRO VC-457"
            />
          </div>

          {/* Tabla de refacciones */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">REFACCIONES</h3>
              <button
                type="button"
                onClick={addRefaccion}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Agregar Refacción
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-2 border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-2 text-xs font-bold">N° DE PARTE</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-bold">CANTIDAD</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-bold">UNIDAD</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-bold">CARGO</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-bold">PRECIO UNITARIO</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-bold">SUB TOTAL</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-bold">IVA</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-bold">IMPORTE TOTAL</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-bold">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.refacciones.map((refaccion, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={refaccion.numeroParte}
                          onChange={(e) => handleRefaccionChange(index, "numeroParte", e.target.value)}
                          className="w-full px-2 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                          placeholder="354-0319"
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          value={refaccion.cantidad}
                          onChange={(e) => handleRefaccionChange(index, "cantidad", e.target.value)}
                          className="w-full px-2 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                          placeholder="2"
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <select
                          value={refaccion.unidad}
                          onChange={(e) => handleRefaccionChange(index, "unidad", e.target.value)}
                          className="w-full px-2 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="PZAS">PZAS</option>
                          <option value="KG">KG</option>
                          <option value="LTS">LTS</option>
                          <option value="MTS">MTS</option>
                        </select>
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={refaccion.cargo}
                          onChange={(e) => handleRefaccionChange(index, "cargo", e.target.value)}
                          className="w-full px-2 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                          placeholder="VIBRO CAT 0457"
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          step="0.01"
                          value={refaccion.precioUnitario}
                          onChange={(e) => handleRefaccionChange(index, "precioUnitario", e.target.value)}
                          className="w-full px-2 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="border border-gray-300 p-1 text-xs text-center">
                        ${refaccion.subTotal.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 p-1 text-xs text-center">${refaccion.iva.toFixed(2)}</td>
                      <td className="border border-gray-300 p-1 text-xs text-center">
                        ${refaccion.importeTotal.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        {formData.refacciones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRefaccion(index)}
                            className="text-red-600 hover:text-red-800"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Filas vacías para completar el formato */}
                  {Array.from({ length: Math.max(0, 15 - formData.refacciones.length) }).map((_, index) => (
                    <tr key={`empty-${index}`}>
                      <td className="border border-gray-300 p-1 h-8"></td>
                      <td className="border border-gray-300 p-1"></td>
                      <td className="border border-gray-300 p-1"></td>
                      <td className="border border-gray-300 p-1"></td>
                      <td className="border border-gray-300 p-1 text-center text-xs">-$</td>
                      <td className="border border-gray-300 p-1 text-center text-xs">-$</td>
                      <td className="border border-gray-300 p-1 text-center text-xs">-$</td>
                      <td className="border border-gray-300 p-1 text-center text-xs">-$</td>
                      <td className="border border-gray-300 p-1"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Firmas */}
          <div className="grid grid-cols-3 gap-8 mt-8 pt-8 border-t-2">
            <div className="text-center">
              <div className="border-b-2 border-gray-400 mb-2 pb-8">
                <p className="font-bold">{formData.solicita || "NOMBRE DEL SOLICITANTE"}</p>
              </div>
              <p className="text-sm font-bold">Solicita</p>
            </div>
            <div className="text-center">
              <div className="border-b-2 border-gray-400 mb-2 pb-8">
                <p className="font-bold">Ing Francisco Salazar Mendia</p>
              </div>
              <p className="text-sm font-bold">Autoriza</p>
            </div>
            <div className="text-center">
              <div className="border-b-2 border-gray-400 mb-2 pb-8">
                <p className="font-bold">Ing.Javier santoyo</p>
              </div>
              <p className="text-sm font-bold">Vo Bo</p>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end mt-6">
            <div className="text-xl font-bold">TOTAL: ${calculateTotal().toFixed(2)}</div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
              {requisicion ? "Actualizar" : "Crear"} Requisición
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RequisicionForm
