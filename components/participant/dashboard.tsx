'use client'

import { useUser } from '@/components/providers/clerk-provider'

export function ParticipantDashboard() {
  const { user } = useUser()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Welcome, {user?.firstName || 'Participant'}!
      </h1>
      <p className="text-gray-600">
        Your participant dashboard is coming soon.
      </p>
    </div>
  )
}
