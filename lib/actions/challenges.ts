'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { Challenge, ChallengeInsert, ChallengeUpdate, ChallengeWithClient, Client } from '@/lib/types/database'

export type ChallengeActionResult =
  | { success: true; data: Challenge }
  | { success: false; error: string }

export type ChallengesListResult =
  | { success: true; data: ChallengeWithClient[] }
  | { success: false; error: string }

export type ChallengeWithClientResult =
  | { success: true; data: ChallengeWithClient }
  | { success: false; error: string }

/**
 * Fetch all challenges with their client data
 */
export async function getChallenges(options?: {
  clientId?: string
  folder?: string
  includeArchived?: boolean
}): Promise<ChallengesListResult> {
  try {
    const supabase = createAdminClient()

    let query = supabase
      .from('challenges')
      .select('*, client:clients(*)')
      .order('internal_name', { ascending: true })

    if (options?.clientId) {
      query = query.eq('client_id', options.clientId)
    }

    if (options?.folder) {
      query = query.eq('folder', options.folder)
    }

    if (!options?.includeArchived) {
      query = query.eq('is_archived', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching challenges:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as ChallengeWithClient[] }
  } catch (err) {
    console.error('Unexpected error fetching challenges:', err)
    return { success: false, error: 'Failed to fetch challenges' }
  }
}

/**
 * Fetch a single challenge by ID with client data
 */
export async function getChallenge(id: string): Promise<ChallengeWithClientResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('challenges')
      .select('*, client:clients(*)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching challenge:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as ChallengeWithClient }
  } catch (err) {
    console.error('Unexpected error fetching challenge:', err)
    return { success: false, error: 'Failed to fetch challenge' }
  }
}

/**
 * Fetch a challenge by slug
 */
export async function getChallengeBySlug(slug: string): Promise<ChallengeWithClientResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('challenges')
      .select('*, client:clients(*)')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching challenge by slug:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as ChallengeWithClient }
  } catch (err) {
    console.error('Unexpected error fetching challenge:', err)
    return { success: false, error: 'Failed to fetch challenge' }
  }
}

/**
 * Generate a unique slug
 */
async function generateUniqueSlug(baseName: string): Promise<string> {
  const supabase = createAdminClient()

  // Generate base slug from name
  let baseSlug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 50)

  if (!baseSlug) {
    baseSlug = 'challenge'
  }

  // Add random suffix
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  let slug = `${baseSlug}-${randomSuffix}`

  // Check uniqueness
  const { data } = await supabase
    .from('challenges')
    .select('slug')
    .eq('slug', slug)
    .single()

  if (data) {
    // If collision, regenerate
    return generateUniqueSlug(baseName)
  }

  return slug
}

/**
 * Create a new challenge
 */
export async function createChallenge(input: ChallengeInsert): Promise<ChallengeActionResult> {
  try {
    const supabase = createAdminClient()

    // Generate slug if not provided
    const slug = input.slug || await generateUniqueSlug(input.internal_name)

    const { data, error } = await supabase
      .from('challenges')
      .insert({
        client_id: input.client_id,
        slug,
        internal_name: input.internal_name,
        public_title: input.public_title ?? null,
        show_public_title: input.show_public_title ?? true,
        description: input.description ?? null,
        brand_color: input.brand_color ?? null,
        support_info: input.support_info ?? null,
        visual_url: input.visual_url ?? null,
        folder: input.folder ?? null,
        starts_at: input.starts_at ?? null,
        ends_at: input.ends_at ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating challenge:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/challenges')
    return { success: true, data: data as Challenge }
  } catch (err) {
    console.error('Unexpected error creating challenge:', err)
    return { success: false, error: 'Failed to create challenge' }
  }
}

/**
 * Update an existing challenge
 */
export async function updateChallenge(id: string, input: ChallengeUpdate): Promise<ChallengeActionResult> {
  try {
    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {}

    if (input.slug !== undefined) updateData.slug = input.slug
    if (input.internal_name !== undefined) updateData.internal_name = input.internal_name
    if (input.public_title !== undefined) updateData.public_title = input.public_title
    if (input.show_public_title !== undefined) updateData.show_public_title = input.show_public_title
    if (input.description !== undefined) updateData.description = input.description
    if (input.brand_color !== undefined) updateData.brand_color = input.brand_color
    if (input.support_info !== undefined) updateData.support_info = input.support_info
    if (input.visual_url !== undefined) updateData.visual_url = input.visual_url
    if (input.is_archived !== undefined) updateData.is_archived = input.is_archived
    if (input.folder !== undefined) updateData.folder = input.folder
    if (input.starts_at !== undefined) updateData.starts_at = input.starts_at
    if (input.ends_at !== undefined) updateData.ends_at = input.ends_at

    const { data, error } = await supabase
      .from('challenges')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating challenge:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/challenges')
    revalidatePath(`/admin/challenges/${id}`)
    return { success: true, data: data as Challenge }
  } catch (err) {
    console.error('Unexpected error updating challenge:', err)
    return { success: false, error: 'Failed to update challenge' }
  }
}

/**
 * Archive a challenge (soft delete)
 */
export async function archiveChallenge(id: string): Promise<ChallengeActionResult> {
  return updateChallenge(id, { is_archived: true })
}

/**
 * Restore an archived challenge
 */
export async function restoreChallenge(id: string): Promise<ChallengeActionResult> {
  return updateChallenge(id, { is_archived: false })
}

/**
 * Duplicate a challenge (copies structure, not content)
 */
export async function duplicateChallenge(id: string): Promise<ChallengeActionResult> {
  try {
    const supabase = createAdminClient()

    // Get the original challenge
    const { data: original, error: fetchError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !original) {
      return { success: false, error: 'Challenge not found' }
    }

    // Generate new slug
    const newSlug = await generateUniqueSlug(`${original.internal_name} copy`)

    // Create the duplicate
    const { data, error } = await supabase
      .from('challenges')
      .insert({
        client_id: original.client_id,
        slug: newSlug,
        internal_name: `${original.internal_name} (Copy)`,
        public_title: original.public_title,
        show_public_title: original.show_public_title,
        description: original.description,
        brand_color: original.brand_color,
        support_info: original.support_info,
        visual_url: original.visual_url,
        folder: original.folder,
        is_archived: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error duplicating challenge:', error)
      return { success: false, error: error.message }
    }

    // Copy assignment usages (references, not the assignments themselves)
    const { data: usages } = await supabase
      .from('assignment_usages')
      .select('*')
      .eq('challenge_id', id)

    if (usages && usages.length > 0) {
      const newUsages = usages.map((usage) => ({
        challenge_id: data.id,
        sprint_id: null, // Sprints are not copied in this basic implementation
        assignment_id: usage.assignment_id,
        position: usage.position,
        is_visible: usage.is_visible,
        release_at: null, // Reset release dates
        label: usage.label,
        is_milestone: usage.is_milestone,
        reveal_style: usage.reveal_style,
      }))

      await supabase.from('assignment_usages').insert(newUsages)
    }

    revalidatePath('/admin/challenges')
    return { success: true, data: data as Challenge }
  } catch (err) {
    console.error('Unexpected error duplicating challenge:', err)
    return { success: false, error: 'Failed to duplicate challenge' }
  }
}

/**
 * Delete a challenge permanently
 */
export async function deleteChallenge(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting challenge:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/challenges')
    return { success: true }
  } catch (err) {
    console.error('Unexpected error deleting challenge:', err)
    return { success: false, error: 'Failed to delete challenge' }
  }
}

/**
 * Get unique folders from all challenges
 */
export async function getChallengeFolders(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('challenges')
      .select('folder')
      .not('folder', 'is', null)
      .order('folder')

    if (error) {
      return { success: false, error: error.message }
    }

    const folders = [...new Set(data.map((c) => c.folder).filter(Boolean))] as string[]
    return { success: true, data: folders }
  } catch (err) {
    return { success: false, error: 'Failed to fetch folders' }
  }
}
