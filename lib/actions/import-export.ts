'use server'

import * as XLSX from 'xlsx'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { Assignment, AssignmentInsert } from '@/lib/types/database'

export type ExportResult =
  | { success: true; data: string } // base64 encoded file
  | { success: false; error: string }

export type ImportResult =
  | { success: true; imported: number; skipped: number; errors: string[] }
  | { success: false; error: string }

/**
 * Export assignments to Excel file
 * Supports filtering by IDs, tags, or challenge
 */
export async function exportAssignments(options?: {
  assignmentIds?: string[]
  tags?: string[]
  challengeId?: string
  includeUsages?: boolean
}): Promise<ExportResult> {
  try {
    const supabase = createAdminClient()

    let query = supabase
      .from('assignments')
      .select(`
        id,
        slug,
        internal_title,
        public_title,
        subtitle,
        instructions_html,
        content_html,
        visual_url,
        media_url,
        content_type,
        is_reusable,
        tags,
        created_at,
        updated_at,
        assignment_usages!left (
          challenge_id
        )
      `)
      .order('internal_title', { ascending: true })

    // Filter by specific IDs if provided
    if (options?.assignmentIds && options.assignmentIds.length > 0) {
      query = query.in('id', options.assignmentIds)
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error('Error fetching assignments for export:', error)
      return { success: false, error: error.message }
    }

    // Apply client-side filters for tags and challenge (Supabase doesn't support contains on arrays well)
    let filteredAssignments = assignments || []

    // Filter by tags (any match)
    if (options?.tags && options.tags.length > 0) {
      const lowerTags = options.tags.map(t => t.toLowerCase())
      filteredAssignments = filteredAssignments.filter(a =>
        a.tags && a.tags.some((tag: string) => lowerTags.includes(tag.toLowerCase()))
      )
    }

    // Filter by challenge ID
    if (options?.challengeId) {
      filteredAssignments = filteredAssignments.filter(a =>
        a.assignment_usages?.some((u: { challenge_id: string }) => u.challenge_id === options.challengeId)
      )
    }

    // Remove the usages from export data
    const cleanedAssignments = filteredAssignments.map(({ assignment_usages, ...rest }) => rest)

    if (!cleanedAssignments || cleanedAssignments.length === 0) {
      return { success: false, error: 'No assignments match the filter criteria' }
    }

    // Transform data for Excel
    const exportData = cleanedAssignments.map((a) => ({
      ID: a.id,
      Slug: a.slug,
      'Internal Title': a.internal_title,
      'Public Title': a.public_title || '',
      Subtitle: a.subtitle || '',
      Instructions: stripHtml(a.instructions_html || ''),
      'Instructions HTML': a.instructions_html || '',
      Content: stripHtml(a.content_html || ''),
      'Content HTML': a.content_html || '',
      'Visual URL': a.visual_url || '',
      'Media URL': a.media_url || '',
      'Content Type': a.content_type,
      'Is Reusable': a.is_reusable ? 'Yes' : 'No',
      Tags: Array.isArray(a.tags) ? a.tags.join(', ') : '',
      'Created At': a.created_at,
      'Updated At': a.updated_at,
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 36 }, // ID
      { wch: 30 }, // Slug
      { wch: 40 }, // Internal Title
      { wch: 40 }, // Public Title
      { wch: 50 }, // Subtitle
      { wch: 60 }, // Instructions (plain text)
      { wch: 80 }, // Instructions HTML
      { wch: 60 }, // Content (plain text)
      { wch: 80 }, // Content HTML
      { wch: 50 }, // Visual URL
      { wch: 50 }, // Media URL
      { wch: 15 }, // Content Type
      { wch: 12 }, // Is Reusable
      { wch: 30 }, // Tags
      { wch: 20 }, // Created At
      { wch: 20 }, // Updated At
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assignments')

    // Write to buffer and convert to base64
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const base64 = Buffer.from(buffer).toString('base64')

    return { success: true, data: base64 }
  } catch (err) {
    console.error('Unexpected error exporting assignments:', err)
    return { success: false, error: 'Failed to export assignments' }
  }
}

/**
 * Import assignments from Excel file
 */
export async function importAssignments(
  base64Data: string,
  options?: {
    skipExisting?: boolean // Skip rows with matching slugs (default: true)
    updateExisting?: boolean // Update rows with matching slugs (default: false)
  }
): Promise<ImportResult> {
  try {
    const supabase = createAdminClient()

    // Parse the Excel file
    const buffer = Buffer.from(base64Data, 'base64')
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // Get the first sheet
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return { success: false, error: 'No sheets found in the file' }
    }

    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet)

    if (rows.length === 0) {
      return { success: false, error: 'No data rows found in the file' }
    }

    const skipExisting = options?.skipExisting ?? true
    const updateExisting = options?.updateExisting ?? false
    const errors: string[] = []
    let imported = 0
    let skipped = 0

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // Account for header row and 0-index

      try {
        // Validate required fields
        const internalTitle = row['Internal Title']?.trim()
        if (!internalTitle) {
          errors.push(`Row ${rowNum}: Missing Internal Title`)
          skipped++
          continue
        }

        // Check for existing slug
        const slug = row['Slug']?.trim()
        if (slug) {
          const { data: existing } = await supabase
            .from('assignments')
            .select('id')
            .eq('slug', slug)
            .single()

          if (existing) {
            if (updateExisting) {
              // Update existing assignment
              const updateData = buildAssignmentData(row)
              const { error: updateError } = await supabase
                .from('assignments')
                .update(updateData)
                .eq('id', existing.id)

              if (updateError) {
                errors.push(`Row ${rowNum}: Failed to update - ${updateError.message}`)
                skipped++
              } else {
                imported++
              }
            } else if (skipExisting) {
              skipped++
            } else {
              errors.push(`Row ${rowNum}: Duplicate slug "${slug}"`)
              skipped++
            }
            continue
          }
        }

        // Create new assignment
        const newAssignment = buildAssignmentData(row)
        const newSlug = slug || await generateUniqueSlug(internalTitle)

        const { error: insertError } = await supabase
          .from('assignments')
          .insert({
            ...newAssignment,
            slug: newSlug,
          })

        if (insertError) {
          errors.push(`Row ${rowNum}: ${insertError.message}`)
          skipped++
        } else {
          imported++
        }
      } catch (rowErr) {
        errors.push(`Row ${rowNum}: Unexpected error`)
        skipped++
      }
    }

    revalidatePath('/admin/assignments')

    return {
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 10), // Limit error messages
    }
  } catch (err) {
    console.error('Unexpected error importing assignments:', err)
    return { success: false, error: 'Failed to import assignments' }
  }
}

/**
 * Get import template as Excel file
 */
export async function getImportTemplate(): Promise<ExportResult> {
  try {
    const templateData = [
      {
        'Internal Title': 'Example Assignment',
        'Public Title': 'Public Title (optional)',
        Subtitle: 'Brief teaser text (optional)',
        Instructions: 'Plain text instructions (optional)',
        'Instructions HTML': '<p>Rich text instructions with <strong>formatting</strong> (optional)</p>',
        Content: 'Plain text content (optional)',
        'Content HTML': '<p>Rich text content with <em>formatting</em> (optional)</p>',
        'Visual URL': 'https://example.com/image.jpg (optional)',
        'Media URL': 'https://youtube.com/watch?v=xxx (optional)',
        'Content Type': 'standard (standard, video, quiz, or announcement)',
        'Is Reusable': 'Yes (Yes or No)',
        Tags: 'tag1, tag2, tag3 (comma-separated, optional)',
      },
    ]

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(templateData)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 40 }, // Internal Title
      { wch: 40 }, // Public Title
      { wch: 50 }, // Subtitle
      { wch: 60 }, // Instructions
      { wch: 80 }, // Instructions HTML
      { wch: 60 }, // Content
      { wch: 80 }, // Content HTML
      { wch: 50 }, // Visual URL
      { wch: 50 }, // Media URL
      { wch: 40 }, // Content Type
      { wch: 15 }, // Is Reusable
      { wch: 30 }, // Tags
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const base64 = Buffer.from(buffer).toString('base64')

    return { success: true, data: base64 }
  } catch (err) {
    console.error('Unexpected error creating template:', err)
    return { success: false, error: 'Failed to create template' }
  }
}

// Helper: Strip HTML tags from content
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

// Helper: Build assignment data from row
function buildAssignmentData(row: Record<string, string>): Partial<AssignmentInsert> {
  const contentType = row['Content Type']?.toLowerCase().trim()
  const validContentTypes = ['standard', 'video', 'quiz', 'announcement']

  const isReusable = row['Is Reusable']?.toLowerCase().trim()

  const tags = row['Tags']
    ? row['Tags'].split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    : []

  // Prefer HTML fields if available, fall back to plain text
  const instructionsHtml = row['Instructions HTML']?.trim() || row['Instructions']?.trim() || null
  const contentHtml = row['Content HTML']?.trim() || row['Content']?.trim() || null

  return {
    internal_title: row['Internal Title']?.trim() || 'Untitled',
    public_title: row['Public Title']?.trim() || null,
    subtitle: row['Subtitle']?.trim() || null,
    instructions_html: instructionsHtml,
    content_html: contentHtml,
    visual_url: row['Visual URL']?.trim() || null,
    media_url: row['Media URL']?.trim() || null,
    content_type: validContentTypes.includes(contentType) ? contentType as 'standard' | 'video' | 'quiz' | 'announcement' : 'standard',
    is_reusable: isReusable !== 'no',
    tags,
  }
}

// Helper: Generate unique slug
async function generateUniqueSlug(baseName: string): Promise<string> {
  const supabase = createAdminClient()

  let baseSlug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 50)

  if (!baseSlug) {
    baseSlug = 'assignment'
  }

  const randomSuffix = Math.random().toString(36).substring(2, 8)
  let slug = `${baseSlug}-${randomSuffix}`

  const { data } = await supabase
    .from('assignments')
    .select('slug')
    .eq('slug', slug)
    .single()

  if (data) {
    return generateUniqueSlug(baseName)
  }

  return slug
}
