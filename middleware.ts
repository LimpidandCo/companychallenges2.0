import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// TEMPORARY: Auth disabled for demo purposes
// TODO: Re-enable Clerk auth before production
export default function middleware(req: NextRequest) {
  return NextResponse.next()
}

// Original Clerk middleware (re-enable for production):
// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
// const isAdminRoute = createRouteMatcher(['/admin(.*)'])
// export default clerkMiddleware(async (auth, req) => {
//   if (isAdminRoute(req)) {
//     await auth.protect()
//   }
// })

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
