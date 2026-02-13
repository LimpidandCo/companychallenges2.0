/**
 * Google Analytics 4 — client-side event helpers.
 *
 * These fire alongside the existing server-side Supabase analytics so we get
 * both detailed internal data AND GA4 demographics / traffic / geo data.
 *
 * Only sends events when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set and gtag is loaded.
 */

// Extend the Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

/** True when GA4 is configured and the script has loaded. */
function isGAReady(): boolean {
  return !!(GA_MEASUREMENT_ID && typeof window !== 'undefined' && window.gtag)
}

/** Low-level wrapper around gtag('event', ...). */
function sendEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (!isGAReady()) return
  window.gtag!('event', eventName, params)
}

// ─── Public event helpers ────────────────────────────────────────────────────

export function gaChallengeView(challengeId: string, challengeName: string) {
  sendEvent('challenge_view', {
    challenge_id: challengeId,
    challenge_name: challengeName,
  })
}

export function gaAssignmentView(
  challengeId: string,
  assignmentId: string,
  assignmentTitle: string
) {
  sendEvent('assignment_view', {
    challenge_id: challengeId,
    assignment_id: assignmentId,
    assignment_title: assignmentTitle,
  })
}

export function gaAssignmentComplete(
  challengeId: string,
  assignmentId: string,
  assignmentTitle: string
) {
  sendEvent('assignment_complete', {
    challenge_id: challengeId,
    assignment_id: assignmentId,
    assignment_title: assignmentTitle,
  })
}

export function gaMediaPlay(
  challengeId: string,
  assignmentId: string,
  mediaType?: string
) {
  sendEvent('media_play', {
    challenge_id: challengeId,
    assignment_id: assignmentId,
    media_type: mediaType || 'video',
  })
}

export function gaQuizResponse(
  challengeId: string,
  assignmentId: string,
  questionId: string
) {
  sendEvent('quiz_response', {
    challenge_id: challengeId,
    assignment_id: assignmentId,
    question_id: questionId,
  })
}
