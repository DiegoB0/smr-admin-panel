import React from "react";
import logo from "../../assets/logmine-logo.png"; // Ajusta la ruta a tu proyecto

const PrintableBacklog = ({ reporte }) => {
  if (!reporte) return null;

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const componentes = [
    "MOTOR",
    "TRANSMISIÓN",
    "SIST. HIDRÁULICO",
    "TREN DE RODAJE",
    "HERRAMIENTAS DE CORTE",
    "SIST. ELÉCTRICO",
    "A/C",
    "SIST. ENFRIAMIENTO",
    "OTROS",
  ];

  const fases = [
    "CARRILERÍA",
    "ELEMENTOS DE DESGASTE",
    "PREVENTIVO",
    "LLANTAS",
    "LUBRICACIÓN",
    "MANTENIMIENTO MECÁNICO",
    "REPARACIÓN MAYOR",
    "OTROS",
  ];

  const normalize = (str) =>
    str
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ /g, "_")
      .replace(/\./g, "");

  // Añadir filas vacías para llegar a un mínimo de 15 filas en la tabla de items
  const minRows = 15;
  const itemRows = reporte.items || [];
  const emptyRows = Array.from({ length: Math.max(0, minRows - itemRows.length) }, () => ({}));

  return (
    <div
      id={`backlog-print-${reporte.id}`}
      className="hidden print:block font-sans text-[12px] bg-white w-[1000px] mx-auto p-6 border border-black"
    >
      {/* Encabezado */}
      <div className="flex justify-between items-start mb-4">
        <img src={logo} alt="Logo" className="h-10" />
        <div className="text-right text-[11px]">
          <p><strong>001-BLRP-2025</strong></p>
          <p><strong>VERSION: 01</strong></p>
          <p><strong>FECHA:</strong> {formatDate(reporte.fechaCreacion || reporte.createdAt)}</p>
          <p><strong>RCP:</strong> {reporte.rcp || "N/A"}</p>
        </div>
      </div>

      {/* Título */}
      <h2 className="text-center font-bold text-lg mb-4 uppercase">BACKLOG</h2>

      {/* Datos de Máquina */}
      <table className="w-full border-collapse mb-4 text-[12px]">
        <thead>
          <tr>
            <th className="border border-gray-300 px-2 py-1 text-left" colSpan={4}>DATOS DE MAQUINA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-2 py-1">EQUIPO</td>
            <td className="border border-gray-300 px-2 py-1">{reporte.equipo || ""}</td>
            <td className="border border-gray-300 px-2 py-1">HOROMETRO</td>
            <td className="border border-gray-300 px-2 py-1">{reporte.horometro || ""}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-2 py-1">MARCA</td>
            <td className="border border-gray-300 px-2 py-1">{reporte.modelo || ""}</td>
            <td className="border border-gray-300 px-2 py-1">SERIE</td>
            <td className="border border-gray-300 px-2 py-1">{reporte.serie || ""}</td>
          </tr>
        </tbody>
      </table>

      {/* Componente, Fase y Centro de Costos */}
      <table className="w-full border-collapse mb-4 text-[12px]">
        <thead>
          <tr>
            <th className="border border-gray-300 px-2 py-1 text-left" colSpan={2}>COMPONENTE</th>
            <th className="border border-gray-300 px-2 py-1 text-left" colSpan={2}>CENTRO DE COSTOS</th>
            <th className="border border-gray-300 px-2 py-1 text-left" colSpan={2}>FASE</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.max(componentes.length, fases.length) }).map((_, idx) => (
            <tr key={idx}>
              <td className="border border-gray-300 px-2 py-1">
                {componentes[idx] ? (
                  <>
                    {reporte.componentes?.includes(normalize(componentes[idx])) && "X "}
                    {componentes[idx]}
                  </>
                ) : ""}
              </td>
              <td className="border border-gray-300 px-2 py-1"></td>
              {idx < 3 ? (
                <td className="border border-gray-300 px-2 py-1" rowSpan={3}>PRIORIDAD</td>
              ) : null}
              {idx < 3 ? (
                <td className="border border-gray-300 px-2 py-1">
                  {idx === 0 ? "BAJA" : idx === 1 ? "MEDIA" : "ALTA"}
                </td>
              ) : idx >= 3 && idx < 6 ? (
                <td className="border border-gray-300 px-2 py-1" rowSpan={3}>CENTRO DE COSTOS</td>
              ) : null}
              {idx >= 3 && idx < 6 ? (
                <td className="border border-gray-300 px-2 py-1">
                  {idx === 3 ? "OBRA:" : idx === 4 ? "TALLER:" : "EXTERNO:"}
                </td>
              ) : (
                <td className="border border-gray-300 px-2 py-1"></td>
              )}
              <td className="border border-gray-300 px-2 py-1">
                {fases[idx] ? (
                  <>
                    {reporte.fases?.includes(normalize(fases[idx])) && "X "}
                    {fases[idx]}
                  </>
                ) : ""}
              </td>
              <td className="border border-gray-300 px-2 py-1"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Descripción de Requerimientos */}
      <div className="border border-black p-2 mb-4">
        <strong>DESCRIPCION DE REQUERIMENTOS</strong>
      </div>
      <div className="border border-black p-2 mb-6 min-h-[50px]">
        {reporte.observaciones || ""}
      </div>

      {/* Tabla de Items */}
      <table className="w-full border-collapse mb-6 text-[12px]">
        <thead>
          <tr>
            <th className="border border-gray-300 px-2 py-1">ITEM</th>
            <th className="border border-gray-300 px-2 py-1">No. PARTE</th>
            <th className="border border-gray-300 px-2 py-1">CANT.</th>
            <th className="border border-gray-300 px-2 py-1">DESCRIPCION</th>
            <th className="border border-gray-300 px-2 py-1">OBSERVACION</th>
          </tr>
        </thead>
        <tbody>
          {itemRows.map((item, idx) => (
            <tr key={idx}>
              <td className="border border-gray-300 px-2 py-1 text-center">{idx + 1}</td>
              <td className="border border-gray-300 px-2 py-1">{item.producto?.id || item.productoId || ""}</td>
              <td className="border border-gray-300 px-2 py-1 text-center">{item.cantidad || ""}</td>
              <td className="border border-gray-300 px-2 py-1">{item.producto?.name || ""}</td>
              <td className="border border-gray-300 px-2 py-1"></td>
            </tr>
          ))}
          {emptyRows.map((_, idx) => (
            <tr key={`empty-${idx}`}>
              <td className="border border-gray-300 px-2 py-1"></td>
              <td className="border border-gray-300 px-2 py-1"></td>
              <td className="border border-gray-300 px-2 py-1"></td>
              <td className="border border-gray-300 px-2 py-1"></td>
              <td className="border border-gray-300 px-2 py-1"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Firmas */}
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <th className="border border-gray-300 px-2 py-1">ELABORADO</th>
            <th className="border border-gray-300 px-2 py-1">REVISADO</th>
            <th className="border border-gray-300 px-2 py-1">REVISADO</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-2 py-1 text-center">SOLICITANTE</td>
            <td className="border border-gray-300 px-2 py-1 text-center">SUPERVISOR DE MANTENIMIENTO</td>
            <td className="border border-gray-300 px-2 py-1 text-center">SUPERVISIÓN DE PLANEACIÓN</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PrintableBacklog;