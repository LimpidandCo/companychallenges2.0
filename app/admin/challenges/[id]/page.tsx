import { notFound } from 'next/navigation'
import { getChallenge } from '@/lib/actions/challenges'
import { getAssignmentUsages } from '@/lib/actions/assignment-usages'
import { getAssignments } from '@/lib/actions/assignments'
import { ChallengeDetailClient } from './page-client'

interface ChallengeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ChallengeDetailPage({ params }: ChallengeDetailPageProps) {
  const { id } = await params

  const [challengeResult, usagesResult, assignmentsResult] = await Promise.all([
    getChallenge(id),
    getAssignmentUsages(id),
    getAssignments(),
  ])

  if (!challengeResult.success || !challengeResult.data) {
    notFound()
  }

  const challenge = challengeResult.data
  const usages = usagesResult.success ? usagesResult.data : []
  const allAssignments = assignmentsResult.success ? assignmentsResult.data : []
  const error = usagesResult.success ? null : usagesResult.error

  return (
    <ChallengeDetailClient
      challenge={challenge}
      initialUsages={usages}
      allAssignments={allAssignments}
      initialError={error}
    />
  )
}
