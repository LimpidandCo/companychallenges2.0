import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// For now, we're using mock auth so no middleware protection needed
// When you want to enable real Clerk auth, set NEXT_PUBLIC_USE_CLERK=true
// and uncomment the Clerk middleware below

export default function middleware(req: NextRequest) {
  // Just pass through - auth is handled by client-side mock provider
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

/* 
// REAL CLERK MIDDLEWARE - Uncomment when ready to use Clerk
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isParticipantRoute = createRouteMatcher(['/participant(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req) || isParticipantRoute(req)) {
    await auth.protect()
  }
})
*/
