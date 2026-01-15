import { Suspense } from 'react'
import { ParticipantDashboard } from '@/components/participant/dashboard'
import { Spinner } from '@/components/ui'

export default function ParticipantPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    }>
      <ParticipantDashboard />
    </Suspense>
  )
}

export const metadata = {
  title: 'My Dashboard | Company Challenges',
  description: 'Track your learning progress and achievements',
}
