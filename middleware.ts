import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Check if demo mode is enabled (set DEMO_MODE=true in .env.local to bypass auth)
const isDemoMode = process.env.DEMO_MODE === 'true'

// Define protected routes
const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isParticipantRoute = createRouteMatcher(['/participant(.*)'])

// Demo mode middleware (bypasses auth)
function demoMiddleware(req: NextRequest) {
  return NextResponse.next()
}

// Production middleware with Clerk auth
const productionMiddleware = clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req) || isParticipantRoute(req)) {
    // Protect admin and participant routes - requires authentication
    await auth.protect()
  }
})

// Export the appropriate middleware based on mode
export default isDemoMode ? demoMiddleware : productionMiddleware

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
