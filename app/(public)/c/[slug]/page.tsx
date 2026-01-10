import { notFound } from 'next/navigation'
import { getPublicChallenge, getPublicAssignmentUsages, getPendingAssignmentUsages } from '@/lib/actions/public'
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

  const [usagesResult, pendingInfo] = await Promise.all([
    getPublicAssignmentUsages(challenge.id),
    getPendingAssignmentUsages(challenge.id)
  ])

  const usages = usagesResult.success ? usagesResult.data : []

  return (
    <ChallengePageClient
      challenge={challenge}
      client={client}
      usages={usages}
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
