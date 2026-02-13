'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AssignmentStats, SprintStats, OverviewStats } from '@/lib/actions/admin-analytics'

interface PDFReportData {
  challengeName: string
  dateRange: string
  overview: {
    totalViews: number
    assignmentViews: number
    mediaPlays: number
    completions: number
    uniqueSessions: number
    completionRate: number
  }
  sprints: SprintStats[]
  assignments: AssignmentStats[]
}

/**
 * Generates a professional PDF analytics report for a challenge.
 * Client-facing: no internal IDs, clean formatting, branded header.
 */
export function generateAnalyticsPDF(data: PDFReportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 16
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // ─── Header ─────────────────────────────────────────────────────────────

  doc.setFillColor(11, 48, 65) // Brand dark blue
  doc.rect(0, 0, pageWidth, 36, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Analytics Report', margin, 16)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(data.challengeName, margin, 24)

  doc.setFontSize(9)
  doc.setTextColor(180, 200, 215)
  doc.text(data.dateRange, margin, 30)

  doc.setFontSize(8)
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin, 30, { align: 'right' })

  y = 44

  // ─── Overview Stats ─────────────────────────────────────────────────────

  doc.setTextColor(11, 48, 65)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Overview', margin, y)
  y += 8

  const stats = [
    { label: 'Total Views', value: data.overview.totalViews.toLocaleString() },
    { label: 'Assignment Views', value: data.overview.assignmentViews.toLocaleString() },
    { label: 'Media Plays', value: data.overview.mediaPlays.toLocaleString() },
    { label: 'Completions', value: data.overview.completions.toLocaleString() },
    { label: 'Unique Sessions', value: data.overview.uniqueSessions.toLocaleString() },
    { label: 'Completion Rate', value: `${data.overview.completionRate}%` },
  ]

  const cardW = (contentWidth - 8) / 3
  const cardH = 18
  stats.forEach((stat, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = margin + col * (cardW + 4)
    const cardY = y + row * (cardH + 4)

    // Card background
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'F')

    // Value
    doc.setTextColor(11, 48, 65)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.value, x + cardW / 2, cardY + 9, { align: 'center' })

    // Label
    doc.setTextColor(120, 130, 140)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.label, x + cardW / 2, cardY + 14.5, { align: 'center' })
  })

  y += Math.ceil(stats.length / 3) * (cardH + 4) + 6

  // ─── Sprint Breakdown (if sprints exist) ────────────────────────────────

  if (data.sprints.length > 0) {
    doc.setTextColor(11, 48, 65)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Sprint Breakdown', margin, y)
    y += 3

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Sprint', 'Assignments', 'Views', 'Sessions', 'Completions', 'Rate']],
      body: data.sprints.map(s => [
        s.sprintName,
        s.assignmentCount.toString(),
        s.totalViews.toLocaleString(),
        s.uniqueSessions.toLocaleString(),
        s.completions.toLocaleString(),
        `${s.completionRate}%`,
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [50, 50, 50],
      },
      headStyles: {
        fillColor: [11, 48, 65],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 252],
      },
      columnStyles: {
        0: { cellWidth: 'auto', fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 22 },
        2: { halign: 'right', cellWidth: 22 },
        3: { halign: 'right', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 26 },
        5: { halign: 'right', cellWidth: 18 },
      },
    })

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // ─── Assignment Performance ─────────────────────────────────────────────

  // Check if we need a new page
  if (y > 200) {
    doc.addPage()
    y = margin
  }

  doc.setTextColor(11, 48, 65)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Assignment Performance', margin, y)
  y += 3

  const assignmentHeaders = data.sprints.length > 0
    ? ['#', 'Assignment', 'Sprint', 'Views', 'Sessions', 'Completions', 'Rate']
    : ['#', 'Assignment', 'Views', 'Sessions', 'Media', 'Completions', 'Rate']

  const assignmentRows = data.assignments.map((a, i) => {
    const rate = a.views > 0 ? Math.round((a.completions / a.views) * 100) : 0
    if (data.sprints.length > 0) {
      return [
        (i + 1).toString(),
        a.assignmentTitle,
        a.sprintName || '—',
        a.views.toLocaleString(),
        a.uniqueSessions.toLocaleString(),
        a.completions.toLocaleString(),
        `${rate}%`,
      ]
    }
    return [
      (i + 1).toString(),
      a.assignmentTitle,
      a.views.toLocaleString(),
      a.uniqueSessions.toLocaleString(),
      a.mediaPlays.toLocaleString(),
      a.completions.toLocaleString(),
      `${rate}%`,
    ]
  })

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [assignmentHeaders],
    body: assignmentRows,
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [50, 50, 50],
    },
    headStyles: {
      fillColor: [11, 48, 65],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 249, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 'auto' },
      ...(data.sprints.length > 0
        ? {
            2: { cellWidth: 30 },
            3: { halign: 'right', cellWidth: 18 },
            4: { halign: 'right', cellWidth: 20 },
            5: { halign: 'right', cellWidth: 24 },
            6: { halign: 'right', cellWidth: 16 },
          }
        : {
            2: { halign: 'right', cellWidth: 18 },
            3: { halign: 'right', cellWidth: 20 },
            4: { halign: 'right', cellWidth: 18 },
            5: { halign: 'right', cellWidth: 24 },
            6: { halign: 'right', cellWidth: 16 },
          }),
    },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // ─── Completion Drop-off Summary ────────────────────────────────────────

  if (data.assignments.length > 1) {
    if (y > 240) {
      doc.addPage()
      y = margin
    }

    doc.setTextColor(11, 48, 65)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Completion Drop-off', margin, y)
    y += 6

    const first = data.assignments[0]
    const last = data.assignments[data.assignments.length - 1]
    const dropPct = first.completions > 0
      ? Math.round(((first.completions - last.completions) / first.completions) * 100)
      : 0

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 90, 100)
    doc.text(
      `First assignment: ${first.completions} completions  |  Last assignment: ${last.completions} completions  |  Drop-off: ${dropPct}%`,
      margin, y
    )
    y += 8

    // Simple text-based funnel showing top 5 and bottom 5
    const topN = data.assignments.slice(0, 5)
    const showEllipsis = data.assignments.length > 10
    const bottomN = data.assignments.length > 10
      ? data.assignments.slice(-5)
      : data.assignments.length > 5
        ? data.assignments.slice(5)
        : []

    const funnelItems = [...topN]
    if (showEllipsis) {
      funnelItems.push({
        assignmentId: '...',
        assignmentTitle: `... ${data.assignments.length - 10} more assignments ...`,
        position: -1,
        sprintId: null,
        sprintName: null,
        views: 0,
        uniqueSessions: 0,
        mediaPlays: 0,
        completions: 0,
        passwordAttempts: 0,
        passwordSuccesses: 0,
      })
    }
    funnelItems.push(...bottomN)

    const maxC = Math.max(...data.assignments.map(a => a.completions), 1)

    funnelItems.forEach((a) => {
      if (y > 275) {
        doc.addPage()
        y = margin
      }

      if (a.assignmentId === '...') {
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(7)
        doc.text(a.assignmentTitle, margin + 4, y + 2)
        y += 6
        return
      }

      const barWidth = Math.max((a.completions / maxC) * (contentWidth - 40), 1)
      const rate = a.views > 0 ? Math.round((a.completions / a.views) * 100) : 0

      // Bar
      doc.setFillColor(16, 185, 129) // emerald
      doc.roundedRect(margin, y, barWidth, 4, 1, 1, 'F')

      // Label
      doc.setTextColor(80, 90, 100)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'normal')
      const label = `${a.assignmentTitle} — ${a.completions} completions (${rate}%)`
      doc.text(label, margin, y + 7.5)

      y += 11
    })
  }

  // ─── Footer ─────────────────────────────────────────────────────────────

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(160, 170, 180)
    doc.text(
      `Company Challenges Analytics  •  Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    )
  }

  return doc
}

/**
 * Generate and download the PDF report.
 */
export function downloadAnalyticsPDF(data: PDFReportData) {
  const doc = generateAnalyticsPDF(data)
  const slug = data.challengeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  doc.save(`${slug}-analytics-report.pdf`)
}
