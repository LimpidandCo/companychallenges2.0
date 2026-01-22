'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/components/providers/clerk-provider'
import { PasswordGate } from '@/components/public/password-gate'
import { SupportModal } from '@/components/public/support-modal'
import { InstructionsRenderer, AssignmentContentRenderer } from '@/components/public/content-renderer'
import { trackAssignmentView, trackAssignmentComplete, trackMediaPlay } from '@/lib/actions/analytics'
import { startAssignment, completeAssignment } from '@/lib/actions/participants'
import type { Assignment, MicroQuiz } from '@/lib/types/database'
import type { AssignmentNavContext } from '@/lib/actions/public'

interface AssignmentPageClientProps {
  assignment: Assignment
  requiresPassword: boolean
  initialHasAccess: boolean
  isReleased: boolean
  releaseAt?: string
  navContext?: AssignmentNavContext
  quizzes?: MicroQuiz[]
}

// LocalStorage key for tracking completions
const getCompletionStorageKey = (challengeId: string) => `cc_completed_${challengeId}`

/**
 * Assignment Page - Legacy Style Layout
 * 
 * Full-screen framed card with brand color border:
 * - Header inside frame (logo, challenge name, Complete button)
 * - Flexible content area with two columns
 * - Supports rich content: images, videos, embeds
 * - Smooth transitions and completion confirmation
 */
export function AssignmentPageClient({
  assignment,
  requiresPassword,
  initialHasAccess,
  isReleased,
  releaseAt,
  navContext,
  quizzes = []
}: AssignmentPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSignedIn } = useUser()
  const [hasAccess, setHasAccess] = useState(initialHasAccess)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const hasTrackedView = useRef(false)
  const hasTrackedMediaPlay = useRef(false)
  const hasStartedProgress = useRef(false)

  const title = assignment.public_title || assignment.internal_title
  // Get challenge slug from navContext or fallback to URL search param
  const challengeSlug = navContext?.challenge.slug || searchParams.get('from')
  const brandColor = navContext?.challenge.brandColor || '#3b82f6'
  const challengeTitle = navContext?.challenge.publicTitle || navContext?.challenge.internalName || ''
  const supportInfo = navContext?.challenge.supportInfo
  const contactInfo = navContext?.challenge.contactInfo
  const passwordInstructions = navContext?.challenge.passwordInstructions
  const clientLogo = navContext?.client?.logoUrl
  const clientName = navContext?.client?.name
  
  // Build back URL - only link to challenge if we have context
  const backUrl = challengeSlug ? `/c/${challengeSlug}/start` : null

  // Check localStorage for existing completion on mount
  useEffect(() => {
    if (navContext?.challenge.id) {
      try {
        const key = getCompletionStorageKey(navContext.challenge.id)
        const stored = localStorage.getItem(key)
        if (stored) {
          const completedIds: string[] = JSON.parse(stored)
          if (completedIds.includes(assignment.id)) {
            setIsCompleted(true)
          }
        }
      } catch (e) {
        // localStorage might not be available
      }
    }
  }, [navContext?.challenge.id, assignment.id])

  // Track assignment view on mount
  useEffect(() => {
    if (hasTrackedView.current) return
    if (!navContext || !isReleased || (requiresPassword && !hasAccess)) return

    hasTrackedView.current = true
    trackAssignmentView(
      navContext.challenge.clientId,
      navContext.challenge.id,
      assignment.id,
      navContext.sprintId
    )
  }, [navContext, isReleased, requiresPassword, hasAccess, assignment.id])

  // Start progress tracking for signed-in users
  useEffect(() => {
    if (hasStartedProgress.current) return
    if (!isSignedIn || !navContext?.assignmentUsageId || !isReleased || (requiresPassword && !hasAccess)) return

    hasStartedProgress.current = true
    startAssignment(navContext.assignmentUsageId)
  }, [isSignedIn, navContext?.assignmentUsageId, isReleased, requiresPassword, hasAccess])

  // Save completion to localStorage
  const saveCompletionToStorage = useCallback((challengeId: string, assignmentId: string) => {
    try {
      const key = getCompletionStorageKey(challengeId)
      const stored = localStorage.getItem(key)
      const completedIds: string[] = stored ? JSON.parse(stored) : []
      if (!completedIds.includes(assignmentId)) {
        completedIds.push(assignmentId)
        localStorage.setItem(key, JSON.stringify(completedIds))
      }
    } catch (e) {
      // localStorage might not be available
    }
  }, [])

  // Handle complete with confirmation
  const handleCompleteClick = () => {
    if (isCompleted) {
      // Already completed, just navigate back
      navigateBack()
    } else {
      // Show confirmation modal
      setShowConfirmModal(true)
    }
  }

  const confirmComplete = async () => {
    if (!navContext) return
    
    setIsMarkingComplete(true)
    setShowConfirmModal(false)
    
    // Track analytics
    trackAssignmentComplete(
      navContext.challenge.clientId,
      navContext.challenge.id,
      assignment.id,
      navContext.sprintId
    )
    
    // Save to localStorage (for collective mode / anonymous users)
    saveCompletionToStorage(navContext.challenge.id, assignment.id)
    
    // If signed in, also save to database
    if (isSignedIn && navContext.assignmentUsageId) {
      await completeAssignment(navContext.assignmentUsageId)
    }
    
    setIsCompleted(true)
    setIsMarkingComplete(false)
    
    // Smooth exit transition then navigate
    setTimeout(() => {
      navigateBack()
    }, 800)
  }

  const navigateBack = () => {
    setIsExiting(true)
    setTimeout(() => {
      if (backUrl) {
        router.push(backUrl)
      } else {
        router.back()
      }
    }, 300)
  }

  const handleMediaPlay = () => {
    if (hasTrackedMediaPlay.current || !navContext) return
    hasTrackedMediaPlay.current = true
    trackMediaPlay(
      navContext.challenge.clientId,
      navContext.challenge.id,
      assignment.id,
      { mediaType: assignment.media_url?.includes('youtube') ? 'youtube' : assignment.media_url?.includes('vimeo') ? 'vimeo' : 'video' }
    )
  }

  // Password gate
  if (requiresPassword && !hasAccess) {
    return (
      <PasswordGate
        assignmentId={assignment.id}
        assignmentTitle={title}
        onSuccess={() => {
          setHasAccess(true)
          router.refresh()
        }}
        analyticsContext={navContext ? {
          clientId: navContext.challenge.clientId,
          challengeId: navContext.challenge.id
        } : undefined}
      />
    )
  }

  // Scheduled release
  if (!isReleased && releaseAt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: brandColor }}>
        <div className="w-full max-w-lg bg-white rounded-lg shadow-xl p-8 text-center">
          <div 
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${brandColor}20` }}
          >
            <CalendarIcon className="h-8 w-8" style={{ color: brandColor }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 mb-4">Available on</p>
          <p className="text-lg font-semibold mb-6" style={{ color: brandColor }}>
            {formatDate(releaseAt)}
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all"
            style={{ backgroundColor: brandColor }}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const hasInstructions = assignment.instructions_html || assignment.instructions
  const hasContent = assignment.content_html || assignment.content
  const hasMedia = assignment.media_url
  const hasVisual = assignment.visual_url

  return (
    <>
      {/* Page wrapper with transitions */}
      <div 
        className={`min-h-screen flex flex-col transition-all duration-300 ease-out ${
          isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-fade-in'
        }`}
        style={{ backgroundColor: brandColor }}
      >
        {/* Main Frame - Takes up full viewport with minimal margin */}
        <div className="flex-1 flex flex-col m-3 sm:m-4 lg:m-5">
          <div 
            className="flex-1 flex flex-col bg-white rounded-lg shadow-2xl overflow-hidden animate-slide-up"
            style={{ border: `3px solid ${brandColor}` }}
          >
          {/* Header - Legacy Style with Logo + Title + Complete Button */}
          <header className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* Client Logo or Back Button */}
              {clientLogo ? (
                <div className="flex items-center gap-3">
                  {backUrl ? (
                    <Link href={backUrl} className="flex-shrink-0">
                      <img 
                        src={clientLogo} 
                        alt={clientName || 'Logo'} 
                        className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded-lg"
                      />
                    </Link>
                  ) : (
                    <img 
                      src={clientLogo} 
                      alt={clientName || 'Logo'} 
                      className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded-lg"
                    />
                  )}
                </div>
              ) : (
                /* Fallback: Icon placeholder */
                backUrl ? (
                  <Link
                    href={backUrl}
                    className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center border-2"
                    style={{ borderColor: brandColor }}
                  >
                    <BrandIcon className="h-6 w-6" style={{ color: brandColor }} />
                  </Link>
                ) : (
                  <div
                    className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center border-2"
                    style={{ borderColor: brandColor }}
                  >
                    <BrandIcon className="h-6 w-6" style={{ color: brandColor }} />
                  </div>
                )
              )}
              
              {/* Challenge Title - Prominent */}
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {challengeTitle}
              </h2>
            </div>

            {/* Right side: Support + Complete */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Support Modal */}
              {(supportInfo || contactInfo || passwordInstructions) && (
                <SupportModal 
                  supportInfo={supportInfo}
                  contactInfo={contactInfo}
                  passwordInstructions={passwordInstructions}
                  brandColor={brandColor}
                  variant="icon"
                />
              )}
              
              {/* Complete Button - Always visible, prominent */}
              {navContext && (
                isCompleted ? (
                  <button
                    onClick={navigateBack}
                    className="inline-flex items-center gap-2 rounded-lg px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
                    style={{ backgroundColor: '#16a34a' }}
                  >
                    <CheckIcon className="h-4 w-4" />
                    <span>Done</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCompleteClick}
                    disabled={isMarkingComplete}
                    className="inline-flex items-center gap-2 rounded-lg px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-bold border-2 bg-white transition-all hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-70"
                    style={{ borderColor: brandColor, color: brandColor }}
                  >
                    {isMarkingComplete && <SpinnerIcon className="h-4 w-4 animate-spin" />}
                    Complete
                  </button>
                )
              )}
            </div>
          </header>

          {/* Content Area - Scrollable, flexible */}
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                
                {/* Left Column: Title + Instructions */}
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                      {title}
                    </h1>
                    {assignment.subtitle && (
                      <p className="mt-2 text-lg text-gray-600">
                        {assignment.subtitle}
                      </p>
                    )}
                  </div>
                  
                  {hasInstructions && (
                    <div className="prose prose-gray prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                      <InstructionsRenderer assignment={assignment} />
                    </div>
                  )}

                  {/* If no instructions, no visual, no media - show content in single column */}
                  {!hasInstructions && !hasVisual && !hasMedia && hasContent && (
                    <div className="prose prose-gray prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-img:rounded-xl prose-img:shadow-md">
                      <AssignmentContentRenderer assignment={assignment} />
                    </div>
                  )}
                </div>

                {/* Right Column: Visual/Media + Content */}
                <div className="space-y-6">
                  {/* Visual Image - Full width in column */}
                  {hasVisual && !hasMedia && (
                    <div className="rounded-xl overflow-hidden shadow-lg">
                      <img
                        src={assignment.visual_url!}
                        alt={title}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}

                  {/* Video/Media - Responsive aspect ratio */}
                  {hasMedia && (
                    <div className="rounded-xl overflow-hidden shadow-lg bg-black">
                      <div className="aspect-video">
                        {isYouTubeUrl(assignment.media_url!) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(assignment.media_url!)}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            onLoad={handleMediaPlay}
                          />
                        ) : isVimeoUrl(assignment.media_url!) ? (
                          <iframe
                            src={getVimeoEmbedUrl(assignment.media_url!)}
                            className="h-full w-full"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            onLoad={handleMediaPlay}
                          />
                        ) : isLoomUrl(assignment.media_url!) ? (
                          <iframe
                            src={getLoomEmbedUrl(assignment.media_url!)}
                            className="h-full w-full"
                            allowFullScreen
                            onLoad={handleMediaPlay}
                          />
                        ) : isMiroUrl(assignment.media_url!) ? (
                          <iframe
                            src={getMiroEmbedUrl(assignment.media_url!)}
                            className="h-full w-full"
                            allowFullScreen
                            onLoad={handleMediaPlay}
                          />
                        ) : (
                          <video
                            src={assignment.media_url!}
                            controls
                            className="h-full w-full"
                            onPlay={handleMediaPlay}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content Text */}
                  {hasContent && (hasVisual || hasMedia || hasInstructions) && (
                    <div className="prose prose-gray prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md">
                      <AssignmentContentRenderer assignment={assignment} />
                    </div>
                  )}

                  {/* Empty state for right column */}
                  {!hasContent && !hasVisual && !hasMedia && hasInstructions && (
                    <div className="flex items-center justify-center min-h-[250px] rounded-xl bg-gray-50 border-2 border-dashed border-gray-200">
                      <div className="text-center p-6">
                        <div 
                          className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${brandColor}15` }}
                        >
                          <TaskIcon className="h-6 w-6" style={{ color: brandColor }} />
                        </div>
                        <p className="text-gray-500">
                          Complete the task described<br />in the instructions
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Footer - Legacy Style */}
          <footer className="flex-shrink-0 px-4 sm:px-6 py-3 border-t border-gray-100 bg-white">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <BrandIconSmall className="h-4 w-4" />
              <span>Company Challenges 2026</span>
            </div>
          </footer>
        </div>
      </div>
    </div>

    {/* Completion Confirmation Modal */}
    {showConfirmModal && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in"
          style={{ border: `3px solid ${brandColor}` }}
        >
          {/* Celebration Icon */}
          <div className="flex justify-center mb-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${brandColor}15` }}
            >
              <span className="text-3xl">🎉</span>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
            Mark as Complete?
          </h3>
          <p className="text-center text-gray-600 mb-6">
            Great job! Ready to mark &ldquo;{title}&rdquo; as done?
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
            >
              Not yet
            </button>
            <button
              onClick={confirmComplete}
              disabled={isMarkingComplete}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
              style={{ backgroundColor: brandColor }}
            >
              {isMarkingComplete ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Yes, I'm done!"
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Completion Success Overlay */}
    {isCompleted && isMarkingComplete === false && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in pointer-events-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-bounce-in text-center">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#dcfce7' }}>
            <CheckIcon className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Completed!</h3>
          <p className="text-gray-500 mt-1">Returning to assignments...</p>
        </div>
      </div>
    )}
    </>
  )
}

// =============================================================================
// Embed URL Helpers
// =============================================================================

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function isVimeoUrl(url: string): boolean {
  return url.includes('vimeo.com')
}

function isLoomUrl(url: string): boolean {
  return url.includes('loom.com')
}

function isMiroUrl(url: string): boolean {
  return url.includes('miro.com')
}

function getYouTubeEmbedUrl(url: string): string {
  let videoId = ''
  if (url.includes('youtube.com/watch')) {
    videoId = new URL(url).searchParams.get('v') || ''
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || ''
  }
  return `https://www.youtube.com/embed/${videoId}`
}

function getVimeoEmbedUrl(url: string): string {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return `https://player.vimeo.com/video/${match?.[1] || ''}`
}

function getLoomEmbedUrl(url: string): string {
  // Convert loom.com/share/xxx to loom.com/embed/xxx
  return url.replace('/share/', '/embed/')
}

function getMiroEmbedUrl(url: string): string {
  // Miro board URLs can be embedded directly with some modifications
  if (url.includes('/board/')) {
    return url.replace('/board/', '/live-embed/')
  }
  return url
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayName = days[date.getDay()]
  const monthName = months[date.getMonth()]
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${dayName}, ${monthName} ${day}, ${hour12}:${minutes} ${ampm}`
}

// =============================================================================
// Icons
// =============================================================================

function ChevronLeftIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
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

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

function CalendarIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

function TaskIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function BrandIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  )
}

function BrandIconSmall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
    </svg>
  )
}
