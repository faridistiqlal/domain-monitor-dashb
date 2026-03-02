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
  minResponseTime: number
  maxResponseTime: number
  incidentCount: number
  totalDowntimeSeconds: number
  mttrSeconds: number
}

const mm = (value: number) => value

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

const sanitizeForFileName = (value: string): string => {
  return value.replace(/[^a-z0-9.-]/gi, '-').replace(/-+/g, '-')
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

  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0

  const downtimeDurations = incidents
    .map((incident) => incident.duration ?? (incident.endTime ? Math.max(0, Math.floor((incident.endTime - incident.startTime) / 1000)) : 0))
    .filter((duration) => duration > 0)

  const totalDowntimeSeconds = downtimeDurations.reduce((sum, duration) => sum + duration, 0)
  const mttrSeconds = downtimeDurations.length > 0
    ? Math.round(totalDowntimeSeconds / downtimeDurations.length)
    : 0

  return {
    totalChecks,
    successChecks,
    uptimePercent,
    avgResponseTime,
    minResponseTime,
    maxResponseTime,
    incidentCount: incidents.length,
    totalDowntimeSeconds,
    mttrSeconds,
  }
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
    yLabelSuffix?: string
  }
) => {
  const { x, y, width, height, title, lineColor, yLabelSuffix = '' } = options

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text(title, x, y)

  const chartTop = y + 4
  const chartBottom = chartTop + height
  const chartLeft = x
  const chartRight = x + width

  pdf.setDrawColor(220, 220, 220)
  pdf.rect(chartLeft, chartTop, width, height)

  if (values.length < 2) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(120, 120, 120)
    pdf.text('Data tidak cukup untuk grafik.', chartLeft + 4, chartTop + 10)
    pdf.setTextColor(20, 20, 20)
    return
  }

  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = Math.max(1, maxValue - minValue)

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
  pdf.setTextColor(100, 100, 100)
  pdf.text(`${maxValue.toFixed(1)}${yLabelSuffix}`, chartRight - 2, chartTop - 1, { align: 'right' })
  pdf.text(`${minValue.toFixed(1)}${yLabelSuffix}`, chartRight - 2, chartBottom + 3, { align: 'right' })

  const firstLabel = labels[0]
  const lastLabel = labels[labels.length - 1]
  if (firstLabel) pdf.text(firstLabel, chartLeft, chartBottom + 6)
  if (lastLabel) pdf.text(lastLabel, chartRight, chartBottom + 6, { align: 'right' })

  pdf.setTextColor(20, 20, 20)
}

const drawSummaryCards = (pdf: jsPDF, summary: MonitoringReportSummary, startY: number): number => {
  const cardWidth = 44
  const cardHeight = 20
  const gap = 4
  const xStart = 14

  const cards = [
    { label: 'Uptime', value: `${summary.uptimePercent.toFixed(2)}%` },
    { label: 'Total Checks', value: summary.totalChecks.toLocaleString('id-ID') },
    { label: 'Avg Response', value: `${Math.round(summary.avgResponseTime)} ms` },
    { label: 'Incidents', value: summary.incidentCount.toLocaleString('id-ID') },
  ]

  cards.forEach((card, index) => {
    const x = xStart + index * (cardWidth + gap)
    pdf.setDrawColor(220, 220, 220)
    pdf.roundedRect(x, startY, cardWidth, cardHeight, 2, 2)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(110, 110, 110)
    pdf.text(card.label, x + 3, startY + 6)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(20, 20, 20)
    pdf.text(card.value, x + 3, startY + 14)
  })

  return startY + cardHeight + 6
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
  const createdAt = new Date()

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  pdf.setFillColor(20, 20, 28)
  pdf.rect(0, 0, 210, 34, 'F')

  pdf.setTextColor(245, 245, 245)
  pdf.setFont('times', 'bold')
  pdf.setFontSize(18)
  pdf.text('Monitoring Report', 14, 15)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.text(domainUrl, 14, 23)
  pdf.setFontSize(9)
  pdf.text(`Periode: ${formatPeriodLabel(periodDays)} • Dibuat: ${createdAt.toLocaleString('id-ID')}`, 14, 29)

  let cursorY = 42
  pdf.setTextColor(20, 20, 20)

  cursorY = drawSummaryCards(pdf, summary, cursorY)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('Kinerja Response Time', 14, cursorY)
  cursorY += 4

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text(`Min ${Math.round(summary.minResponseTime)} ms • Avg ${Math.round(summary.avgResponseTime)} ms • Max ${Math.round(summary.maxResponseTime)} ms`, 14, cursorY)
  cursorY += 6

  const dayLabels = stats.map((stat) => stat.date.slice(5))
  const uptimeSeries = stats.map((stat) => Number(stat.uptimePercent.toFixed(2)))
  const responseSeries = stats.map((stat) => Number((stat.avgResponseTime ?? 0).toFixed(2)))

  drawLineChart(pdf, uptimeSeries, dayLabels, {
    x: 14,
    y: cursorY,
    width: 182,
    height: 30,
    title: 'Grafik Uptime Harian',
    lineColor: [16, 185, 129],
    yLabelSuffix: '%',
  })

  cursorY += 40

  drawLineChart(pdf, responseSeries, dayLabels, {
    x: 14,
    y: cursorY,
    width: 182,
    height: 30,
    title: 'Grafik Response Time Harian',
    lineColor: [59, 130, 246],
    yLabelSuffix: 'ms',
  })

  cursorY += 42

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('Ringkasan Reliabilitas', 14, cursorY)
  cursorY += 6

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text(`Total downtime: ${formatSeconds(summary.totalDowntimeSeconds)}`, 14, cursorY)
  cursorY += 5
  pdf.text(`MTTR (rata-rata pemulihan): ${formatSeconds(summary.mttrSeconds)}`, 14, cursorY)
  cursorY += 5
  pdf.text(`Keberhasilan check: ${summary.successChecks.toLocaleString('id-ID')} / ${summary.totalChecks.toLocaleString('id-ID')}`, 14, cursorY)

  pdf.addPage()
  let incidentY = 18

  pdf.setFont('times', 'bold')
  pdf.setFontSize(16)
  pdf.text('Incident Timeline', 14, incidentY)
  incidentY += 7

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text(`Domain: ${domainUrl} • Periode: ${formatPeriodLabel(periodDays)} • Total incident: ${incidents.length}`, 14, incidentY)
  incidentY += 7

  if (incidents.length === 0) {
    pdf.setFontSize(10)
    pdf.text('Tidak ada incident pada periode ini.', 14, incidentY)
  } else {
    const maxIncidents = Math.min(incidents.length, 20)
    for (let index = 0; index < maxIncidents; index += 1) {
      const incident = incidents[index]
      if (incidentY > 275) {
        pdf.addPage()
        incidentY = 18
      }

      const durationSeconds = incident.duration ?? (incident.endTime ? Math.max(0, Math.floor((incident.endTime - incident.startTime) / 1000)) : 0)
      pdf.setDrawColor(220, 220, 220)
      pdf.roundedRect(14, incidentY, 182, 12, 2, 2)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.text(`#${index + 1} ${incident.status.toUpperCase()} • ${formatDateTime(incident.startTime)}`, 17, incidentY + 4.5)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      const endLabel = incident.endTime ? formatDateTime(incident.endTime) : 'Belum recovery'
      pdf.text(`Selesai: ${endLabel} • Durasi: ${formatDurationCompact(durationSeconds)} • From: ${incident.prevStatus}`, 17, incidentY + 9)

      incidentY += 14
    }

    if (incidents.length > maxIncidents) {
      pdf.setFont('helvetica', 'italic')
      pdf.setFontSize(8)
      pdf.text(`+${incidents.length - maxIncidents} incident lain tidak ditampilkan pada PDF ringkas ini.`, 14, Math.min(285, incidentY + 2))
    }
  }

  const fileName = `monitoring-report-${sanitizeForFileName(domainUrl)}-${periodDays}d-${createdAt.toISOString().slice(0, 10)}.pdf`
  pdf.save(fileName)
  return fileName
}
