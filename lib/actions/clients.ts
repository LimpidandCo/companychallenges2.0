'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { Client, ClientInsert, ClientUpdate, DEFAULT_CLIENT_FEATURES } from '@/lib/types/database'

export type ClientActionResult =
  | { success: true; data: Client }
  | { success: false; error: string }

export type ClientsListResult =
  | { success: true; data: Client[] }
  | { success: false; error: string }

/**
 * Fetch all clients
 */
export async function getClients(): Promise<ClientsListResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching clients:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Client[] }
  } catch (err) {
    console.error('Unexpected error fetching clients:', err)
    return { success: false, error: 'Failed to fetch clients' }
  }
}

/**
 * Fetch a single client by ID
 */
export async function getClient(id: string): Promise<ClientActionResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching client:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Client }
  } catch (err) {
    console.error('Unexpected error fetching client:', err)
    return { success: false, error: 'Failed to fetch client' }
  }
}

/**
 * Create a new client
 */
export async function createClient(input: ClientInsert): Promise<ClientActionResult> {
  try {
    const supabase = createAdminClient()

    // Merge features with defaults
    const features = {
      announcements: false,
      host_videos: false,
      sprint_structure: false,
      collective_progress: false,
      time_based_unlocks: false,
      milestones: false,
      reveal_moments: false,
      micro_quizzes: false,
      progress_tracking: false,
      session_persistence: false,
      private_views: false,
      ...input.features,
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: input.name,
        logo_url: input.logo_url ?? null,
        mode: input.mode ?? 'collective',
        features,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/clients')
    return { success: true, data: data as Client }
  } catch (err) {
    console.error('Unexpected error creating client:', err)
    return { success: false, error: 'Failed to create client' }
  }
}

/**
 * Update an existing client
 */
export async function updateClient(id: string, input: ClientUpdate): Promise<ClientActionResult> {
  try {
    const supabase = createAdminClient()

    // Build update object
    const updateData: Record<string, unknown> = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.logo_url !== undefined) updateData.logo_url = input.logo_url
    if (input.mode !== undefined) updateData.mode = input.mode

    if (input.features !== undefined) {
      // First get current features to merge
      const { data: current } = await supabase
        .from('clients')
        .select('features')
        .eq('id', id)
        .single()

      updateData.features = {
        ...(current?.features ?? {}),
        ...input.features,
      }
    }

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/clients')
    revalidatePath(`/admin/clients/${id}`)
    return { success: true, data: data as Client }
  } catch (err) {
    console.error('Unexpected error updating client:', err)
    return { success: false, error: 'Failed to update client' }
  }
}

/**
 * Delete a client
 */
export async function deleteClient(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Check if client has challenges
    const { count } = await supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', id)

    if (count && count > 0) {
      return {
        success: false,
        error: `Cannot delete client with ${count} challenge(s). Archive or delete challenges first.`
      }
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting client:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/clients')
    return { success: true }
  } catch (err) {
    console.error('Unexpected error deleting client:', err)
    return { success: false, error: 'Failed to delete client' }
  }
}
