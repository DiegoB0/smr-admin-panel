import jsPDF from "jspdf"
import html2canvas from "html2canvas"

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

// Función para generar PDF usando jsPDF + html2canvas
export async function generarPDFDesdeElemento(elementId, nombreArchivo = "vale-salida") {
  try {
    const elemento = document.getElementById(elementId)
    if (!elemento) {
      throw new Error(`Elemento con ID ${elementId} no encontrado`)
    }

    // Crear canvas del elemento
    const canvas = await html2canvas(elemento, {
      scale: 2, // Mayor calidad
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    })

    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("p", "mm", "a4")

    // Calcular dimensiones
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 295 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

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
    pdf.save(`${nombreArchivo}-${new Date().toISOString().split("T")[0]}.pdf`)

    return { success: true, message: "PDF generado correctamente" }
  } catch (error) {
    console.error("Error al generar PDF:", error)
    return { success: false, message: error.message }
  }
}

// Función para generar PDF con datos estructurados para vales
export async function generarPDFVale(valeData) {
  try {
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

    // Header con logo
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, "PNG", 20, 15, 40, 20) // x, y, width, height
      } catch (error) {
        console.warn("⚠️ Error al añadir logo al PDF:", error)
        // Fallback: mostrar texto LOGMINE
        pdf.setFontSize(16)
        pdf.setFont("helvetica", "bold")
        pdf.text("LOGMINE", 20, 30)
      }
    } else {
      // Si no hay logo, mostrar texto LOGMINE
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("LOGMINE", 20, 30)
    }

    // Título y dirección
    pdf.setFontSize(20)
    pdf.setFont("helvetica", "bold")
    pdf.text("VALE DE SALIDA", 105, 25, { align: "center" })

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text("MANUEL M. DIEGUEZ #619 - A, COL. SANTA TERESITA, C.P. 44600, GUADALAJARA, JAL.", 105, 35, {
      align: "center",
    })

    // Datos del vale
    let yPosition = 50

    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("INFORMACIÓN DEL VALE", 20, yPosition)

    yPosition += 10
    pdf.setFont("helvetica", "normal")
    pdf.text(`Folio: ${valeData.id}`, 20, yPosition)
    pdf.text(`Fecha: ${valeData.fecha}`, 120, yPosition)

    yPosition += 8
    pdf.text(`Proyecto: ${valeData.proyecto || valeData.equipo}`, 20, yPosition)

    yPosition += 8
    pdf.text(`Solicitante: ${valeData.solicitante}`, 20, yPosition)

    if (valeData.responsable) {
      yPosition += 8
      pdf.text(`Responsable: ${valeData.responsable}`, 20, yPosition)
    }

    // Tabla de productos
    yPosition += 20
    pdf.setFont("helvetica", "bold")
    pdf.text("PRODUCTOS", 20, yPosition)

    yPosition += 10

    // Headers de la tabla
    pdf.setFontSize(10)
    pdf.text("CANT.", 20, yPosition)
    pdf.text("No. DE PARTE", 40, yPosition)
    pdf.text("DESCRIPCIÓN", 80, yPosition)

    // Línea separadora
    pdf.line(20, yPosition + 2, 190, yPosition + 2)

    yPosition += 8

    // Productos
    pdf.setFont("helvetica", "normal")
    valeData.productos.forEach((producto) => {
      if (yPosition > 220) {
        // Dejar espacio para firmas
        // Nueva página si es necesario
        pdf.addPage()
        yPosition = 20
      }

      pdf.text(producto.cantidad.toString(), 20, yPosition)
      pdf.text(producto.numeroPieza || "", 40, yPosition)

      // Dividir descripción larga
      const descripcion = producto.nombre || producto.descripcion || ""
      const lineasDescripcion = pdf.splitTextToSize(descripcion, 100)
      pdf.text(lineasDescripcion, 80, yPosition)

      yPosition += Math.max(6, lineasDescripcion.length * 4)
    })

    // Verificar si necesitamos nueva página para las firmas
    if (yPosition > 220) {
      pdf.addPage()
      yPosition = 30
    } else {
      yPosition += 30
    }

    // Firmas con nombres fijos
    pdf.setFont("helvetica", "bold")
    pdf.text("FIRMAS", 20, yPosition)

    yPosition += 20

    // Espacios para firmas
    const firmaWidth = 50
    const firmaSpacing = 60

    pdf.line(20, yPosition, 20 + firmaWidth, yPosition)
    pdf.line(20 + firmaSpacing, yPosition, 20 + firmaSpacing + firmaWidth, yPosition)
    pdf.line(20 + firmaSpacing * 2, yPosition, 20 + firmaSpacing * 2 + firmaWidth, yPosition)

    // Nombres de las personas que firman
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "normal")

    // AUTORIZA - nombre fijo
    pdf.text("ING FRANCISCO SALAZAR", 20 + firmaWidth / 2, yPosition - 3, { align: "center" })

    // ALMACÉN - puede ser variable o fijo
    pdf.text("ALMACÉN", 20 + firmaSpacing + firmaWidth / 2, yPosition - 3, { align: "center" })

    // RECIBE - nombre del responsable o solicitante
    const recibe = valeData.responsable || valeData.solicitante || "RECIBE"
    pdf.text(recibe, 20 + firmaSpacing * 2 + firmaWidth / 2, yPosition - 3, { align: "center" })

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "bold")
    pdf.text("AUTORIZA", 20 + firmaWidth / 2, yPosition + 8, { align: "center" })
    pdf.text("ALMACÉN", 20 + firmaSpacing + firmaWidth / 2, yPosition + 8, { align: "center" })
    pdf.text("RECIBE", 20 + firmaSpacing * 2 + firmaWidth / 2, yPosition + 8, { align: "center" })

    // Descargar
    pdf.save(`vale-salida-${valeData.id}-${new Date().toISOString().split("T")[0]}.pdf`)

    return { success: true, message: "PDF generado correctamente" }
  } catch (error) {
    console.error("Error al generar PDF:", error)
    return { success: false, message: error.message }
  }
}
