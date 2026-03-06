'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui'
import { identifyParticipant, hasParticipantCookie, enrollInChallenge, isEnrolledInChallenge, logoutParticipant, getParticipantFromCookie } from '@/lib/actions/participants'

interface AuthGateProps {
  challengeId: string
  challengeSlug: string
  challengeMode: 'collective' | 'individual' | 'hybrid'
  challengeTitle: string
  brandColor?: string | null
  children: React.ReactNode
  /** When true, shows the email form inline instead of blocking content */
  inline?: boolean
}

export function AuthGate({ 
  challengeId,
  challengeSlug,
  challengeMode, 
  challengeTitle,
  brandColor,
  children,
  inline = false,
}: AuthGateProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'needs-username' | 'enrolling' | 'ready'>('loading')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isIndividual = challengeMode === 'individual' || challengeMode === 'hybrid'

  if (!isIndividual) {
    return <>{children}</>
  }

  useEffect(() => {
    async function check() {
      const hasCookie = await hasParticipantCookie()
      if (!hasCookie) {
        setStatus('needs-username')
        return
      }

      const enrollResult = await isEnrolledInChallenge(challengeId)
      if (enrollResult.success && enrollResult.data) {
        setStatus('ready')
      } else {
        setStatus('enrolling')
        const result = await enrollInChallenge(challengeId)
        if (result.success) {
          setStatus('ready')
        } else {
          setError(result.error)
          setStatus('needs-username')
        }
      }
    }

    check()
  }, [challengeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await identifyParticipant(username)
    if (!result.success) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    const enrollResult = await enrollInChallenge(challengeId)
    if (!enrollResult.success) {
      setError(enrollResult.error)
      setIsSubmitting(false)
      return
    }

    router.push(`/${challengeSlug}/start`)
  }

  if (status === 'loading' || status === 'enrolling') {
    if (inline) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )
    }
    return <>{children}</>
  }

  if (status === 'ready') {
    return <>{children}</>
  }

  if (inline) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
        <UsernameForm
          username={username}
          setUsername={setUsername}
          error={error}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          brandColor={brandColor}
          challengeTitle={challengeTitle}
        />
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Standalone username identification form for use on landing pages.
 */
export function UsernameIdentificationForm({
  challengeId,
  challengeSlug,
  challengeTitle,
  brandColor,
}: {
  challengeId: string
  challengeSlug: string
  challengeTitle: string
  brandColor?: string | null
}) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'needs-username' | 'enrolled'>('loading')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [participantName, setParticipantName] = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      const hasCookie = await hasParticipantCookie()
      if (!hasCookie) {
        setStatus('needs-username')
        return
      }

      const enrollResult = await isEnrolledInChallenge(challengeId)
      if (enrollResult.success && enrollResult.data) {
        const participant = await getParticipantFromCookie()
        if (participant) setParticipantName(participant.username || participant.email || null)
        setStatus('enrolled')
      } else {
        setStatus('needs-username')
      }
    }
    check()
  }, [challengeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await identifyParticipant(username)
    if (!result.success) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    const enrollResult = await enrollInChallenge(challengeId)
    if (!enrollResult.success) {
      setError(enrollResult.error)
      setIsSubmitting(false)
      return
    }

    router.push(`/${challengeSlug}/start`)
  }

  const handleLogout = async () => {
    await logoutParticipant()
    setParticipantName(null)
    setStatus('needs-username')
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    )
  }

  if (status === 'enrolled') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserCircleIcon className="h-5 w-5" />
          <span className="font-medium">{participantName}</span>
          <span className="text-gray-300">|</span>
          <button 
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 underline underline-offset-2"
          >
            ×
          </button>
        </div>
        <a
          href={`/${challengeSlug}/start`}
          className="inline-flex items-center gap-3 rounded-xl px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ 
            backgroundColor: brandColor || '#3b82f6',
            boxShadow: `0 4px 12px -4px ${brandColor || '#3b82f6'}50`
          }}
        >
          →
          <ArrowRightIcon className="h-5 w-5" />
        </a>
      </div>
    )
  }

  return (
    <UsernameForm
      username={username}
      setUsername={setUsername}
      error={error}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      brandColor={brandColor}
      challengeTitle={challengeTitle}
    />
  )
}

/** @deprecated Use UsernameIdentificationForm instead */
export const EmailIdentificationForm = UsernameIdentificationForm

function UsernameForm({
  username,
  setUsername,
  error,
  isSubmitting,
  onSubmit,
  brandColor,
  challengeTitle,
}: {
  username: string
  setUsername: (v: string) => void
  error: string | null
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
  brandColor?: string | null
  challengeTitle: string
}) {
  return (
    <>
      <div 
        className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
        style={{ backgroundColor: brandColor || '#3b82f6' }}
      >
        <UserCircleIcon className="w-8 h-8 text-white" />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <input
          type="text"
          required
          minLength={2}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent mb-4"
          disabled={isSubmitting}
          autoFocus
        />

        <button
          type="submit"
          disabled={isSubmitting || username.trim().length < 2}
          className="w-full py-3 px-6 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: brandColor || '#3b82f6' }}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              ...
            </span>
          ) : (
            '→'
          )}
        </button>
      </form>
    </>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}

function UserCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}
