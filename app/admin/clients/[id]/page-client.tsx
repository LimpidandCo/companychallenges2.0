'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Spinner } from '@/components/ui'
import { ChallengeForm } from '@/components/admin/challenge-form'
import { archiveChallenge, restoreChallenge, deleteChallenge, duplicateChallenge } from '@/lib/actions/challenges'
import type { Client, Challenge, ChallengeWithClient } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

interface ClientDetailClientProps {
  client: Client
  initialChallenges: ChallengeWithClient[]
  initialError: string | null
}

export function ClientDetailClient({ client, initialChallenges, initialError }: ClientDetailClientProps) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(initialError)

  const activeChallenges = initialChallenges.filter(c => !c.is_archived)
  const archivedChallenges = initialChallenges.filter(c => c.is_archived)

  const handleAddClick = () => {
    setEditingChallenge(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (challenge: Challenge) => {
    setEditingChallenge(challenge)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingChallenge(null)
  }

  const handleSuccess = () => {
    router.refresh()
  }

  const handleArchive = async (challenge: Challenge) => {
    setActionInProgress(challenge.id)
    setError(null)
    try {
      const result = await archiveChallenge(challenge.id)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to archive challenge')
      }
    } catch {
      setError('Failed to archive challenge')
    } finally {
      setActionInProgress(null)
    }
  }

  const handleRestore = async (challenge: Challenge) => {
    setActionInProgress(challenge.id)
    setError(null)
    try {
      const result = await restoreChallenge(challenge.id)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to restore challenge')
      }
    } catch {
      setError('Failed to restore challenge')
    } finally {
      setActionInProgress(null)
    }
  }

  const handleDuplicate = async (challenge: Challenge) => {
    setActionInProgress(challenge.id)
    setError(null)
    try {
      const result = await duplicateChallenge(challenge.id)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to duplicate challenge')
      }
    } catch {
      setError('Failed to duplicate challenge')
    } finally {
      setActionInProgress(null)
    }
  }

  const handleDelete = async (challenge: Challenge) => {
    if (!confirm(`Are you sure you want to permanently delete "${challenge.internal_name}"? This cannot be undone.`)) {
      return
    }
    setActionInProgress(challenge.id)
    setError(null)
    try {
      const result = await deleteChallenge(challenge.id)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to delete challenge')
      }
    } catch {
      setError('Failed to delete challenge')
    } finally {
      setActionInProgress(null)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
        <Link href="/admin/clients" className="hover:text-[var(--color-fg)] transition-colors">
          Clients
        </Link>
        <ChevronRightIcon className="h-4 w-4" />
        <span className="text-[var(--color-fg)]">{client.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {client.logo_url ? (
            <img
              src={client.logo_url}
              alt={`${client.name} logo`}
              className="h-16 w-16 rounded-xl object-contain bg-[var(--color-bg-muted)] border border-[var(--color-border)]"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-[var(--color-bg-muted)] border border-[var(--color-border)] flex items-center justify-center text-2xl font-semibold text-[var(--color-fg-muted)]">
              {client.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-fg)]">{client.name}</h1>
            <p className="mt-1 text-[var(--color-fg-muted)]">
              {activeChallenges.length} active challenge{activeChallenges.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button onClick={handleAddClick}>
          <PlusIcon className="h-4 w-4" />
          New Challenge
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-[var(--color-error-subtle)] px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {/* Active Challenges */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Challenges</CardTitle>
          <CardDescription>
            {activeChallenges.length > 0
              ? `${activeChallenges.length} challenge${activeChallenges.length !== 1 ? 's' : ''} for this client`
              : 'No challenges yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeChallenges.length > 0 ? (
            <div className="space-y-3">
              {activeChallenges.map((challenge) => (
                <ChallengeRow
                  key={challenge.id}
                  challenge={challenge}
                  isLoading={actionInProgress === challenge.id}
                  onEdit={() => handleEditClick(challenge)}
                  onArchive={() => handleArchive(challenge)}
                  onDuplicate={() => handleDuplicate(challenge)}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[150px] items-center justify-center text-[var(--color-fg-muted)]">
              <div className="text-center">
                <FlagIcon className="mx-auto h-10 w-10 text-[var(--color-fg-subtle)]" />
                <h3 className="mt-3 text-base font-medium text-[var(--color-fg)]">No challenges yet</h3>
                <p className="mt-1 text-sm">Create your first challenge for this client.</p>
                <Button className="mt-4" variant="secondary" onClick={handleAddClick}>
                  <PlusIcon className="h-4 w-4" />
                  New Challenge
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archived Challenges */}
      {archivedChallenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[var(--color-fg-muted)]">Archived</CardTitle>
            <CardDescription>
              {archivedChallenges.length} archived challenge{archivedChallenges.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {archivedChallenges.map((challenge) => (
                <ChallengeRow
                  key={challenge.id}
                  challenge={challenge}
                  isLoading={actionInProgress === challenge.id}
                  isArchived
                  onRestore={() => handleRestore(challenge)}
                  onDelete={() => handleDelete(challenge)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Challenge Form Modal */}
      <ChallengeForm
        challenge={editingChallenge}
        clientId={client.id}
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

interface ChallengeRowProps {
  challenge: ChallengeWithClient
  isLoading: boolean
  isArchived?: boolean
  onEdit?: () => void
  onArchive?: () => void
  onDuplicate?: () => void
  onRestore?: () => void
  onDelete?: () => void
}

function ChallengeRow({
  challenge,
  isLoading,
  isArchived,
  onEdit,
  onArchive,
  onDuplicate,
  onRestore,
  onDelete,
}: ChallengeRowProps) {
  const [copied, setCopied] = useState(false)

  const getPublicUrl = () => {
    if (typeof window === 'undefined') return `/${challenge.slug}`
    return `${window.location.origin}/${challenge.slug}`
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(getPublicUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        isArchived
          ? "border-[var(--color-border)] bg-[var(--color-bg-subtle)] opacity-60"
          : "border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-subtle)]"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="h-10 w-10 rounded-lg flex-shrink-0"
            style={{ backgroundColor: challenge.brand_color || '#6366f1' }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/challenges/${challenge.id}`}
                className="font-medium text-[var(--color-fg)] hover:text-[var(--color-accent)] transition-colors truncate"
              >
                {challenge.internal_name}
              </Link>
              {!isArchived && (
                <div className="flex items-center gap-1">
                  <Badge variant="success" className="text-xs">Live</Badge>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
              )}
            </div>
            {challenge.public_title && (
              <p className="text-sm text-[var(--color-fg-muted)] truncate">
                {challenge.public_title}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {challenge.folder && (
            <Badge variant="outline" className="hidden sm:inline-flex">
              {challenge.folder}
            </Badge>
          )}

        {isLoading ? (
          <Spinner size="sm" />
        ) : isArchived ? (
          <>
            <Button variant="ghost" size="sm" onClick={onRestore}>
              Restore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)]"
            >
              Delete
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={onDuplicate}>
              Duplicate
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Link href={`/admin/challenges/${challenge.id}`}>
              <Button variant="secondary" size="sm">
                Manage
              </Button>
            </Link>
          </>
        )}
        </div>
      </div>

      {/* URL Section */}
      {!isArchived && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-[var(--color-fg-subtle)] flex-shrink-0" />
          <code className="text-xs font-mono text-[var(--color-fg-muted)] bg-[var(--color-bg-muted)] px-2 py-1 rounded truncate">
            /{challenge.slug}
          </code>
          <button
            onClick={copyUrl}
            className="p-1.5 rounded hover:bg-[var(--color-bg-muted)] text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] transition-colors flex-shrink-0"
            title="Copy URL"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </button>
          <a
            href={getPublicUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-[var(--color-bg-muted)] text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] transition-colors flex-shrink-0"
            title="Open in new tab"
          >
            <ExternalLinkIcon className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
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

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  )
}
