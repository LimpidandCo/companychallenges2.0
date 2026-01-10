'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { ClientForm, ClientList } from '@/components/admin'
import type { Client } from '@/lib/types/database'

interface ClientsPageClientProps {
  initialClients: Client[]
  initialError: string | null
}

export function ClientsPageClient({ initialClients, initialError }: ClientsPageClientProps) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const handleAddClick = () => {
    setEditingClient(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingClient(null)
  }

  const handleSuccess = () => {
    router.refresh()
  }

  const handleDelete = () => {
    router.refresh()
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Clients</h1>
          <p className="mt-1 text-[var(--color-fg-muted)]">
            Manage organizations using the platform.
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <PlusIcon className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {initialError && (
        <div className="mb-6 rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-4 text-sm text-[var(--color-error)]">
          {initialError}
        </div>
      )}

      {initialClients.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
            <CardDescription>
              {initialClients.length} organization{initialClients.length !== 1 ? 's' : ''} registered on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ClientList
              clients={initialClients}
              onEdit={handleEditClick}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
            <CardDescription>A list of all organizations registered on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[200px] items-center justify-center text-[var(--color-fg-muted)]">
              <div className="text-center">
                <BuildingIcon className="mx-auto h-12 w-12 text-[var(--color-fg-subtle)]" />
                <h3 className="mt-4 text-lg font-medium text-[var(--color-fg)]">No clients yet</h3>
                <p className="mt-1 text-sm">Get started by creating your first client.</p>
                <Button className="mt-4" variant="secondary" onClick={handleAddClick}>
                  <PlusIcon className="h-4 w-4" />
                  Add Client
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ClientForm
        client={editingClient}
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

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
    </svg>
  )
}
