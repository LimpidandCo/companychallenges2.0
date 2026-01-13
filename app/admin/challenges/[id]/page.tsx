import { notFound } from 'next/navigation'
import { getChallenge } from '@/lib/actions/challenges'
import { getAssignmentUsages } from '@/lib/actions/assignment-usages'
import { getAssignments } from '@/lib/actions/assignments'
import { getSprintsForChallenge } from '@/lib/actions/sprints'
import { getAnnouncementsForChallenge } from '@/lib/actions/announcements'
import { getMilestonesForChallenge } from '@/lib/actions/milestones'
import { ChallengeDetailClient } from './page-client'

interface ChallengeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ChallengeDetailPage({ params }: ChallengeDetailPageProps) {
  const { id } = await params

  const [challengeResult, usagesResult, assignmentsResult, sprintsResult, announcementsResult, milestonesResult] = await Promise.all([
    getChallenge(id),
    getAssignmentUsages(id),
    getAssignments(),
    getSprintsForChallenge(id),
    getAnnouncementsForChallenge(id),
    getMilestonesForChallenge(id),
  ])

  if (!challengeResult.success || !challengeResult.data) {
    notFound()
  }

  const challenge = challengeResult.data
  const usages = usagesResult.success ? usagesResult.data : []
  const allAssignments = assignmentsResult.success ? assignmentsResult.data : []
  const sprints = sprintsResult.success ? sprintsResult.data : []
  const announcements = announcementsResult.success ? announcementsResult.data : []
  const milestones = milestonesResult.success ? milestonesResult.data : []
  const error = usagesResult.success ? null : usagesResult.error

  return (
    <ChallengeDetailClient
      challenge={challenge}
      initialUsages={usages}
      allAssignments={allAssignments}
      initialSprints={sprints}
      initialAnnouncements={announcements}
      initialMilestones={milestones}
      initialError={error}
    />
  )
}
