'use server'

import { uploadMedia, deleteMedia } from '@/lib/supabase/storage'

export type UploadResult =
  | { success: true; url: string }
  | { success: false; error: string }

/**
 * Upload a file to the media storage bucket
 */
export async function uploadFile(
  formData: FormData,
  folder: 'challenges' | 'assignments' | 'clients' | 'announcements' = 'assignments'
): Promise<UploadResult> {
  try {
    const file = formData.get('file') as File

    if (!file || file.size === 0) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file size (50MB max)
    if (file.size > 52428800) {
      return { success: false, error: 'File size exceeds 50MB limit' }
    }

    // Validate file type
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/heic',
      'image/heif',
    ]
    const allowedVideoTypes = [
      'video/mp4',
      'video/webm',
    ]
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes]

    if (!allowedTypes.includes(file.type)) {
      // Provide a user-friendly error message
      const friendlyTypes = 'JPG, PNG, GIF, WebP, SVG, HEIC, MP4, WebM'
      return {
        success: false,
        error: `Unsupported file format. Please use: ${friendlyTypes}`,
      }
    }

    const result = await uploadMedia(file, folder)

    if (result.error || !result.url) {
      return { success: false, error: result.error ?? 'Upload failed' }
    }

    return { success: true, url: result.url }
  } catch (err) {
    console.error('Error in uploadFile action:', err)
    return { success: false, error: 'Failed to upload file' }
  }
}

/**
 * Delete a file from media storage
 */
export async function deleteFile(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!url) {
      return { success: false, error: 'No URL provided' }
    }

    const result = await deleteMedia(url)

    if (!result.success) {
      return { success: false, error: result.error ?? 'Delete failed' }
    }

    return { success: true }
  } catch (err) {
    console.error('Error in deleteFile action:', err)
    return { success: false, error: 'Failed to delete file' }
  }
}
