'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Spinner } from '@/components/ui'
import { deleteClient } from '@/lib/actions/clients'
import type { Client } from '@/lib/types/database'

interface ClientListProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onDelete: () => void
}

export function ClientList({ clients, onEdit, onDelete }: ClientListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, client: Client) => {
    e.preventDefault()
    e.stopPropagation()

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
    } catch {
      setDeleteError('An unexpected error occurred')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (e: React.MouseEvent, client: Client) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit(client)
  }

  if (clients.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {deleteError && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      <div className="grid gap-3">
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/admin/clients/${client.id}`}
            className="group flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4 min-w-0">
              {client.logo_url ? (
                <img
                  src={client.logo_url}
                  alt={`${client.name} logo`}
                  className="h-12 w-12 rounded-xl object-contain bg-gray-50 p-1"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 text-lg font-bold text-gray-400">
                  {client.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {client.name}
                </p>
                <p className="text-sm text-gray-500">
                  Created {formatDate(client.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => handleEdit(e, client)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={(e) => handleDelete(e, client)}
                disabled={deletingId === client.id}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === client.id ? <Spinner size="sm" /> : 'Delete'}
              </button>
            </div>

            <ChevronRightIcon className="h-5 w-5 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}
