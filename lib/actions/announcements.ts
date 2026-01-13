'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { Announcement, AnnouncementInsert } from '@/lib/types/database'

export type AnnouncementActionResult =
  | { success: true; data: Announcement }
  | { success: false; error: string }

export type AnnouncementsListResult =
  | { success: true; data: Announcement[] }
  | { success: false; error: string }

/**
 * Fetch all announcements for a challenge
 */
export async function getAnnouncementsForChallenge(challengeId: string): Promise<AnnouncementsListResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching announcements:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Announcement[] }
  } catch (err) {
    console.error('Unexpected error fetching announcements:', err)
    return { success: false, error: 'Failed to fetch announcements' }
  }
}

/**
 * Fetch a single announcement by ID
 */
export async function getAnnouncement(id: string): Promise<AnnouncementActionResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching announcement:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Announcement }
  } catch (err) {
    console.error('Unexpected error fetching announcement:', err)
    return { success: false, error: 'Failed to fetch announcement' }
  }
}

/**
 * Create a new announcement
 */
export async function createAnnouncement(input: AnnouncementInsert): Promise<AnnouncementActionResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        challenge_id: input.challenge_id,
        title: input.title,
        content: input.content,
        visual_url: input.visual_url ?? null,
        is_pinned: input.is_pinned ?? false,
        published_at: input.published_at ?? new Date().toISOString(),
        expires_at: input.expires_at ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating announcement:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/challenges/${input.challenge_id}`)
    return { success: true, data: data as Announcement }
  } catch (err) {
    console.error('Unexpected error creating announcement:', err)
    return { success: false, error: 'Failed to create announcement' }
  }
}

/**
 * Update an existing announcement
 */
export async function updateAnnouncement(
  id: string,
  input: Partial<Omit<AnnouncementInsert, 'challenge_id'>>
): Promise<AnnouncementActionResult> {
  try {
    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {}

    if (input.title !== undefined) updateData.title = input.title
    if (input.content !== undefined) updateData.content = input.content
    if (input.visual_url !== undefined) updateData.visual_url = input.visual_url
    if (input.is_pinned !== undefined) updateData.is_pinned = input.is_pinned
    if (input.published_at !== undefined) updateData.published_at = input.published_at
    if (input.expires_at !== undefined) updateData.expires_at = input.expires_at

    const { data, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating announcement:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/challenges/${data.challenge_id}`)
    return { success: true, data: data as Announcement }
  } catch (err) {
    console.error('Unexpected error updating announcement:', err)
    return { success: false, error: 'Failed to update announcement' }
  }
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // First get the announcement to know the challenge_id for revalidation
    const { data: announcement } = await supabase
      .from('announcements')
      .select('challenge_id')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting announcement:', error)
      return { success: false, error: error.message }
    }

    if (announcement) {
      revalidatePath(`/admin/challenges/${announcement.challenge_id}`)
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error deleting announcement:', err)
    return { success: false, error: 'Failed to delete announcement' }
  }
}

/**
 * Toggle pinned status
 */
export async function toggleAnnouncementPinned(id: string): Promise<AnnouncementActionResult> {
  try {
    const supabase = createAdminClient()

    // Get current pinned status
    const { data: current, error: fetchError } = await supabase
      .from('announcements')
      .select('is_pinned, challenge_id')
      .eq('id', id)
      .single()

    if (fetchError || !current) {
      return { success: false, error: 'Announcement not found' }
    }

    const { data, error } = await supabase
      .from('announcements')
      .update({ is_pinned: !current.is_pinned })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling announcement pin:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/challenges/${current.challenge_id}`)
    return { success: true, data: data as Announcement }
  } catch (err) {
    console.error('Unexpected error toggling announcement pin:', err)
    return { success: false, error: 'Failed to toggle pin status' }
  }
}
