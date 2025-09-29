// Función para imprimir usando window.print
export const printRequisicion = (elementId, title) => {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      console.error("Elemento no encontrado:", elementId)
      return
    }

    // Crear una nueva ventana para imprimir
    const printWindow = window.open("", "_blank")

    // Obtener los estilos CSS del documento actual
    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n")
        } catch (e) {
          // Manejar CORS errors para stylesheets externos
          return ""
        }
      })
      .join("\n")

    // Crear el HTML para la ventana de impresión
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            ${styles}
            
            /* Estilos específicos para impresión */
            @media print {
              body { margin: 0; padding: 20px; }
              .hidden { display: block !important; }
              @page { margin: 15mm; }
            }
            
            /* Estilos del PDF */
            .pdf-card {
              box-sizing: border-box;
              width: 100%;
              max-width: 794px;
              padding: 16px;
              background: #ffffff;
              color: #111827;
              font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
              font-size: 12px;
              line-height: 1.4;
              border: 1px solid #e5e7eb;
            }
            
            .pdf-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 12px;
              margin-top: 8px;
            }
            
            .pdf-label {
              font-weight: 600;
              color: #374151;
              font-size: 11px;
              margin-bottom: 2px;
              text-transform: uppercase;
              letter-spacing: 0.02em;
            }
            
            .pdf-value {
              color: #111827;
              font-size: 12px;
              word-break: break-word;
            }
            
            .pdf-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 12px;
            }
            
            .pdf-table th,
            .pdf-table td {
              border: 1px solid #d1d5db;
              padding: 6px 8px;
              vertical-align: top;
              word-break: break-word;
            }
            
            .pdf-table th {
              background: #f3f4f6;
              color: #111827;
              font-weight: 700;
              text-align: left;
            }
            
            .pdf-footer {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              margin-top: 24px;
            }
            
            .pdf-sign {
              height: 64px;
              border-top: 1px solid #9ca3af;
              text-align: center;
              padding-top: 8px;
              font-weight: 600;
              color: #374151;
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `

    // Escribir el HTML en la nueva ventana
    printWindow.document.write(printHTML)
    printWindow.document.close()

    // Esperar a que se cargue y luego imprimir
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()

      // Cerrar la ventana después de imprimir (opcional)
      setTimeout(() => {
        printWindow.close()
      }, 1000)
    }
  } catch (error) {
    console.error("Error al imprimir:", error)
    alert("Error al abrir la ventana de impresión.")
  }
}
