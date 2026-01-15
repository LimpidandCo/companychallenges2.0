'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, Input, Spinner } from '@/components/ui'
import { createClient, updateClient } from '@/lib/actions/clients'
import { uploadFile } from '@/lib/actions/upload'
import type { Client } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

interface ClientFormProps {
  client?: Client | null
  open: boolean
  onClose: () => void
  onSuccess?: (client: Client) => void
}

export function ClientForm({ client, open, onClose, onSuccess }: ClientFormProps) {
  const isEditing = !!client
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(client?.name ?? '')
  const [logoUrl, setLogoUrl] = useState(client?.logo_url ?? '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when opening
  useEffect(() => {
    if (open) {
      if (isEditing && client) {
        setName(client.name ?? '')
        setLogoUrl(client.logo_url ?? '')
        setError(null)
      } else {
        setName('')
        setLogoUrl('')
        setError(null)
      }
    }
  }, [open, isEditing, client])

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadFile(formData, 'clients')

      if (result.success) {
        setLogoUrl(result.url)
      } else {
        setError(result.error)
      }
    } catch {
      setError('Failed to upload file')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = isEditing
        ? await updateClient(client.id, { name, logo_url: logoUrl || null })
        : await createClient({ name, logo_url: logoUrl || null })

      if (result.success) {
        onSuccess?.(result.data)
        onClose()
      } else {
        setError(result.error)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-2xl bg-[var(--color-bg-elevated)] shadow-2xl border border-[var(--color-border)] overflow-hidden">
          {/* Header with gradient accent */}
          <div className="relative px-6 py-5 border-b border-[var(--color-border)]">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/5 to-transparent" />
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-fg)]">
                  {isEditing ? 'Edit Client' : 'Create New Client'}
                </h2>
                <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">
                  {isEditing ? 'Update client details' : 'Add a new organization'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-[var(--color-bg-muted)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-all"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <ErrorIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-fg)]">
                Client Logo
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={cn(
                  "relative group cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200",
                  "flex flex-col items-center justify-center py-8 px-4",
                  isDragging
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 scale-[1.02]"
                    : logoUrl
                    ? "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)]/50"
                    : "border-[var(--color-border)] bg-[var(--color-bg-subtle)] hover:border-[var(--color-fg-muted)] hover:bg-[var(--color-bg-muted)]"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                      <Spinner size="md" />
                    </div>
                    <p className="text-sm text-[var(--color-fg-muted)]">Uploading...</p>
                  </div>
                ) : logoUrl ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-xl bg-white shadow-lg border border-[var(--color-border)] p-2 flex items-center justify-center overflow-hidden">
                        <img
                          src={logoUrl}
                          alt="Logo preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setLogoUrl('')
                        }}
                        className="absolute -top-2 -right-2 p-1.5 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-md hover:bg-red-500 hover:border-red-500 hover:text-white text-[var(--color-fg-muted)] transition-all"
                      >
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-[var(--color-fg-muted)]">
                      Click or drag to replace
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-[var(--color-bg-muted)] group-hover:bg-[var(--color-accent)]/10 flex items-center justify-center transition-colors">
                      <UploadIcon className="h-6 w-6 text-[var(--color-fg-subtle)] group-hover:text-[var(--color-accent)] transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--color-fg)]">
                        Drop your logo here
                      </p>
                      <p className="text-xs text-[var(--color-fg-muted)] mt-1">
                        or click to browse • PNG, JPG up to 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-fg)]">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter client name..."
                required
                autoFocus
                className={cn(
                  "w-full px-4 py-3 rounded-xl border transition-all duration-200",
                  "bg-[var(--color-bg)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)]",
                  "border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20",
                  "outline-none"
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {isEditing ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create Client
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}
