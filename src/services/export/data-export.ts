/**
 * Data Export Service
 * Exports analytics data, MIRROR reports, and brand data to CSV and PDF formats
 */

/**
 * Convert data array to CSV string
 */
export function convertToCSV(data: any[], headers?: string[]): string {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  // Extract headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0])

  // Build CSV rows
  const csvRows = [
    csvHeaders.join(','), // Header row
    ...data.map(row => {
      return csvHeaders.map(header => {
        const value = row[header]

        // Handle different data types
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""')
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }
        return String(value)
      }).join(',')
    })
  ]

  return csvRows.join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(data: any[], filename: string, headers?: string[]): void {
  try {
    const csv = convertToCSV(data, headers)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('[DataExport] CSV export failed:', error)
    throw new Error(`Failed to export CSV: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Convert data to simple HTML table
 */
export function convertToHTMLTable(data: any[], title?: string, headers?: string[]): string {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  const tableHeaders = headers || Object.keys(data[0])

  const headerRow = tableHeaders.map(h => `<th>${h}</th>`).join('')
  const bodyRows = data.map(row => {
    const cells = tableHeaders.map(header => {
      const value = row[header]
      if (value === null || value === undefined) return '<td></td>'
      if (typeof value === 'object') return `<td>${JSON.stringify(value)}</td>`
      return `<td>${String(value)}</td>`
    }).join('')
    return `<tr>${cells}</tr>`
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title || 'Export'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        ${title ? `<h1>${title}</h1>` : ''}
        <p>Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead><tr>${headerRow}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </body>
    </html>
  `
}

/**
 * Download PDF file (prints HTML table to PDF)
 * NOTE: This uses browser's print-to-PDF functionality
 * For production, consider using a library like jsPDF or pdfmake
 */
export function downloadPDF(data: any[], filename: string, title?: string, headers?: string[]): void {
  try {
    const html = convertToHTMLTable(data, title, headers)

    // Create a hidden iframe
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'

    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) throw new Error('Could not access iframe document')

    iframeDoc.open()
    iframeDoc.write(html)
    iframeDoc.close()

    // Wait for content to load, then print
    setTimeout(() => {
      iframe.contentWindow?.print()

      // Clean up after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }, 500)
  } catch (error) {
    console.error('[DataExport] PDF export failed:', error)
    throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Export analytics data to CSV
 */
export function exportAnalyticsCSV(
  metrics: any[],
  filename: string = 'analytics-export'
): void {
  const headers = ['date', 'platform', 'metric_type', 'value', 'change']
  downloadCSV(metrics, filename, headers)
}

/**
 * Export analytics data to PDF
 */
export function exportAnalyticsPDF(
  metrics: any[],
  title: string = 'Analytics Report',
  filename: string = 'analytics-report'
): void {
  const headers = ['date', 'platform', 'metric_type', 'value', 'change']
  downloadPDF(metrics, filename, title, headers)
}

/**
 * Export MIRROR section data to CSV
 */
export function exportMIRRORSectionCSV(
  sectionName: string,
  sectionData: any,
  brandName: string
): void {
  try {
    // Convert MIRROR section data to flat array
    const flatData = flattenMIRRORData(sectionData)
    const filename = `${brandName}-${sectionName}-${new Date().toISOString().split('T')[0]}`
    downloadCSV(flatData, filename)
  } catch (error) {
    console.error('[DataExport] MIRROR CSV export failed:', error)
    throw error
  }
}

/**
 * Export MIRROR section data to PDF
 */
export function exportMIRRORSectionPDF(
  sectionName: string,
  sectionData: any,
  brandName: string
): void {
  try {
    const flatData = flattenMIRRORData(sectionData)
    const title = `${brandName} - ${sectionName.toUpperCase()} Report`
    const filename = `${brandName}-${sectionName}-report`
    downloadPDF(flatData, filename, title)
  } catch (error) {
    console.error('[DataExport] MIRROR PDF export failed:', error)
    throw error
  }
}

/**
 * Flatten MIRROR section data for export
 */
function flattenMIRRORData(data: any): any[] {
  if (!data) return []

  const flattened: any[] = []

  // Handle different MIRROR section structures
  if (Array.isArray(data)) {
    return data
  }

  // Convert object to key-value pairs
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          flattened.push({ category: key, index, ...item })
        } else {
          flattened.push({ category: key, index, value: item })
        }
      })
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([subKey, subValue]) => {
        flattened.push({ category: key, field: subKey, value: subValue })
      })
    } else {
      flattened.push({ field: key, value })
    }
  })

  return flattened
}

/**
 * Export brand report (full MIRROR data) to CSV
 */
export function exportBrandReportCSV(
  brandName: string,
  mirrorData: any
): void {
  try {
    const allData: any[] = []

    // Combine all MIRROR sections
    Object.entries(mirrorData).forEach(([section, data]) => {
      const flatData = flattenMIRRORData(data)
      flatData.forEach(row => {
        allData.push({ section, ...row })
      })
    })

    const filename = `${brandName}-full-report-${new Date().toISOString().split('T')[0]}`
    downloadCSV(allData, filename)
  } catch (error) {
    console.error('[DataExport] Brand report CSV export failed:', error)
    throw error
  }
}

/**
 * Export brand report (full MIRROR data) to PDF
 */
export function exportBrandReportPDF(
  brandName: string,
  mirrorData: any
): void {
  try {
    const allData: any[] = []

    // Combine all MIRROR sections
    Object.entries(mirrorData).forEach(([section, data]) => {
      const flatData = flattenMIRRORData(data)
      flatData.forEach(row => {
        allData.push({ section, ...row })
      })
    })

    const title = `${brandName} - Complete MIRROR Report`
    const filename = `${brandName}-full-report`
    downloadPDF(allData, filename, title)
  } catch (error) {
    console.error('[DataExport] Brand report PDF export failed:', error)
    throw error
  }
}

/**
 * Export content calendar to CSV
 */
export function exportContentCalendarCSV(
  items: any[],
  brandName: string
): void {
  const headers = ['scheduled_date', 'platform', 'content_type', 'copy', 'status', 'engagement_score']
  const filename = `${brandName}-content-calendar-${new Date().toISOString().split('T')[0]}`
  downloadCSV(items, filename, headers)
}

/**
 * Export competitor analysis to CSV
 */
export function exportCompetitorAnalysisCSV(
  competitors: any[],
  brandName: string
): void {
  const filename = `${brandName}-competitor-analysis-${new Date().toISOString().split('T')[0]}`
  downloadCSV(competitors, filename)
}
