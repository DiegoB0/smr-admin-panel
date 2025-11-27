import React from "react";
import logo from "../../assets/logmine-logo.png";

const PrintableRequisicion = ({ requisicion, currentUser }) => {
  if (!requisicion) return null;

  // Obtener items según el tipo de requisición
  const getItems = () => {
    if (requisicion.requisicionType === "consumibles") {
      return requisicion.insumos || [];
    }
    if (requisicion.requisicionType === "refacciones") {
      return requisicion.refacciones || [];
    }
    if (requisicion.requisicionType === "filtros") {
      return requisicion.filtros || [];
    }
    return [];
  };

  const items = getItems();

  const subtotal = items.reduce((acc, it) => {
    const q = Number(it.cantidad) || 0;
    const p = Number(it.precio) || 0;
    return acc + q * p;
  }, 0);

  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <div
      id={`req-print-${requisicion.id}`}
      className="hidden print:block font-sans text-[12px] bg-white w-[1000px] mx-auto p-6 border border-black"
    >
      {/* Encabezado */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
        <img src={logo} alt="Logo" className="h-12" />
        <div className="text-right text-[13px]">
          <div>
            <strong>No. RCP:</strong> {requisicion.rcp || requisicion.id}
          </div>
          <div>
            <strong>Fecha:</strong>{" "}
            {requisicion.fechaSolicitud
              ? new Date(requisicion.fechaSolicitud).toLocaleDateString()
              : "N/A"}
          </div>
        </div>
      </div>

      {/* Título */}
      <h2 className="text-center font-bold text-lg tracking-wide mb-4 uppercase">
        Requisición de Compra
      </h2>

      {/* Bloques de información */}
      <div className="grid grid-cols-2 gap-4 border border-black p-3 mb-6">
        <div className="space-y-1">
          <div>
            <strong>Proveedor:</strong>{" "}
            {requisicion.proveedor?.name || "N/A"}
          </div>
          <div>
            <strong>Equipo:</strong> {requisicion.no_economico || "N/A"}
          </div>
          <div>
            <strong>No. Económico:</strong> {requisicion.no_economico || "N/A"}
          </div>
          <div>
            <strong>HRM:</strong> {requisicion.hrs || "N/A"}
          </div>
          <div>
            <strong>Solicita:</strong>{" "}
            {requisicion.pedidoPor?.name ||
              currentUser?.name ||
              "N/A"}
          </div>
          <div>
            <strong>Concepto:</strong> {requisicion.concepto || "N/A"}
          </div>
          <div>
            <strong>Método de pago:</strong>{" "}
            {requisicion.metodo_pago || "N/A"}
          </div>
        </div>

        <div className="space-y-1">
          <div>
            <strong>Prioridad:</strong> {requisicion.prioridad || "N/A"}
          </div>
          <div>
            <strong>Obra/Ubicación:</strong> {requisicion.titulo || "N/A"}
          </div>
          <div>
            <strong>Con cargo a:</strong>{" "}
            {requisicion.almacenCargo?.name || "N/A"}
          </div>
          <div>
            <strong>Status:</strong> {requisicion.status || "N/A"}
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <table className="w-full border-collapse mb-6 text-[12px]">
        <thead>
          <tr className="bg-[#0b3b7a] text-white text-center uppercase tracking-wide">
            {[
              "No.",
              "ID Producto",
              "Cantidad",
              "Unidad",
              "Descripción",
              "Costo Unitario",
              "Subtotal",
              "IVA",
              "Importe Total",
            ].map((head, i) => (
              <th
                key={i}
                className="border border-gray-300 px-2 py-2 font-semibold"
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((it, idx) => {
              const q = Number(it.cantidad) || 0;
              const p = Number(it.precio) || 0;
              const sub = q * p;
              const ivaItem = sub * 0.16;
              const totItem = sub + ivaItem;
              return (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border border-gray-300 text-center px-2 py-2">
                    {idx + 1}
                  </td>
                  <td className="border border-gray-300 text-center px-2 py-2">
                    {it.customId || "-"}
                  </td>
                  <td className="border border-gray-300 text-center px-2 py-2">
                    {q}
                  </td>
                  <td className="border border-gray-300 text-center px-2 py-2">
                    {it.unidad || ""}
                  </td>
                  <td className="border border-gray-300 text-left px-2 py-2">
                    {it.descripcion || ""}
                  </td>
                  <td className="border border-gray-300 text-right px-2 py-2">
                    ${p.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 text-right px-2 py-2">
                    ${sub.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 text-right px-2 py-2">
                    ${ivaItem.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 text-right px-2 py-2">
                    ${totItem.toFixed(2)}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={9}
                className="text-center px-2 py-4 text-gray-500"
              >
                No hay items en esta requisición
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-semibold">
            <td
              colSpan={5}
              className="border-t border-gray-400 text-right px-2 py-2"
            >
              Totales
            </td>
            <td className="border-t border-gray-400 text-right px-2 py-2"></td>
            <td className="border-t border-gray-400 text-right px-2 py-2">
              ${subtotal.toFixed(2)}
            </td>
            <td className="border-t border-gray-400 text-right px-2 py-2">
              ${iva.toFixed(2)}
            </td>
            <td className="border-t border-gray-400 text-right px-2 py-2">
              ${total.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Firmas */}
      <div className="flex justify-between mt-12 text-center text-[13px]">
        <div>
          <div className="border-t border-black w-40 mx-auto"></div>
          {requisicion.pedidoPor?.name ||
            currentUser?.name ||
            "Solicita"}
        </div>
        <div>
          <div className="border-t border-black w-40 mx-auto"></div>
          {requisicion.revisadoPor?.name ||
            "Ing. Francisco Salazar"}{" "}
          <br />
          Autoriza
        </div>
        <div>
          <div className="border-t border-black w-40 mx-auto"></div>
          Javier Santoyo Franco <br />
          Vo. Bo.
        </div>
      </div>
    </div>
  );
};

export default PrintableRequisicion;

