import { getChallenges, getChallengeFolders } from '@/lib/actions/challenges'
import { getClients } from '@/lib/actions/clients'
import { ChallengesPageClient } from './page-client'

export default async function ChallengesPage() {
  const [challengesResult, clientsResult, foldersResult] = await Promise.all([
    getChallenges({ includeArchived: true }),
    getClients(),
    getChallengeFolders(),
  ])

  const challenges = challengesResult.success ? challengesResult.data : []
  const clients = clientsResult.success ? clientsResult.data : []
  const folders = foldersResult.success ? foldersResult.data ?? [] : []
  const error = challengesResult.success ? null : challengesResult.error

  return (
    <ChallengesPageClient
      initialChallenges={challenges}
      clients={clients}
      folders={folders}
      initialError={error}
    />
  )
}
