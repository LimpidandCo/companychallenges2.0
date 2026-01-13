'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { MicroQuiz, MicroQuizInsert, MicroQuizUpdate } from '@/lib/types/database'

export type MicroQuizActionResult =
  | { success: true; data: MicroQuiz }
  | { success: false; error: string }

export type MicroQuizzesListResult =
  | { success: true; data: MicroQuiz[] }
  | { success: false; error: string }

/**
 * Fetch all micro-quizzes for an assignment
 */
export async function getMicroQuizzesForAssignment(assignmentId: string): Promise<MicroQuizzesListResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('micro_quizzes')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching micro-quizzes:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as MicroQuiz[] }
  } catch (err) {
    console.error('Unexpected error fetching micro-quizzes:', err)
    return { success: false, error: 'Failed to fetch micro-quizzes' }
  }
}

/**
 * Fetch a single micro-quiz by ID
 */
export async function getMicroQuiz(id: string): Promise<MicroQuizActionResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('micro_quizzes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching micro-quiz:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as MicroQuiz }
  } catch (err) {
    console.error('Unexpected error fetching micro-quiz:', err)
    return { success: false, error: 'Failed to fetch micro-quiz' }
  }
}

/**
 * Get the next position for a new micro-quiz
 */
async function getNextMicroQuizPosition(assignmentId: string): Promise<number> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('micro_quizzes')
    .select('position')
    .eq('assignment_id', assignmentId)
    .order('position', { ascending: false })
    .limit(1)

  if (data && data.length > 0) {
    return data[0].position + 1
  }

  return 0
}

/**
 * Create a new micro-quiz
 */
export async function createMicroQuiz(input: MicroQuizInsert): Promise<MicroQuizActionResult> {
  try {
    const supabase = createAdminClient()

    // Get next position if not provided
    const position = input.position ?? await getNextMicroQuizPosition(input.assignment_id)

    const { data, error } = await supabase
      .from('micro_quizzes')
      .insert({
        assignment_id: input.assignment_id,
        question: input.question,
        quiz_type: input.quiz_type,
        options: input.options ?? null,
        scale_min: input.scale_min ?? null,
        scale_max: input.scale_max ?? null,
        scale_labels: input.scale_labels ?? null,
        position,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating micro-quiz:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/assignments')
    return { success: true, data: data as MicroQuiz }
  } catch (err) {
    console.error('Unexpected error creating micro-quiz:', err)
    return { success: false, error: 'Failed to create micro-quiz' }
  }
}

/**
 * Update an existing micro-quiz
 */
export async function updateMicroQuiz(id: string, input: MicroQuizUpdate): Promise<MicroQuizActionResult> {
  try {
    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {}

    if (input.question !== undefined) updateData.question = input.question
    if (input.quiz_type !== undefined) updateData.quiz_type = input.quiz_type
    if (input.options !== undefined) updateData.options = input.options
    if (input.scale_min !== undefined) updateData.scale_min = input.scale_min
    if (input.scale_max !== undefined) updateData.scale_max = input.scale_max
    if (input.scale_labels !== undefined) updateData.scale_labels = input.scale_labels
    if (input.position !== undefined) updateData.position = input.position

    const { data, error } = await supabase
      .from('micro_quizzes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating micro-quiz:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/assignments')
    return { success: true, data: data as MicroQuiz }
  } catch (err) {
    console.error('Unexpected error updating micro-quiz:', err)
    return { success: false, error: 'Failed to update micro-quiz' }
  }
}

/**
 * Delete a micro-quiz
 */
export async function deleteMicroQuiz(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('micro_quizzes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting micro-quiz:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/assignments')
    return { success: true }
  } catch (err) {
    console.error('Unexpected error deleting micro-quiz:', err)
    return { success: false, error: 'Failed to delete micro-quiz' }
  }
}

/**
 * Reorder micro-quizzes
 */
export async function reorderMicroQuizzes(quizIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Update positions for all quizzes
    const updates = quizIds.map((id, index) =>
      supabase
        .from('micro_quizzes')
        .update({ position: index })
        .eq('id', id)
    )

    const results = await Promise.all(updates)
    const error = results.find((r) => r.error)?.error

    if (error) {
      console.error('Error reordering micro-quizzes:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/assignments')
    return { success: true }
  } catch (err) {
    console.error('Unexpected error reordering micro-quizzes:', err)
    return { success: false, error: 'Failed to reorder micro-quizzes' }
  }
}
