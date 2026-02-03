'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Badge, Spinner } from '@/components/ui'
import { archiveChallenge, restoreChallenge, duplicateChallenge, deleteChallenge } from '@/lib/actions/challenges'
import type { ChallengeWithClient } from '@/lib/types/database'

interface ChallengeListProps {
  challenges: ChallengeWithClient[]
  onEdit: (challenge: ChallengeWithClient) => void
  onRefresh: () => void
}

export function ChallengeList({ challenges, onEdit, onRefresh }: ChallengeListProps) {
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleArchive = async (challenge: ChallengeWithClient) => {
    setActionId(challenge.id)
    setError(null)

    try {
      const result = challenge.is_archived
        ? await restoreChallenge(challenge.id)
        : await archiveChallenge(challenge.id)

      if (result.success) {
        onRefresh()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to update challenge')
    } finally {
      setActionId(null)
    }
  }

  const handleDuplicate = async (challenge: ChallengeWithClient) => {
    setActionId(challenge.id)
    setError(null)

    try {
      const result = await duplicateChallenge(challenge.id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to duplicate challenge')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (challenge: ChallengeWithClient) => {
    if (!confirm(`Are you sure you want to permanently delete "${challenge.internal_name}"? This cannot be undone.`)) {
      return
    }

    setActionId(challenge.id)
    setError(null)

    try {
      const result = await deleteChallenge(challenge.id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error ?? 'Failed to delete challenge')
      }
    } catch (err) {
      setError('Failed to delete challenge')
    } finally {
      setActionId(null)
    }
  }

  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyUrl = (challenge: ChallengeWithClient) => {
    const url = `${window.location.origin}/${challenge.slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(challenge.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getPublicUrl = (slug: string) => {
    if (typeof window === 'undefined') return `/${slug}`
    return `${window.location.origin}/${slug}`
  }

  if (challenges.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className={`group relative rounded-xl border bg-white p-4 transition-all hover:shadow-md ${
              challenge.is_archived ? 'border-gray-200 opacity-70' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left side - Challenge info */}
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0"
                  style={{ backgroundColor: challenge.brand_color || '#6b7280' }}
                >
                  {challenge.internal_name.charAt(0).toUpperCase()}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link 
                      href={`/admin/challenges/${challenge.id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {challenge.internal_name}
                    </Link>
                    {!challenge.is_archived ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                        Archived
                      </span>
                    )}
                  </div>
                  
                  {challenge.public_title && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">{challenge.public_title}</p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="text-gray-500">{challenge.client.name}</span>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <code className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        /{challenge.slug}
                      </code>
                      <button
                        onClick={() => copyUrl(challenge)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy URL"
                      >
                        {copiedId === challenge.id ? (
                          <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <CopyIcon className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <a
                        href={getPublicUrl(challenge.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Preview"
                      >
                        <ExternalLinkIcon className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/admin/challenges/${challenge.id}`}>
                  <button className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                    Manage
                  </button>
                </Link>
                <button
                  onClick={() => onEdit(challenge)}
                  disabled={actionId === challenge.id}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDuplicate(challenge)}
                  disabled={actionId === challenge.id}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionId === challenge.id ? <Spinner size="sm" /> : 'Duplicate'}
                </button>
                <button
                  onClick={() => handleArchive(challenge)}
                  disabled={actionId === challenge.id}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {challenge.is_archived ? 'Restore' : 'Archive'}
                </button>
                <button
                  onClick={() => handleDelete(challenge)}
                  disabled={actionId === challenge.id}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Permanently delete this challenge"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
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
