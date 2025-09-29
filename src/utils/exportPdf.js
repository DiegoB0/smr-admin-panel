import jsPDF from "jspdf"
import html2canvas from "html2canvas"

// Función mejorada para exportar requisición a PDF con debugging
export async function exportRequisicionPDF(elementId, fileName = "requisicion.pdf") {
  try {
    console.log("🔍 Buscando elemento con ID:", elementId)

    const elemento = document.getElementById(elementId)
    if (!elemento) {
      throw new Error(`Elemento con ID ${elementId} no encontrado`)
    }

    console.log("✅ Elemento encontrado:", elemento)
    console.log("📏 Dimensiones del elemento:", {
      width: elemento.offsetWidth,
      height: elemento.offsetHeight,
      scrollWidth: elemento.scrollWidth,
      scrollHeight: elemento.scrollHeight,
    })

    // Verificar que el elemento tenga contenido visible
    if (elemento.offsetWidth === 0 || elemento.offsetHeight === 0) {
      throw new Error("El elemento no tiene dimensiones visibles")
    }

    // Hacer visible temporalmente si está oculto
    const originalDisplay = elemento.style.display
    const originalVisibility = elemento.style.visibility
    const originalPosition = elemento.style.position

    if (originalDisplay === "none") {
      elemento.style.display = "block"
      elemento.style.visibility = "visible"
      elemento.style.position = "absolute"
      elemento.style.left = "-9999px"
    }

    console.log("📸 Generando canvas...")

    // Configuración mejorada para html2canvas
    const canvas = await html2canvas(elemento, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: elemento.scrollWidth,
      height: elemento.scrollHeight,
      logging: true, // Habilitar logging para debug
      onclone: (clonedDoc) => {
        console.log("📋 Documento clonado para canvas")
        // Asegurar que los estilos se apliquen en el clon
        const clonedElement = clonedDoc.getElementById(elementId)
        if (clonedElement) {
          clonedElement.style.display = "block"
          clonedElement.style.visibility = "visible"
          clonedElement.style.position = "static"
        }
      },
    })

    // Restaurar estilos originales
    if (originalDisplay === "none") {
      elemento.style.display = originalDisplay
      elemento.style.visibility = originalVisibility
      elemento.style.position = originalPosition
    }

    console.log("✅ Canvas generado:", {
      width: canvas.width,
      height: canvas.height,
    })

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("El canvas generado está vacío")
    }

    const imgData = canvas.toDataURL("image/png")
    console.log("🖼️ Imagen generada, tamaño:", imgData.length)

    const pdf = new jsPDF("p", "mm", "a4")

    // Calcular dimensiones para ajustar a A4
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 295 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    console.log("📄 Añadiendo imagen al PDF...")

    // Añadir primera página
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Añadir páginas adicionales si es necesario
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Descargar el PDF
    pdf.save(fileName)
    console.log("✅ PDF guardado:", fileName)

    return { success: true, message: "PDF generado correctamente" }
  } catch (error) {
    console.error("❌ Error al generar PDF:", error)
    return { success: false, message: error.message }
  }
}

// Función para cargar imagen como base64
async function cargarImagenBase64(imagePath) {
  try {
    const response = await fetch(imagePath)
    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.warn("No se pudo cargar la imagen:", imagePath)
    return null
  }
}

// Función alternativa que genera PDF directamente sin html2canvas
export async function generarPDFRequisicionDirecto(requisicion, fileName) {
  try {
    console.log("📄 Generando PDF directo para requisición:", requisicion.id)

    const pdf = new jsPDF("p", "mm", "a4")

    // Intentar cargar el logo
    let logoBase64 = null
    try {
      logoBase64 = await cargarImagenBase64("/assets/logmine-logo.png")
      console.log("🖼️ Logo cargado correctamente")
    } catch (error) {
      console.warn("⚠️ No se pudo cargar el logo:", error)
    }

    // Configurar fuentes
    pdf.setFont("helvetica", "normal")

    // Header con logo y título
    pdf.setLineWidth(0.5)
    pdf.rect(10, 10, 190, 25) // Rectángulo del header más alto para el logo

    // Añadir logo si se cargó correctamente
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, "PNG", 15, 12, 40, 20) // x, y, width, height
      } catch (error) {
        console.warn("⚠️ Error al añadir logo al PDF:", error)
      }
    } else {
      // Si no hay logo, mostrar texto LOGMINE
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("LOGMINE", 15, 25)
    }

    // Título principal
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("REQUISICIÓN DE COMPRA", 105, 22, { align: "center" })

    // Subtítulo con dirección
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "normal")
    pdf.text("SOPORTE INTELIGENTE A LA MINERÍA", 105, 28, { align: "center" })

    let yPos = 45

    // Función helper para crear celdas
    const crearCelda = (x, y, width, height, label, value, fontSize = 9) => {
      pdf.rect(x, y, width, height)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(7)
      pdf.text(label, x + 2, y + 4)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(fontSize)
      pdf.text(String(value || ""), x + 2, y + height - 2)
    }

    // Primera fila de información
    crearCelda(10, yPos, 45, 12, "NO. RCP", requisicion.rcp || "N/A")
    crearCelda(
      55,
      yPos,
      45,
      12,
      "FECHA",
      requisicion.fechaSolicitud ? new Date(requisicion.fechaSolicitud).toLocaleDateString("es-MX") : "N/A",
    )
    crearCelda(100, yPos, 45, 12, "PRIORIDAD", requisicion.prioridad || "N/A")
    crearCelda(145, yPos, 45, 12, "ESTATUS", requisicion.status || "N/A")

    yPos += 15

    // Segunda fila
    crearCelda(10, yPos, 60, 12, "PROVEEDOR", requisicion.proveedor?.name || "N/A")
    crearCelda(70, yPos, 60, 12, "OBRA/UBICACIÓN", requisicion.almacenDestino?.name || "N/A")
    crearCelda(130, yPos, 60, 12, "CON CARGO A", requisicion.almacenCargo?.name || "N/A")

    yPos += 15

    // Tercera fila
    crearCelda(10, yPos, 60, 12, "EQUIPO", requisicion.equipo?.equipo || "N/A")
    crearCelda(70, yPos, 60, 12, "NO. ECONÓMICO", requisicion.equipo?.no_economico || "N/A")
    crearCelda(130, yPos, 60, 12, "SOLICITA", requisicion.pedidoPor?.name || "N/A")

    yPos += 15

    // Concepto
    crearCelda(10, yPos, 180, 12, "CONCEPTO", requisicion.concepto || "N/A")

    yPos += 20

    // Tabla de items
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(10)
    pdf.text("DETALLE DE ITEMS", 10, yPos)

    yPos += 8

    // Headers de la tabla
    const colWidths = [15, 25, 25, 70, 30, 25]
    const headers = ["NO.", "CANT.", "UNIDAD", "DESCRIPCIÓN", "P. UNIT.", "SUBTOTAL"]

    let xPos = 10
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(8)

    headers.forEach((header, index) => {
      pdf.rect(xPos, yPos, colWidths[index], 8)
      pdf.text(header, xPos + 2, yPos + 5)
      xPos += colWidths[index]
    })

    yPos += 8

    // Items
    pdf.setFont("helvetica", "normal")
    let total = 0

    if (requisicion.items && requisicion.items.length > 0) {
      requisicion.items.forEach((item, index) => {
        if (yPos > 240) {
          // Ajustado para dejar espacio para firmas
          pdf.addPage()
          yPos = 20
        }

        const cantidad = Number(item.cantidad) || 0
        const precioUnitario = Number(item.precio_unitario) || 0
        const subtotal = cantidad * precioUnitario
        total += subtotal

        xPos = 10

        // Número
        pdf.rect(xPos, yPos, colWidths[0], 8)
        pdf.text(String(index + 1), xPos + 2, yPos + 5)
        xPos += colWidths[0]

        // Cantidad
        pdf.rect(xPos, yPos, colWidths[1], 8)
        pdf.text(String(cantidad), xPos + 2, yPos + 5)
        xPos += colWidths[1]

        // Unidad
        pdf.rect(xPos, yPos, colWidths[2], 8)
        pdf.text(item.unidad || "", xPos + 2, yPos + 5)
        xPos += colWidths[2]

        // Descripción
        pdf.rect(xPos, yPos, colWidths[3], 8)
        const descripcion = item.descripcion || ""
        const descripcionCorta = descripcion.length > 40 ? descripcion.substring(0, 40) + "..." : descripcion
        pdf.text(descripcionCorta, xPos + 2, yPos + 5)
        xPos += colWidths[3]

        // Precio unitario
        pdf.rect(xPos, yPos, colWidths[4], 8)
        pdf.text(`$${precioUnitario.toFixed(2)}`, xPos + 2, yPos + 5)
        xPos += colWidths[4]

        // Subtotal
        pdf.rect(xPos, yPos, colWidths[5], 8)
        pdf.text(`$${subtotal.toFixed(2)}`, xPos + 2, yPos + 5)

        yPos += 8
      })
    }

    // Filas vacías para completar
    const itemsCount = requisicion.items?.length || 0
    const filasVacias = Math.max(0, 8 - itemsCount)

    for (let i = 0; i < filasVacias; i++) {
      if (yPos > 240) {
        pdf.addPage()
        yPos = 20
      }

      xPos = 10
      colWidths.forEach((width) => {
        pdf.rect(xPos, yPos, width, 8)
        xPos += width
      })
      yPos += 8
    }

    // Total
    yPos += 5
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(10)
    pdf.text("IMPORTE TOTAL:", 140, yPos)
    pdf.text(`$${total.toFixed(2)}`, 170, yPos)

    // Verificar si necesitamos nueva página para las firmas
    if (yPos > 240) {
      pdf.addPage()
      yPos = 30
    } else {
      yPos += 25
    }

    // Firmas con nombres fijos
    const firmaWidth = 50
    const firmaSpacing = 60

    // Líneas para firmas
    pdf.line(20, yPos, 20 + firmaWidth, yPos)
    pdf.line(20 + firmaSpacing, yPos, 20 + firmaSpacing + firmaWidth, yPos)
    pdf.line(20 + firmaSpacing * 2, yPos, 20 + firmaSpacing * 2 + firmaWidth, yPos)

    // Nombres de las personas que firman
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "normal")

    // SOLICITA - nombre del solicitante
    const solicitante = requisicion.pedidoPor?.name || "SOLICITANTE"
    pdf.text(solicitante, 20 + firmaWidth / 2, yPos - 3, { align: "center" })

    // AUTORIZA - nombre fijo
    pdf.text("ING FRANCISCO SALAZAR", 20 + firmaSpacing + firmaWidth / 2, yPos - 3, { align: "center" })

    // VO.BO. - nombre fijo
    pdf.text("JAVIER SANTOYO FRANCO", 20 + firmaSpacing * 2 + firmaWidth / 2, yPos - 3, { align: "center" })

    // Etiquetas de firmas
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.text("SOLICITA", 20 + firmaWidth / 2, yPos + 8, { align: "center" })
    pdf.text("AUTORIZA", 20 + firmaSpacing + firmaWidth / 2, yPos + 8, { align: "center" })
    pdf.text("VO. BO.", 20 + firmaSpacing * 2 + firmaWidth / 2, yPos + 8, { align: "center" })

    // Guardar
    const finalFileName =
      fileName || `RCP-${requisicion.rcp || requisicion.id}-${new Date().toISOString().split("T")[0]}.pdf`
    pdf.save(finalFileName)

    console.log("✅ PDF directo generado:", finalFileName)
    return { success: true, message: "PDF generado correctamente" }
  } catch (error) {
    console.error("❌ Error al generar PDF directo:", error)
    return { success: false, message: error.message }
  }
}

// Función para verificar que el elemento existe y es visible
export function verificarElementoPDF(elementId) {
  const elemento = document.getElementById(elementId)

  if (!elemento) {
    console.error("❌ Elemento no encontrado:", elementId)
    return false
  }

  const estilos = window.getComputedStyle(elemento)
  const esVisible =
    estilos.display !== "none" &&
    estilos.visibility !== "hidden" &&
    elemento.offsetWidth > 0 &&
    elemento.offsetHeight > 0

  console.log("🔍 Verificación del elemento:", {
    id: elementId,
    existe: !!elemento,
    display: estilos.display,
    visibility: estilos.visibility,
    width: elemento.offsetWidth,
    height: elemento.offsetHeight,
    esVisible,
  })

  return esVisible
}
