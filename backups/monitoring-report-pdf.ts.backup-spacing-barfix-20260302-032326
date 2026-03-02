import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { jsPDF } from 'jspdf'
import { DomainDailyStats, DomainIncident } from '@/lib/types'

export type ReportPeriodDays = 1 | 15 | 30

interface GenerateMonitoringReportParams {
  domainId: string
  domainUrl: string
  periodDays: ReportPeriodDays
}

interface MonitoringReportSummary {
  totalChecks: number
  successChecks: number
  uptimePercent: number
  avgResponseTime: number
  p95ResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  incidentCount: number
  totalDowntimeSeconds: number
  mttrSeconds: number
  longestIncidentSeconds: number
  daysMeetingSla: number
  totalDays: number
  worstUptimeDate: string | null
  worstUptimeValue: number
}

interface DailyPerformanceRow {
  date: string
  uptimePercent: number
  totalChecks: number
  successChecks: number
  avgResponseTime: number
  downtimeSeconds: number
  incidentCount: number
}

const SLA_TARGET_PERCENT = 99.0
const REPORT_ORG_NAME = 'Kabupaten Kendal'
const REPORT_CLASSIFICATION = 'Internal Monitoring Report'

const COLORS = {
  bgDark: [16, 20, 30] as [number, number, number],
  primary: [37, 99, 235] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
  ink: [26, 32, 44] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  border: [220, 226, 235] as [number, number, number],
  softBlue: [238, 245, 255] as [number, number, number],
  softGreen: [236, 253, 245] as [number, number, number],
}

const formatPeriodLabel = (days: ReportPeriodDays): string => {
  if (days === 1) return '1 Hari'
  if (days === 15) return '15 Hari'
  return '30 Hari'
}

const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDate = (dateText: string): string => {
  const date = new Date(`${dateText}T00:00:00`)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatSeconds = (seconds: number): string => {
  if (seconds <= 0) return '0 menit'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} menit`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) return `${hours} jam`
  return `${hours} jam ${remainingMinutes} menit`
}

const formatDurationCompact = (seconds: number): string => {
  if (seconds < 60) return `${seconds} d`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) return `${hours} j`
  return `${hours}j ${remainingMinutes}m`
}

const formatPercent = (value: number): string => `${value.toFixed(2)}%`

const formatMs = (value: number): string => `${Math.round(value)} ms`

const makeRecommendationLines = (summary: MonitoringReportSummary): string[] => {
  const lines: string[] = []

  if (summary.uptimePercent >= SLA_TARGET_PERCENT) {
    lines.push(`Availability ${formatPercent(summary.uptimePercent)} sudah memenuhi target SLA ${formatPercent(SLA_TARGET_PERCENT)}.`)
  } else {
    lines.push(`Availability ${formatPercent(summary.uptimePercent)} masih di bawah SLA ${formatPercent(SLA_TARGET_PERCENT)}; prioritaskan perbaikan akar gangguan.`)
  }

  if (summary.incidentCount === 0) {
    lines.push('Tidak ada incident tercatat pada periode ini; pertahankan monitoring dan health-check rutin.')
  } else {
    lines.push(`Terjadi ${summary.incidentCount} incident dengan MTTR ${formatSeconds(summary.mttrSeconds)} dan downtime total ${formatSeconds(summary.totalDowntimeSeconds)}.`)
  }

  if (summary.p95ResponseTime > 2000) {
    lines.push(`P95 response ${formatMs(summary.p95ResponseTime)} tergolong tinggi; evaluasi performa upstream, DNS, dan aplikasi web.`)
  } else {
    lines.push(`P95 response ${formatMs(summary.p95ResponseTime)} relatif stabil; lanjutkan observasi tren puncak trafik.`)
  }

  return lines
}

const percentile = (values: number[], targetPercentile: number): number => {
  if (values.length === 0) return 0
  const sortedValues = [...values].sort((left, right) => left - right)
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor((targetPercentile / 100) * (sortedValues.length - 1))))
  return sortedValues[index]
}

const sanitizeForFileName = (value: string): string => {
  return value.replace(/[^a-z0-9.-]/gi, '-').replace(/-+/g, '-')
}

const buildIncidentDateMaps = (incidents: DomainIncident[]) => {
  const downtimeByDate = new Map<string, number>()
  const incidentsByDate = new Map<string, number>()

  incidents.forEach((incident) => {
    const dateKey = new Date(incident.startTime).toISOString().slice(0, 10)
    const durationSeconds = incident.duration ?? (incident.endTime ? Math.max(0, Math.floor((incident.endTime - incident.startTime) / 1000)) : 0)
    downtimeByDate.set(dateKey, (downtimeByDate.get(dateKey) ?? 0) + Math.max(0, durationSeconds))
    incidentsByDate.set(dateKey, (incidentsByDate.get(dateKey) ?? 0) + 1)
  })

  return { downtimeByDate, incidentsByDate }
}

const buildDailyRows = (stats: DomainDailyStats[], incidents: DomainIncident[]): DailyPerformanceRow[] => {
  const { downtimeByDate, incidentsByDate } = buildIncidentDateMaps(incidents)

  return stats.map((stat) => ({
    date: stat.date,
    uptimePercent: stat.uptimePercent,
    totalChecks: stat.totalChecks,
    successChecks: stat.successChecks,
    avgResponseTime: stat.avgResponseTime ?? 0,
    downtimeSeconds: downtimeByDate.get(stat.date) ?? 0,
    incidentCount: incidentsByDate.get(stat.date) ?? 0,
  }))
}

const loadStatsData = async (domainId: string, periodDays: ReportPeriodDays): Promise<DomainDailyStats[]> => {
  const db = getFirestore()

  try {
    const boundedQuery = query(
      collection(db, 'domain-stats-daily'),
      where('domainId', '==', domainId),
      orderBy('date', 'desc'),
      limit(periodDays)
    )
    const snapshot = await getDocs(boundedQuery)
    return snapshot.docs.map((doc) => doc.data() as DomainDailyStats).sort((a, b) => a.date.localeCompare(b.date))
  } catch (boundedError) {
    console.warn('[report-pdf] fallback stats query:', boundedError)
    const fallbackQuery = query(
      collection(db, 'domain-stats-daily'),
      where('domainId', '==', domainId),
      limit(Math.max(periodDays * 4, 180))
    )
    const snapshot = await getDocs(fallbackQuery)
    return snapshot.docs
      .map((doc) => doc.data() as DomainDailyStats)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-periodDays)
  }
}

const loadIncidentData = async (domainId: string, periodDays: ReportPeriodDays): Promise<DomainIncident[]> => {
  const db = getFirestore()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)
  const minStartTime = startDate.getTime()

  try {
    const boundedQuery = query(
      collection(db, 'domain-incidents'),
      where('domainId', '==', domainId),
      orderBy('startTime', 'desc'),
      limit(Math.max(periodDays * 4, 120))
    )
    const snapshot = await getDocs(boundedQuery)
    return snapshot.docs
      .map((doc) => doc.data() as DomainIncident)
      .filter((incident) => incident.startTime >= minStartTime)
      .sort((a, b) => b.startTime - a.startTime)
  } catch (boundedError) {
    console.warn('[report-pdf] fallback incidents query:', boundedError)
    const fallbackQuery = query(
      collection(db, 'domain-incidents'),
      where('domainId', '==', domainId),
      limit(Math.max(periodDays * 8, 240))
    )
    const snapshot = await getDocs(fallbackQuery)
    return snapshot.docs
      .map((doc) => doc.data() as DomainIncident)
      .filter((incident) => incident.startTime >= minStartTime)
      .sort((a, b) => b.startTime - a.startTime)
  }
}

const calculateSummary = (stats: DomainDailyStats[], incidents: DomainIncident[]): MonitoringReportSummary => {
  const totalChecks = stats.reduce((sum, stat) => sum + stat.totalChecks, 0)
  const successChecks = stats.reduce((sum, stat) => sum + stat.successChecks, 0)
  const uptimePercent = totalChecks > 0 ? (successChecks / totalChecks) * 100 : 0

  const responseTimes = stats
    .map((stat) => stat.avgResponseTime)
    .filter((responseTime): responseTime is number => typeof responseTime === 'number')

  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length
    : 0
  const p95ResponseTime = percentile(responseTimes, 95)

  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0

  const downtimeDurations = incidents
    .map((incident) => incident.duration ?? (incident.endTime ? Math.max(0, Math.floor((incident.endTime - incident.startTime) / 1000)) : 0))
    .filter((duration) => duration > 0)

  const totalDowntimeSeconds = downtimeDurations.reduce((sum, duration) => sum + duration, 0)
  const mttrSeconds = downtimeDurations.length > 0
    ? Math.round(totalDowntimeSeconds / downtimeDurations.length)
    : 0
  const longestIncidentSeconds = downtimeDurations.length > 0 ? Math.max(...downtimeDurations) : 0
  const daysMeetingSla = stats.filter((stat) => stat.uptimePercent >= SLA_TARGET_PERCENT).length
  const worstDay = stats.reduce<{ date: string | null; value: number }>((currentWorst, stat) => {
    if (stat.uptimePercent < currentWorst.value) {
      return { date: stat.date, value: stat.uptimePercent }
    }
    return currentWorst
  }, { date: null, value: 100 })

  return {
    totalChecks,
    successChecks,
    uptimePercent,
    avgResponseTime,
    p95ResponseTime,
    minResponseTime,
    maxResponseTime,
    incidentCount: incidents.length,
    totalDowntimeSeconds,
    mttrSeconds,
    longestIncidentSeconds,
    daysMeetingSla,
    totalDays: stats.length,
    worstUptimeDate: worstDay.date,
    worstUptimeValue: worstDay.value,
  }
}

const addFooter = (pdf: jsPDF, pageNumber: number, totalPages: number, generatedAt: Date) => {
  pdf.setDrawColor(...COLORS.border)
  pdf.line(14, 287, 196, 287)
  pdf.setTextColor(...COLORS.muted)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(`Generated: ${generatedAt.toLocaleString('id-ID')} WIB`, 14, 291)
  pdf.text(`Page ${pageNumber} / ${totalPages}`, 196, 291, { align: 'right' })
}

const drawSectionTitle = (pdf: jsPDF, title: string, x: number, y: number) => {
  pdf.setFillColor(...COLORS.softBlue)
  pdf.roundedRect(x, y - 4.5, 182, 7.5, 1.5, 1.5, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9.5)
  pdf.setTextColor(...COLORS.ink)
  pdf.text(title, x + 2, y)
}

const drawHeaderBrand = (pdf: jsPDF, domainUrl: string, periodDays: ReportPeriodDays, createdAt: Date) => {
  pdf.setFillColor(...COLORS.bgDark)
  pdf.rect(0, 0, 210, 34, 'F')

  pdf.setTextColor(245, 245, 245)
  pdf.setFont('times', 'bold')
  pdf.setFontSize(19)
  pdf.text('Monitoring Report', 14, 14)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('Domain Availability & Reliability', 14, 20.5)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.text(`${REPORT_ORG_NAME} • ${REPORT_CLASSIFICATION}`, 14, 26)
  pdf.text(`${domainUrl} • ${formatPeriodLabel(periodDays)} • ${createdAt.toLocaleString('id-ID')}`, 14, 31)
}

const drawChartLegend = (pdf: jsPDF, y: number) => {
  pdf.setDrawColor(...COLORS.border)
  pdf.setFillColor(255, 255, 255)
  pdf.roundedRect(14, y, 182, 10, 1.5, 1.5, 'FD')

  pdf.setFillColor(...COLORS.success)
  pdf.circle(20, y + 5, 1.4, 'F')
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...COLORS.ink)
  pdf.text('Uptime Trend', 24, y + 6)

  pdf.setFillColor(...COLORS.primary)
  pdf.circle(76, y + 5, 1.4, 'F')
  pdf.text('Response Time Trend', 80, y + 6)

  pdf.setFillColor(...COLORS.warning)
  pdf.circle(152, y + 5, 1.4, 'F')
  pdf.text('SLA Threshold Alert', 156, y + 6)
}

const drawLineChart = (
  pdf: jsPDF,
  values: number[],
  labels: string[],
  options: {
    x: number
    y: number
    width: number
    height: number
    title: string
    lineColor: [number, number, number]
    fillColor?: [number, number, number]
    yLabelSuffix?: string
  }
) => {
  const { x, y, width, height, title, lineColor, fillColor, yLabelSuffix = '' } = options

  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...COLORS.ink)
  pdf.setFontSize(10)
  pdf.text(title, x, y)

  const chartTop = y + 4
  const chartBottom = chartTop + height
  const chartLeft = x
  const chartRight = x + width

  pdf.setDrawColor(...COLORS.border)
  pdf.setFillColor(255, 255, 255)
  pdf.rect(chartLeft, chartTop, width, height)

  for (let line = 1; line <= 3; line += 1) {
    const yLine = chartTop + (line * height) / 4
    pdf.setDrawColor(236, 240, 246)
    pdf.line(chartLeft, yLine, chartRight, yLine)
  }

  if (values.length < 2) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...COLORS.muted)
    pdf.text('Data tidak cukup untuk grafik.', chartLeft + 4, chartTop + 10)
    pdf.setTextColor(...COLORS.ink)
    return
  }

  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = Math.max(1, maxValue - minValue)

  if (fillColor) {
    pdf.setFillColor(...fillColor)
    pdf.setDrawColor(...fillColor)
    for (let index = 0; index < values.length - 1; index += 1) {
      const x1 = chartLeft + (index / (values.length - 1)) * width
      const x2 = chartLeft + ((index + 1) / (values.length - 1)) * width
      const y1 = chartBottom - ((values[index] - minValue) / range) * height
      const y2 = chartBottom - ((values[index + 1] - minValue) / range) * height
      pdf.triangle(x1, chartBottom, x1, y1, x2, chartBottom, 'F')
      pdf.triangle(x2, chartBottom, x1, y1, x2, y2, 'F')
    }
  }

  pdf.setDrawColor(...lineColor)
  for (let index = 0; index < values.length - 1; index += 1) {
    const x1 = chartLeft + (index / (values.length - 1)) * width
    const x2 = chartLeft + ((index + 1) / (values.length - 1)) * width
    const y1 = chartBottom - ((values[index] - minValue) / range) * height
    const y2 = chartBottom - ((values[index + 1] - minValue) / range) * height
    pdf.line(x1, y1, x2, y2)
  }

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...COLORS.muted)
  pdf.text(`${maxValue.toFixed(1)}${yLabelSuffix}`, chartRight - 2, chartTop - 1, { align: 'right' })
  pdf.text(`${minValue.toFixed(1)}${yLabelSuffix}`, chartRight - 2, chartBottom + 3, { align: 'right' })

  const firstLabel = labels[0]
  const lastLabel = labels[labels.length - 1]
  if (firstLabel) pdf.text(firstLabel, chartLeft, chartBottom + 6)
  if (lastLabel) pdf.text(lastLabel, chartRight, chartBottom + 6, { align: 'right' })

  pdf.setTextColor(...COLORS.ink)
}

const drawMetricCards = (pdf: jsPDF, summary: MonitoringReportSummary, startY: number): number => {
  const cards = [
    { label: 'Availability', value: formatPercent(summary.uptimePercent), hint: `Target SLA ${formatPercent(SLA_TARGET_PERCENT)}` },
    { label: 'Total Checks', value: summary.totalChecks.toLocaleString('id-ID'), hint: `${summary.successChecks.toLocaleString('id-ID')} successful` },
    { label: 'Avg Response', value: formatMs(summary.avgResponseTime), hint: `P95 ${formatMs(summary.p95ResponseTime)}` },
    { label: 'Total Incidents', value: summary.incidentCount.toLocaleString('id-ID'), hint: `${summary.totalDays} hari observasi` },
    { label: 'Total Downtime', value: formatSeconds(summary.totalDowntimeSeconds), hint: `Longest ${formatSeconds(summary.longestIncidentSeconds)}` },
    { label: 'MTTR', value: formatSeconds(summary.mttrSeconds), hint: `${summary.daysMeetingSla}/${summary.totalDays} hari SLA tercapai` },
  ]

  const cardsPerRow = 3
  const cardWidth = 58
  const cardHeight = 20
  const gapX = 4
  const gapY = 4

  cards.forEach((card, index) => {
    const row = Math.floor(index / cardsPerRow)
    const col = index % cardsPerRow
    const x = 14 + col * (cardWidth + gapX)
    const y = startY + row * (cardHeight + gapY)

    pdf.setDrawColor(...COLORS.border)
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD')

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...COLORS.muted)
    pdf.text(card.label, x + 3, y + 5)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(...COLORS.ink)
    pdf.text(card.value, x + 3, y + 11.5)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7.5)
    pdf.setTextColor(...COLORS.muted)
    pdf.text(card.hint, x + 3, y + 16.5)
  })

  return startY + (Math.ceil(cards.length / cardsPerRow) * (cardHeight + gapY)) - gapY
}

const drawMetaPanel = (pdf: jsPDF, domainUrl: string, periodDays: ReportPeriodDays, createdAt: Date, statsCount: number) => {
  pdf.setDrawColor(...COLORS.border)
  pdf.setFillColor(...COLORS.softBlue)
  pdf.roundedRect(14, 42, 182, 24, 2, 2, 'FD')

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(...COLORS.ink)
  pdf.text('Ringkasan Laporan', 18, 49)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.setTextColor(...COLORS.muted)
  pdf.text(`Domain: ${domainUrl}`, 18, 55)
  pdf.text(`Periode: ${formatPeriodLabel(periodDays)} • Sampel harian: ${statsCount} hari`, 18, 60)
  pdf.text(`Generated: ${createdAt.toLocaleString('id-ID')} WIB`, 18, 65)
}

const drawExecutiveNotes = (pdf: jsPDF, summary: MonitoringReportSummary, y: number) => {
  pdf.setDrawColor(...COLORS.border)
  pdf.roundedRect(14, y, 182, 20, 2, 2)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(...COLORS.ink)
  pdf.text('Catatan Eksekutif', 18, y + 5.5)

  const slaStatus = summary.uptimePercent >= SLA_TARGET_PERCENT ? 'MENCAPAI TARGET SLA' : 'DI BAWAH TARGET SLA'
  const worstDayText = summary.worstUptimeDate
    ? `${formatDate(summary.worstUptimeDate)} (${formatPercent(summary.worstUptimeValue)})`
    : 'Tidak tersedia'

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...COLORS.muted)
  pdf.text(`Status SLA: ${slaStatus}`, 18, y + 10.5)
  pdf.text(`Hari terburuk: ${worstDayText} • Total incident: ${summary.incidentCount}`, 18, y + 15)
  pdf.text(`MTTR: ${formatSeconds(summary.mttrSeconds)} • Downtime total: ${formatSeconds(summary.totalDowntimeSeconds)}`, 18, y + 19)
}

const drawRecommendationPanel = (pdf: jsPDF, summary: MonitoringReportSummary, y: number): number => {
  const recommendations = makeRecommendationLines(summary)
  const wrappedLines = recommendations.map((line) => pdf.splitTextToSize(`• ${line}`, 172))
  const textHeight = wrappedLines.reduce((total, line) => total + (Array.isArray(line) ? line.length : 1) * 4.1 + 0.9, 0)
  const panelHeight = Math.max(24, 10 + textHeight + 3)

  pdf.setDrawColor(...COLORS.border)
  pdf.setFillColor(...COLORS.softGreen)
  pdf.roundedRect(14, y, 182, panelHeight, 2, 2, 'FD')

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(...COLORS.ink)
  pdf.text('Rekomendasi Tindak Lanjut', 18, y + 6)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.8)
  pdf.setTextColor(...COLORS.muted)

  let cursorY = y + 10.5
  wrappedLines.forEach((wrapped) => {
    const lines = Array.isArray(wrapped) ? wrapped : [wrapped]
    pdf.text(lines, 18, cursorY)
    cursorY += lines.length * 4.1 + 0.9
  })

  return panelHeight
}

const drawDailySummaryTable = (pdf: jsPDF, rows: DailyPerformanceRow[], createdAt: Date): number => {
  pdf.addPage()

  pdf.setFillColor(...COLORS.bgDark)
  pdf.rect(0, 0, 210, 24, 'F')
  pdf.setFont('times', 'bold')
  pdf.setFontSize(15)
  pdf.setTextColor(245, 245, 245)
  pdf.text('Daily Performance Table', 14, 14)

  const headers = ['Tanggal', 'Uptime', 'Checks', 'Success', 'Avg RT', 'Downtime', 'Inc']
  const colX = [14, 52, 78, 98, 120, 146, 178]
  const colWidth = [38, 26, 20, 22, 26, 32, 18]
  let y = 32

  pdf.setFillColor(238, 245, 255)
  pdf.rect(14, y, 182, 8, 'F')

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...COLORS.ink)
  headers.forEach((header, index) => {
    const align = index === 0 ? 'left' : 'right'
    const textX = align === 'left' ? colX[index] + 1.5 : colX[index] + colWidth[index] - 1.5
    pdf.text(header, textX, y + 5.3, { align })
  })

  y += 8
  const sortedRows = [...rows].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 26)

  sortedRows.forEach((row, index) => {
    if (y > 274) return

    if (index % 2 === 0) {
      pdf.setFillColor(250, 251, 253)
      pdf.rect(14, y, 182, 7, 'F')
    }

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...COLORS.ink)

    const values = [
      formatDate(row.date),
      formatPercent(row.uptimePercent),
      row.totalChecks.toLocaleString('id-ID'),
      row.successChecks.toLocaleString('id-ID'),
      formatMs(row.avgResponseTime),
      formatDurationCompact(row.downtimeSeconds),
      row.incidentCount.toLocaleString('id-ID'),
    ]

    values.forEach((value, valueIndex) => {
      const align = valueIndex === 0 ? 'left' : 'right'
      const textX = align === 'left' ? colX[valueIndex] + 1.5 : colX[valueIndex] + colWidth[valueIndex] - 1.5
      pdf.text(value, textX, y + 4.8, { align })
    })

    y += 7
  })

  pdf.setDrawColor(...COLORS.border)
  pdf.rect(14, 32, 182, Math.min(8 + sortedRows.length * 7, 8 + 26 * 7))
  addFooter(pdf, 2, 3, createdAt)
  return 2
}

const drawIncidentTimelineTable = (pdf: jsPDF, incidents: DomainIncident[], domainUrl: string, periodDays: ReportPeriodDays, createdAt: Date): number => {
  pdf.addPage()

  pdf.setFillColor(...COLORS.bgDark)
  pdf.rect(0, 0, 210, 24, 'F')
  pdf.setFont('times', 'bold')
  pdf.setFontSize(15)
  pdf.setTextColor(245, 245, 245)
  pdf.text('Incident Timeline', 14, 14)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.setTextColor(...COLORS.muted)
  pdf.text(`Domain: ${domainUrl} • Periode: ${formatPeriodLabel(periodDays)} • Total: ${incidents.length} incident`, 14, 30)

  const headers = ['#', 'Mulai', 'Selesai', 'Durasi', 'Status', 'Recovery']
  const colX = [14, 22, 66, 112, 136, 164]
  const colWidth = [8, 44, 46, 24, 26, 32]
  let y = 36

  pdf.setFillColor(238, 245, 255)
  pdf.rect(14, y, 182, 8, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...COLORS.ink)

  headers.forEach((header, index) => {
    const align = index <= 2 ? 'left' : 'right'
    const textX = align === 'left' ? colX[index] + 1.2 : colX[index] + colWidth[index] - 1.2
    pdf.text(header, textX, y + 5.2, { align })
  })

  y += 8
  const maxRows = 31
  const timelineRows = incidents.slice(0, maxRows)

  if (timelineRows.length === 0) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...COLORS.muted)
    pdf.text('Tidak ada incident pada periode ini.', 16, y + 8)
    addFooter(pdf, 3, 3, createdAt)
    return 3
  }

  timelineRows.forEach((incident, index) => {
    if (y > 274) return

    if (index % 2 === 0) {
      pdf.setFillColor(250, 251, 253)
      pdf.rect(14, y, 182, 7, 'F')
    }

    const durationSeconds = incident.duration ?? (incident.endTime ? Math.max(0, Math.floor((incident.endTime - incident.startTime) / 1000)) : 0)
    const resolvedLabel = incident.resolved ? 'Resolved' : 'Open'
    const values = [
      `${index + 1}`,
      formatDateTime(incident.startTime),
      incident.endTime ? formatDateTime(incident.endTime) : '-',
      formatDurationCompact(durationSeconds),
      incident.status.toUpperCase(),
      resolvedLabel,
    ]

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    values.forEach((value, valueIndex) => {
      const align = valueIndex <= 2 ? 'left' : 'right'
      const textX = align === 'left' ? colX[valueIndex] + 1.2 : colX[valueIndex] + colWidth[valueIndex] - 1.2
      if (valueIndex === 4) {
        const statusColor = incident.status === 'offline' ? COLORS.danger : COLORS.warning
        pdf.setTextColor(...statusColor)
      } else if (valueIndex === 5) {
        const recoveryColor = incident.resolved ? COLORS.success : COLORS.warning
        pdf.setTextColor(...recoveryColor)
      } else {
        pdf.setTextColor(...COLORS.ink)
      }
      pdf.text(value, textX, y + 4.8, { align })
    })

    y += 7
  })

  if (incidents.length > maxRows) {
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(8)
    pdf.setTextColor(...COLORS.muted)
    pdf.text(`+${incidents.length - maxRows} incident tambahan tidak ditampilkan di halaman ini.`, 14, 284)
  }

  pdf.setDrawColor(...COLORS.border)
  pdf.rect(14, 36, 182, Math.min(8 + timelineRows.length * 7, 8 + maxRows * 7))
  addFooter(pdf, 3, 3, createdAt)
  return 3
}

export const generateMonitoringReportPdf = async ({
  domainId,
  domainUrl,
  periodDays,
}: GenerateMonitoringReportParams): Promise<string> => {
  const [stats, incidents] = await Promise.all([
    loadStatsData(domainId, periodDays),
    loadIncidentData(domainId, periodDays),
  ])

  if (stats.length === 0) {
    throw new Error('Belum ada data statistik pada periode yang dipilih.')
  }

  const summary = calculateSummary(stats, incidents)
  const dailyRows = buildDailyRows(stats, incidents)
  const createdAt = new Date()

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  drawHeaderBrand(pdf, domainUrl, periodDays, createdAt)

  drawMetaPanel(pdf, domainUrl, periodDays, createdAt, stats.length)

  let cursorY = 74
  drawSectionTitle(pdf, 'Executive KPI Dashboard', 14, 72)
  cursorY = drawMetricCards(pdf, summary, cursorY) + 6

  pdf.setDrawColor(...COLORS.border)
  pdf.setFillColor(252, 254, 255)
  pdf.roundedRect(14, cursorY, 182, 14, 2, 2, 'FD')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(...COLORS.ink)
  pdf.text('SLA Indicator', 18, cursorY + 5.4)

  const slaRatio = Math.min(1, Math.max(0, summary.uptimePercent / SLA_TARGET_PERCENT))
  pdf.setDrawColor(...COLORS.border)
  pdf.rect(18, cursorY + 7.5, 120, 4)
  pdf.setFillColor(...(summary.uptimePercent >= SLA_TARGET_PERCENT ? COLORS.success : COLORS.warning))
  pdf.rect(18, cursorY + 7.5, 120 * Math.min(1, slaRatio), 4, 'F')

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...COLORS.muted)
  pdf.text(`Actual ${formatPercent(summary.uptimePercent)} vs SLA ${formatPercent(SLA_TARGET_PERCENT)}`, 142, cursorY + 10.6, { align: 'left' })

  cursorY += 20
  drawSectionTitle(pdf, 'Performance Trend', 14, cursorY - 1.5)

  const dayLabels = stats.map((stat) => stat.date.slice(5))
  const uptimeSeries = stats.map((stat) => Number(stat.uptimePercent.toFixed(2)))
  const responseSeries = stats.map((stat) => Number((stat.avgResponseTime ?? 0).toFixed(2)))

  drawLineChart(pdf, uptimeSeries, dayLabels, {
    x: 14,
    y: cursorY,
    width: 182,
    height: 28,
    title: 'Uptime Trend Harian',
    lineColor: COLORS.success,
    fillColor: [227, 251, 241],
    yLabelSuffix: '%',
  })

  cursorY += 37

  drawLineChart(pdf, responseSeries, dayLabels, {
    x: 14,
    y: cursorY,
    width: 182,
    height: 28,
    title: 'Response Time Trend Harian',
    lineColor: COLORS.primary,
    fillColor: [232, 242, 255],
    yLabelSuffix: 'ms',
  })

  cursorY += 34
  drawChartLegend(pdf, cursorY - 2)
  cursorY += 10

  drawSectionTitle(pdf, 'Executive Interpretation', 14, cursorY)
  cursorY += 1.5
  drawExecutiveNotes(pdf, summary, cursorY)
  cursorY += 23
  drawRecommendationPanel(pdf, summary, cursorY)

  addFooter(pdf, 1, 3, createdAt)
  drawDailySummaryTable(pdf, dailyRows, createdAt)
  drawIncidentTimelineTable(pdf, incidents, domainUrl, periodDays, createdAt)

  const fileName = `monitoring-report-${sanitizeForFileName(domainUrl)}-${periodDays}d-${createdAt.toISOString().slice(0, 10)}.pdf`
  pdf.save(fileName)
  return fileName
}
