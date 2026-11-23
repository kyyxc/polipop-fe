import { formatRupiah } from './format.js'

const PDF_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js'
const XLSX_CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'

const HEADERS = ['No', 'Barcode', 'Nama', 'Category', 'Harga', 'Stock', 'Unit']

let pdfPromise = null
let xlsxPromise = null

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('Gagal memuat library export. Periksa koneksi internet.'))
    document.head.appendChild(script)
  })
}

async function ensurePdf() {
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF
  if (!pdfPromise) {
    pdfPromise = loadScript(PDF_CDN)
      .then(() => {
        if (!window.jspdf?.jsPDF) throw new Error('Library PDF tidak tersedia.')
        return window.jspdf.jsPDF
      })
      .catch((error) => {
        pdfPromise = null
        throw error
      })
  }
  return pdfPromise
}

async function ensureXlsx() {
  if (window.XLSX) return window.XLSX
  if (!xlsxPromise) {
    xlsxPromise = loadScript(XLSX_CDN)
      .then(() => {
        if (!window.XLSX) throw new Error('Library Excel tidak tersedia.')
        return window.XLSX
      })
      .catch((error) => {
        xlsxPromise = null
        throw error
      })
  }
  return xlsxPromise
}

function toRows(products) {
  return products.map((product, index) => ({
    no: index + 1,
    barcode: product.barcode,
    name: product.name,
    category: product.categoryName ?? '-',
    price: formatRupiah(product.price),
    stock: product.stock,
    unit: product.unit,
  }))
}

function toArray(rows) {
  return [
    HEADERS,
    ...rows.map((row) => [
      row.no,
      row.barcode,
      row.name,
      row.category,
      row.price,
      row.stock,
      row.unit,
    ]),
  ]
}

function fileStamp() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
  return `${date}-${time}`
}

function filterDescription(filters = {}) {
  const parts = []
  if (filters.q) parts.push(`Kata kunci: ${filters.q}`)
  if (filters.order_by) parts.push(`Urut: ${filters.order_by}`)
  if (filters.sort) parts.push(`Arah: ${filters.sort}`)
  return parts.length ? `Filter: ${parts.join(' | ')}` : 'Filter: semua produk'
}

export async function downloadProductsPdf(products, filters = {}) {
  const JsPDF = await ensurePdf()
  const rows = toRows(products)
  const widths = [10, 34, 54, 36, 32, 18, 20]
  const numericColumns = new Set([0, 5])
  const moneyColumns = new Set([4])
  const margin = 14
  const startX = (index) =>
    margin + widths.slice(0, index).reduce((sum, width) => sum + width, 0)

  const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageHeight = doc.internal.pageSize.getHeight()
  let y = 0

  const drawHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Daftar Produk', margin, 16)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(filterDescription(filters), margin, 22)

    y = 31
    doc.setFillColor(253, 232, 238)
    doc.rect(margin, y - 6, widths.reduce((sum, width) => sum + width, 0), 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    HEADERS.forEach((header, index) => {
      const rightAligned =
        numericColumns.has(index) || moneyColumns.has(index)
      doc.text(
        header,
        startX(index) + (rightAligned ? widths[index] - 2 : 2),
        y,
        { align: rightAligned ? 'right' : 'left' },
      )
    })
    y += 7
  }

  drawHeader()

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  rows.forEach((row, rowIndex) => {
    if (y > pageHeight - 16) {
      doc.addPage()
      drawHeader()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
    }

    const values = [
      row.no,
      row.barcode,
      row.name,
      row.category,
      row.price,
      row.stock,
      row.unit,
    ]
    values.forEach((value, index) => {
      const rightAligned = numericColumns.has(index) || moneyColumns.has(index)
      doc.text(String(value), startX(index) + (rightAligned ? widths[index] - 2 : 2), y, {
        align: rightAligned ? 'right' : 'left',
      })
    })

    y += 6
    if (rowIndex < rows.length - 1) {
      doc.setDrawColor(240, 214, 220)
      doc.line(margin, y - 3, startX(HEADERS.length), y - 3)
    }
  })

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.text(`Halaman ${page} dari ${pageCount}`, margin, pageHeight - 8)
  }

  doc.save(`produk-${fileStamp()}.pdf`)
}

export async function downloadProductsExcel(products) {
  const XLSX = await ensureXlsx()
  const sheet = XLSX.utils.aoa_to_sheet(toArray(toRows(products)))
  sheet['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 32 },
    { wch: 24 },
    { wch: 16 },
    { wch: 10 },
    { wch: 12 },
  ]

  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Produk')
  XLSX.writeFile(book, `produk-${fileStamp()}.xlsx`)
}
