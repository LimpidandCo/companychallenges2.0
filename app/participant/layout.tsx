import { ParticipantNav } from '@/components/participant/nav'

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth is handled by the client-side mock auth provider
  // In production, this would use Clerk's auth()

  return (
    <div className="min-h-screen bg-gray-50">
      <ParticipantNav />
      <main className="pb-20">
        {children}
      </main>
    </div>
  )
}
