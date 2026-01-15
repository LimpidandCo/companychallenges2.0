import { notFound } from 'next/navigation'
import { 
  getPublicChallenge, 
  getPublicAssignmentUsages, 
  getPendingAssignmentUsages,
  getPublicSprints,
  getPublicAnnouncements
} from '@/lib/actions/public'
import { ChallengePageClient } from './page-client'

interface ChallengePageProps {
  params: Promise<{ slug: string }>
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { slug } = await params
  const result = await getPublicChallenge(slug)

  if (!result.success) {
    notFound()
  }

  const { challenge, client } = result.data

  const [usagesResult, pendingInfo, sprintsResult, announcementsResult] = await Promise.all([
    getPublicAssignmentUsages(challenge.id),
    getPendingAssignmentUsages(challenge.id),
    getPublicSprints(challenge.id),
    getPublicAnnouncements(challenge.id)
  ])

  const usages = usagesResult.success ? usagesResult.data : []
  const sprints = sprintsResult.success ? sprintsResult.data : []
  const announcements = announcementsResult.success ? announcementsResult.data : []

  return (
    <ChallengePageClient
      challenge={challenge}
      client={client}
      usages={usages}
      sprints={sprints}
      announcements={announcements}
      pendingCount={pendingInfo.count}
      nextRelease={pendingInfo.nextRelease}
    />
  )
}

export async function generateMetadata({ params }: ChallengePageProps) {
  const { slug } = await params
  const result = await getPublicChallenge(slug)

  if (!result.success) {
    return {
      title: 'Challenge Not Found'
    }
  }

  const { challenge, client } = result.data

  return {
    title: challenge.show_public_title && challenge.public_title
      ? `${challenge.public_title} | ${client.name}`
      : client.name,
    description: challenge.description
      ? challenge.description.replace(/<[^>]*>/g, '').slice(0, 160)
      : undefined
  }
}
