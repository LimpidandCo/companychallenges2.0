'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui'
import { identifyParticipant, hasParticipantCookie, enrollInChallenge, isEnrolledInChallenge } from '@/lib/actions/participants'

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
  const [status, setStatus] = useState<'loading' | 'needs-email' | 'enrolling' | 'ready'>('loading')
  const [email, setEmail] = useState('')
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
        setStatus('needs-email')
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
          setStatus('needs-email')
        }
      }
    }

    check()
  }, [challengeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await identifyParticipant(email)
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
        <EmailForm
          email={email}
          setEmail={setEmail}
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
 * Standalone email identification form for use on landing pages.
 */
export function EmailIdentificationForm({
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
  const [status, setStatus] = useState<'loading' | 'needs-email' | 'enrolled'>('loading')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function check() {
      const hasCookie = await hasParticipantCookie()
      if (!hasCookie) {
        setStatus('needs-email')
        return
      }

      const enrollResult = await isEnrolledInChallenge(challengeId)
      if (enrollResult.success && enrollResult.data) {
        setStatus('enrolled')
      } else {
        setStatus('needs-email')
      }
    }
    check()
  }, [challengeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await identifyParticipant(email)
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

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    )
  }

  if (status === 'enrolled') {
    return (
      <a
        href={`/${challengeSlug}/start`}
        className="inline-flex items-center gap-3 rounded-xl px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        style={{ 
          backgroundColor: brandColor || '#3b82f6',
          boxShadow: `0 4px 12px -4px ${brandColor || '#3b82f6'}50`
        }}
      >
        Continue Your Progress
        <ArrowRightIcon className="h-5 w-5" />
      </a>
    )
  }

  return (
    <EmailForm
      email={email}
      setEmail={setEmail}
      error={error}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      brandColor={brandColor}
      challengeTitle={challengeTitle}
    />
  )
}

function EmailForm({
  email,
  setEmail,
  error,
  isSubmitting,
  onSubmit,
  brandColor,
  challengeTitle,
}: {
  email: string
  setEmail: (v: string) => void
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
        <MailIcon className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Get Started
      </h2>
      
      <p className="text-gray-600 mb-6">
        Enter your email to begin <span className="font-medium">{challengeTitle}</span> and track your progress.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent mb-4"
          disabled={isSubmitting}
          autoFocus
        />

        <button
          type="submit"
          disabled={isSubmitting || !email.trim()}
          className="w-full py-3 px-6 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: brandColor || '#3b82f6' }}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              Starting...
            </span>
          ) : (
            'Start Challenge'
          )}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500">
        Your progress will be saved automatically.
      </p>
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

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  )
}
