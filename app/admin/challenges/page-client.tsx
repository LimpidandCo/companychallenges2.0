'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select } from '@/components/ui'
import { ChallengeForm, ChallengeList } from '@/components/admin'
import type { Client, ChallengeWithClient } from '@/lib/types/database'

interface ChallengesPageClientProps {
  initialChallenges: ChallengeWithClient[]
  clients: Client[]
  folders: string[]
  initialError: string | null
}

type StatusFilter = 'active' | 'archived' | 'all'

export function ChallengesPageClient({
  initialChallenges,
  clients,
  folders,
  initialError,
}: ChallengesPageClientProps) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<ChallengeWithClient | null>(null)

  // Filters
  const [clientFilter, setClientFilter] = useState('')
  const [folderFilter, setFolderFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')

  const handleAddClick = () => {
    setEditingChallenge(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (challenge: ChallengeWithClient) => {
    setEditingChallenge(challenge)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingChallenge(null)
  }

  const handleSuccess = () => {
    router.refresh()
  }

  const handleRefresh = () => {
    router.refresh()
  }

  // Filter challenges
  const filteredChallenges = useMemo(() => {
    return initialChallenges.filter((challenge) => {
      // Status filter
      if (statusFilter === 'active' && challenge.is_archived) return false
      if (statusFilter === 'archived' && !challenge.is_archived) return false

      // Client filter
      if (clientFilter && challenge.client_id !== clientFilter) return false

      // Folder filter
      if (folderFilter && challenge.folder !== folderFilter) return false

      return true
    })
  }, [initialChallenges, statusFilter, clientFilter, folderFilter])

  const clientOptions = [
    { value: '', label: 'All Clients' },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ]

  const folderOptions = [
    { value: '', label: 'All Folders' },
    ...folders.map((f) => ({ value: f, label: f })),
  ]

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
    { value: 'all', label: 'All' },
  ]

  const noClients = clients.length === 0

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Challenges</h1>
          <p className="mt-1 text-[var(--color-fg-muted)]">
            Manage learning trajectories and their content.
          </p>
        </div>
        <Button onClick={handleAddClick} disabled={noClients}>
          <PlusIcon className="h-4 w-4" />
          Create Challenge
        </Button>
      </div>

      {initialError && (
        <div className="mb-6 rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-4 text-sm text-[var(--color-error)]">
          {initialError}
        </div>
      )}

      {noClients && (
        <div className="mb-6 rounded-[var(--radius-md)] bg-[var(--color-warning-subtle)] p-4 text-sm text-[var(--color-warning)]">
          Create a client first before creating challenges.
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="w-48">
          <Select
            options={clientOptions}
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            options={folderOptions}
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
          />
        </div>
        <div className="w-36">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          />
        </div>
      </div>

      {filteredChallenges.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {statusFilter === 'all' ? 'All Challenges' : statusFilter === 'active' ? 'Active Challenges' : 'Archived Challenges'}
            </CardTitle>
            <CardDescription>
              {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''}
              {clientFilter && ` for ${clients.find((c) => c.id === clientFilter)?.name}`}
              {folderFilter && ` in ${folderFilter}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ChallengeList
              challenges={filteredChallenges}
              onEdit={handleEditClick}
              onRefresh={handleRefresh}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Challenges</CardTitle>
            <CardDescription>Learning trajectories organized by client and folder.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[200px] items-center justify-center text-[var(--color-fg-muted)]">
              <div className="text-center">
                <FlagIcon className="mx-auto h-12 w-12 text-[var(--color-fg-subtle)]" />
                <h3 className="mt-4 text-lg font-medium text-[var(--color-fg)]">
                  {initialChallenges.length === 0 ? 'No challenges yet' : 'No matching challenges'}
                </h3>
                <p className="mt-1 text-sm">
                  {initialChallenges.length === 0
                    ? 'Create your first challenge to get started.'
                    : 'Try adjusting your filters.'}
                </p>
                {initialChallenges.length === 0 && !noClients && (
                  <Button className="mt-4" variant="secondary" onClick={handleAddClick}>
                    <PlusIcon className="h-4 w-4" />
                    Create Challenge
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ChallengeForm
        challenge={editingChallenge}
        clients={clients}
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  )
}
