'use client'

import { useState } from 'react'
import { Button, Badge, Card, CardContent, Spinner } from '@/components/ui'
import { deleteClient } from '@/lib/actions/clients'
import type { Client } from '@/lib/types/database'

interface ClientListProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onDelete: () => void
}

const MODE_BADGES: Record<string, { label: string; variant: 'default' | 'success' | 'outline' }> = {
  collective: { label: 'Collective', variant: 'default' },
  individual: { label: 'Individual', variant: 'success' },
  hybrid: { label: 'Hybrid', variant: 'outline' },
}

export function ClientList({ clients, onEdit, onDelete }: ClientListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async (client: Client) => {
    if (!confirm(`Are you sure you want to delete "${client.name}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(client.id)
    setDeleteError(null)

    try {
      const result = await deleteClient(client.id)
      if (result.success) {
        onDelete()
      } else {
        setDeleteError(result.error ?? 'Failed to delete client')
      }
    } catch (err) {
      setDeleteError('An unexpected error occurred')
    } finally {
      setDeletingId(null)
    }
  }

  if (clients.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {deleteError && (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-3 text-sm text-[var(--color-error)]">
          {deleteError}
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-fg-muted)]">
                Client
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-fg-muted)]">
                Mode
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-fg-muted)]">
                Features
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-fg-muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {clients.map((client) => {
              const enabledFeatures = Object.entries(client.features)
                .filter(([, enabled]) => enabled)
                .map(([key]) => key)

              return (
                <tr key={client.id} className="hover:bg-[var(--color-bg-subtle)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {client.logo_url ? (
                        <img
                          src={client.logo_url}
                          alt={`${client.name} logo`}
                          className="h-8 w-8 rounded-[var(--radius-sm)] object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-bg-muted)] text-sm font-medium text-[var(--color-fg-muted)]">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[var(--color-fg)]">{client.name}</p>
                        <p className="text-xs text-[var(--color-fg-subtle)]">
                          Created {new Date(client.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={MODE_BADGES[client.mode].variant}>
                      {MODE_BADGES[client.mode].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--color-fg-muted)]">
                      {enabledFeatures.length > 0
                        ? `${enabledFeatures.length} enabled`
                        : 'None enabled'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(client)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(client)}
                        disabled={deletingId === client.id}
                        className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)]"
                      >
                        {deletingId === client.id ? (
                          <Spinner size="sm" />
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
