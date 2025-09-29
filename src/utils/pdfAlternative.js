// Alternativa usando jsPDF y html2canvas para mayor compatibilidad
export const exportRequisicionPDFAlternative = async (elementId, filename) => {
  try {
    // Importar librerías dinámicamente
    const jsPDF = (await import("jspdf")).default
    const html2canvas = (await import("html2canvas")).default

    const element = document.getElementById(elementId)
    if (!element) {
      console.error("Elemento no encontrado:", elementId)
      return
    }

    // Temporalmente hacer visible el elemento
    const originalDisplay = element.style.display
    const originalVisibility = element.style.visibility
    const originalPosition = element.style.position
    const originalLeft = element.style.left
    const originalTop = element.style.top

    // Hacer visible temporalmente fuera de la vista
    element.style.display = "block"
    element.style.visibility = "visible"
    element.style.position = "absolute"
    element.style.left = "-9999px"
    element.style.top = "-9999px"

    // Capturar el elemento como imagen
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    })

    // Restaurar estilos originales
    element.style.display = originalDisplay
    element.style.visibility = originalVisibility
    element.style.position = originalPosition
    element.style.left = originalLeft
    element.style.top = originalTop

    // Crear PDF
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("p", "mm", "a4")

    // Calcular dimensiones
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 295 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    // Agregar primera página
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Agregar páginas adicionales si es necesario
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Descargar el PDF
    pdf.save(filename)
  } catch (error) {
    console.error("Error al generar PDF alternativo:", error)
    alert("Error al generar el PDF. Verifica que las librerías estén instaladas.")
  }
}
