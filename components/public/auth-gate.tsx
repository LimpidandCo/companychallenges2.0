'use client'

import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui'
import { identifyParticipant, hasParticipantCookie, enrollInChallenge, isEnrolledInChallenge } from '@/lib/actions/participants'

interface AuthGateProps {
  challengeId: string
  challengeMode: 'collective' | 'individual' | 'hybrid'
  challengeTitle: string
  brandColor?: string | null
  children: React.ReactNode
}

export function AuthGate({ 
  challengeId, 
  challengeMode, 
  challengeTitle,
  brandColor,
  children 
}: AuthGateProps) {
  const [status, setStatus] = useState<'loading' | 'needs-email' | 'enrolling' | 'ready'>('loading')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (challengeMode === 'collective') {
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

    setStatus('ready')
    setIsSubmitting(false)
  }

  if (status === 'loading' || status === 'enrolling') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'needs-email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div 
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: brandColor || '#3b82f6' }}
          >
            <MailIcon className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Enter your email
          </h1>
          
          <p className="text-gray-600 mb-6">
            Enter your email to track your progress in <span className="font-medium">{challengeTitle}</span>.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent mb-4"
              style={{ focusRing: brandColor || '#3b82f6' } as any}
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
                'Continue'
              )}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-500">
            Your progress will be saved automatically.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  )
}
