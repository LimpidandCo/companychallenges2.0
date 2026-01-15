'use client'

import { useUser, SignInButton } from '@/components/providers/clerk-provider'
import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui'
import { enrollInChallenge, isEnrolledInChallenge } from '@/lib/actions/participants'

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
  const { isLoaded, isSignedIn, user } = useUser()
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If collective mode, no auth needed
  if (challengeMode === 'collective') {
    return <>{children}</>
  }

  // Check enrollment status for signed-in users
  useEffect(() => {
    async function checkEnrollment() {
      if (!isSignedIn) return
      
      const result = await isEnrolledInChallenge(challengeId)
      if (result.success) {
        setIsEnrolled(result.data)
      }
    }
    
    if (isLoaded && isSignedIn) {
      checkEnrollment()
    }
  }, [isLoaded, isSignedIn, challengeId])

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Not signed in - show sign in prompt
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div 
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: brandColor || '#3b82f6' }}
          >
            <LockIcon className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sign In Required
          </h1>
          
          <p className="text-gray-600 mb-6">
            <span className="font-medium">{challengeTitle}</span> requires you to sign in 
            to track your progress and access personalized content.
          </p>

          <SignInButton mode="modal">
            <button
              className="w-full py-3 px-6 rounded-xl font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: brandColor || '#3b82f6' }}
            >
              Sign In to Continue
            </button>
          </SignInButton>

          <p className="mt-4 text-sm text-gray-500">
            Don't have an account? You'll be able to create one when you sign in.
          </p>
        </div>
      </div>
    )
  }

  // Signed in but checking enrollment
  if (isEnrolled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Checking enrollment...</p>
        </div>
      </div>
    )
  }

  // Signed in but not enrolled - show enrollment prompt
  if (!isEnrolled) {
    const handleEnroll = async () => {
      setIsEnrolling(true)
      setError(null)
      
      const result = await enrollInChallenge(challengeId)
      
      if (result.success) {
        setIsEnrolled(true)
      } else {
        setError(result.error)
      }
      
      setIsEnrolling(false)
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div 
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: brandColor || '#3b82f6' }}
          >
            <RocketIcon className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {user?.firstName || 'there'}!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Ready to start <span className="font-medium">{challengeTitle}</span>? 
            Enroll now to track your progress and earn achievements.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleEnroll}
            disabled={isEnrolling}
            className="w-full py-3 px-6 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: brandColor || '#3b82f6' }}
          >
            {isEnrolling ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                Enrolling...
              </span>
            ) : (
              'Enroll & Start Learning'
            )}
          </button>

          <p className="mt-4 text-sm text-gray-500">
            Your progress will be saved automatically.
          </p>
        </div>
      </div>
    )
  }

  // Enrolled - show the content
  return <>{children}</>
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  )
}

