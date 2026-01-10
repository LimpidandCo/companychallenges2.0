import { notFound } from 'next/navigation'
import { getAssignmentWithContext } from '@/lib/actions/public'
import { AssignmentPageClient } from './page-client'

interface AssignmentPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ from?: string }>
}

export default async function AssignmentPage({ params, searchParams }: AssignmentPageProps) {
  const [{ slug }, { from: challengeSlug }] = await Promise.all([params, searchParams])
  const result = await getAssignmentWithContext(slug, challengeSlug)

  if (!result.success) {
    notFound()
  }

  const { assignment, requiresPassword, hasAccess, isReleased, releaseAt, navContext } = result.data

  return (
    <AssignmentPageClient
      assignment={assignment}
      requiresPassword={requiresPassword}
      initialHasAccess={hasAccess}
      isReleased={isReleased}
      releaseAt={releaseAt}
      navContext={navContext}
    />
  )
}

export async function generateMetadata({ params, searchParams }: AssignmentPageProps) {
  const [{ slug }, { from: challengeSlug }] = await Promise.all([params, searchParams])
  const result = await getAssignmentWithContext(slug, challengeSlug)

  if (!result.success) {
    return {
      title: 'Assignment Not Found'
    }
  }

  const { assignment, navContext } = result.data

  return {
    title: navContext
      ? `${assignment.public_title || assignment.internal_title} | ${navContext.challenge.publicTitle || navContext.challenge.internalName}`
      : assignment.public_title || assignment.internal_title,
    description: assignment.subtitle || undefined
  }
}
