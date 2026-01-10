'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { AssignmentVariant } from '@/lib/types/database'

export type VariantActionResult =
  | { success: true; data: AssignmentVariant }
  | { success: false; error: string }

export type VariantsListResult =
  | { success: true; data: AssignmentVariant[] }
  | { success: false; error: string }

/**
 * Get all variants for an assignment (both directions)
 */
export async function getAssignmentVariants(assignmentId: string): Promise<VariantsListResult> {
  try {
    const supabase = createAdminClient()

    // Get variants where this assignment is the source
    const { data: asSource, error: sourceError } = await supabase
      .from('assignment_variants')
      .select(`
        *,
        target:assignments!target_assignment_id (
          id,
          internal_title,
          public_title,
          slug
        )
      `)
      .eq('source_assignment_id', assignmentId)

    if (sourceError) {
      console.error('Error fetching variants as source:', sourceError)
      return { success: false, error: sourceError.message }
    }

    // Get variants where this assignment is the target
    const { data: asTarget, error: targetError } = await supabase
      .from('assignment_variants')
      .select(`
        *,
        source:assignments!source_assignment_id (
          id,
          internal_title,
          public_title,
          slug
        )
      `)
      .eq('target_assignment_id', assignmentId)

    if (targetError) {
      console.error('Error fetching variants as target:', targetError)
      return { success: false, error: targetError.message }
    }

    // Combine and return
    const variants = [...(asSource || []), ...(asTarget || [])] as AssignmentVariant[]

    return { success: true, data: variants }
  } catch (err) {
    console.error('Unexpected error fetching variants:', err)
    return { success: false, error: 'Failed to fetch variants' }
  }
}

/**
 * Create a variant relationship between two assignments
 */
export async function createVariant(
  sourceAssignmentId: string,
  targetAssignmentId: string,
  relationshipLabel: string
): Promise<VariantActionResult> {
  try {
    if (sourceAssignmentId === targetAssignmentId) {
      return { success: false, error: 'Cannot create variant relationship with the same assignment' }
    }

    const supabase = createAdminClient()

    // Check if relationship already exists (in either direction)
    const { data: existing } = await supabase
      .from('assignment_variants')
      .select('id')
      .or(`and(source_assignment_id.eq.${sourceAssignmentId},target_assignment_id.eq.${targetAssignmentId}),and(source_assignment_id.eq.${targetAssignmentId},target_assignment_id.eq.${sourceAssignmentId})`)
      .single()

    if (existing) {
      return { success: false, error: 'A variant relationship already exists between these assignments' }
    }

    const { data, error } = await supabase
      .from('assignment_variants')
      .insert({
        source_assignment_id: sourceAssignmentId,
        target_assignment_id: targetAssignmentId,
        relationship_label: relationshipLabel
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating variant:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/assignments')
    return { success: true, data: data as AssignmentVariant }
  } catch (err) {
    console.error('Unexpected error creating variant:', err)
    return { success: false, error: 'Failed to create variant' }
  }
}

/**
 * Update a variant relationship label
 */
export async function updateVariant(
  variantId: string,
  relationshipLabel: string
): Promise<VariantActionResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('assignment_variants')
      .update({ relationship_label: relationshipLabel })
      .eq('id', variantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating variant:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/assignments')
    return { success: true, data: data as AssignmentVariant }
  } catch (err) {
    console.error('Unexpected error updating variant:', err)
    return { success: false, error: 'Failed to update variant' }
  }
}

/**
 * Delete a variant relationship
 */
export async function deleteVariant(variantId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('assignment_variants')
      .delete()
      .eq('id', variantId)

    if (error) {
      console.error('Error deleting variant:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/assignments')
    return { success: true }
  } catch (err) {
    console.error('Unexpected error deleting variant:', err)
    return { success: false, error: 'Failed to delete variant' }
  }
}

/**
 * Get available assignments for variant linking (excludes already linked)
 */
export async function getAvailableVariantTargets(
  assignmentId: string
): Promise<{ success: true; data: { id: string; internal_title: string }[] } | { success: false; error: string }> {
  try {
    const supabase = createAdminClient()

    // Get all linked assignment IDs
    const { data: variants } = await supabase
      .from('assignment_variants')
      .select('source_assignment_id, target_assignment_id')
      .or(`source_assignment_id.eq.${assignmentId},target_assignment_id.eq.${assignmentId}`)

    const linkedIds = new Set<string>()
    linkedIds.add(assignmentId) // Exclude self

    if (variants) {
      for (const v of variants) {
        linkedIds.add(v.source_assignment_id)
        linkedIds.add(v.target_assignment_id)
      }
    }

    // Get all assignments not in the linked set
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, internal_title')
      .order('internal_title')

    if (error) {
      return { success: false, error: error.message }
    }

    const available = (assignments || []).filter(a => !linkedIds.has(a.id))

    return { success: true, data: available }
  } catch (err) {
    console.error('Unexpected error fetching available targets:', err)
    return { success: false, error: 'Failed to fetch assignments' }
  }
}
