import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'

// Import the actual start page component
import AssignmentsGridPage from '@/app/(public)/c/[slug]/start/page'

interface LegacyStartPageProps {
  params: Promise<{ legacySlug: string }>
}

/**
 * Legacy URL Support for /start route
 * 
 * Serves challenge assignment grids at /MMXdXcr/start (no /c/ prefix)
 */
export default async function LegacyStartPage({ params }: LegacyStartPageProps) {
  const { legacySlug } = await params

  // Skip reserved paths
  const reservedPaths = [
    'admin', 'participant', 'sign-in', 'sign-up', 'api', 
    'c', 'a', '_next', 'favicon.ico', 'favicon.svg'
  ]
  
  if (reservedPaths.includes(legacySlug.toLowerCase())) {
    notFound()
  }

  const supabase = createAdminClient()

  // Check if this slug exists as a challenge
  const { data: challenge } = await supabase
    .from('challenges')
    .select('slug')
    .eq('slug', legacySlug)
    .single()

  if (challenge) {
    // Render the assignments grid page directly
    return <AssignmentsGridPage params={Promise.resolve({ slug: legacySlug })} />
  }

  // No matching challenge found
  notFound()
}

export async function generateMetadata({ params }: LegacyStartPageProps) {
  const { legacySlug } = await params
  
  const supabase = createAdminClient()

  const { data: challenge } = await supabase
    .from('challenges')
    .select('public_title, internal_name')
    .eq('slug', legacySlug)
    .single()

  if (challenge) {
    return {
      title: `Assignments | ${challenge.public_title || challenge.internal_name || 'Challenge'}`,
    }
  }

  return {
    title: 'Not Found',
  }
}
