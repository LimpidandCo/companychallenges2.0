'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Select,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  Spinner,
  RichTextEditor,
} from '@/components/ui'
import { createChallenge, updateChallenge } from '@/lib/actions/challenges'
import type { Challenge, Client } from '@/lib/types/database'

interface ChallengeFormProps {
  challenge?: Challenge | null
  clients: Client[]
  open: boolean
  onClose: () => void
  onSuccess?: (challenge: Challenge) => void
}

export function ChallengeForm({ challenge, clients, open, onClose, onSuccess }: ChallengeFormProps) {
  const isEditing = !!challenge

  const [clientId, setClientId] = useState(challenge?.client_id ?? (clients[0]?.id || ''))
  const [internalName, setInternalName] = useState(challenge?.internal_name ?? '')
  const [publicTitle, setPublicTitle] = useState(challenge?.public_title ?? '')
  const [showPublicTitle, setShowPublicTitle] = useState(challenge?.show_public_title ?? true)
  const [description, setDescription] = useState(challenge?.description ?? '')
  const [brandColor, setBrandColor] = useState(challenge?.brand_color ?? '#3b82f6')
  const [folder, setFolder] = useState(challenge?.folder ?? '')
  const [slug, setSlug] = useState(challenge?.slug ?? '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = isEditing
        ? await updateChallenge(challenge.id, {
            internal_name: internalName,
            public_title: publicTitle || null,
            show_public_title: showPublicTitle,
            description: description || null,
            brand_color: brandColor || null,
            folder: folder || null,
            slug: slug || undefined,
          })
        : await createChallenge({
            client_id: clientId,
            internal_name: internalName,
            public_title: publicTitle || null,
            show_public_title: showPublicTitle,
            description: description || null,
            brand_color: brandColor || null,
            folder: folder || null,
            slug: slug || undefined,
          })

      if (result.success) {
        onSuccess?.(result.data)
        onClose()
        // Reset form for next use
        if (!isEditing) {
          setInternalName('')
          setPublicTitle('')
          setDescription('')
          setBrandColor('#3b82f6')
          setFolder('')
          setSlug('')
        }
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }))

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Challenge' : 'Create Challenge'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the challenge details.'
              : 'Create a new learning trajectory for your participants.'}
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-3 text-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          {!isEditing && (
            <Select
              label="Client"
              name="client_id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              options={clientOptions}
              required
            />
          )}

          <Input
            label="Internal Name"
            name="internal_name"
            value={internalName}
            onChange={(e) => setInternalName(e.target.value)}
            placeholder="Q1 2026 Leadership Challenge"
            hint="Admin-only identifier for this challenge."
            required
          />

          <Input
            label="Public Title"
            name="public_title"
            value={publicTitle}
            onChange={(e) => setPublicTitle(e.target.value)}
            placeholder="Leadership Development Program"
            hint="Optional. Title shown to participants."
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPublicTitle}
              onChange={(e) => setShowPublicTitle(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)]"
            />
            <span className="text-[var(--color-fg)]">Show public title to participants</span>
          </label>

          <RichTextEditor
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Welcome to this challenge..."
            hint="Use the toolbar to format text, add links, and embed media."
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-fg)]">Brand Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border)]"
                />
                <Input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <Input
              label="Folder"
              name="folder"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="2026 Q1"
              hint="For organizing challenges."
            />
          </div>

          {isEditing && (
            <Input
              label="Custom Slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="leadership-2026"
              hint="Used in the public URL. Change with care."
            />
          )}
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !internalName.trim() || !clientId}>
            {isSubmitting && <Spinner size="sm" className="mr-2" />}
            {isEditing ? 'Save Changes' : 'Create Challenge'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
