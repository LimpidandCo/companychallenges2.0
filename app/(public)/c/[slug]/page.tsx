import { notFound } from 'next/navigation'
import { 
  getPublicChallenge, 
  getPublicAssignmentUsages, 
  getPendingAssignmentUsages,
  getPublicAnnouncements,
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

  // Check if there are any assignments + fetch announcements
  const [usagesResult, pendingInfo, announcementsResult] = await Promise.all([
    getPublicAssignmentUsages(challenge.id),
    getPendingAssignmentUsages(challenge.id),
    getPublicAnnouncements(challenge.id),
  ])

  const usages = usagesResult.success ? usagesResult.data : []
  const hasAssignments = usages.length > 0 || pendingInfo.count > 0
  const announcements = announcementsResult.success ? announcementsResult.data : []

  return (
    <ChallengePageClient
      challenge={challenge}
      client={client}
      hasAssignments={hasAssignments}
      announcements={announcements}
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
