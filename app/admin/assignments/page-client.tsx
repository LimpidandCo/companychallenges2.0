'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select } from '@/components/ui'
import { AssignmentForm, AssignmentList } from '@/components/admin'
import type { AssignmentWithUsages } from '@/lib/types/database'

interface AssignmentsPageClientProps {
  initialAssignments: AssignmentWithUsages[]
  initialError: string | null
}

type UsageFilter = 'all' | 'used' | 'unused'
type ContentTypeFilter = '' | 'standard' | 'video' | 'quiz' | 'announcement'

export function AssignmentsPageClient({
  initialAssignments,
  initialError,
}: AssignmentsPageClientProps) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<AssignmentWithUsages | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [usageFilter, setUsageFilter] = useState<UsageFilter>('all')
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>('')

  const handleAddClick = () => {
    setEditingAssignment(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (assignment: AssignmentWithUsages) => {
    setEditingAssignment(assignment)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingAssignment(null)
  }

  const handleSuccess = () => {
    router.refresh()
  }

  const handleRefresh = () => {
    router.refresh()
  }

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return initialAssignments.filter((assignment) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = assignment.internal_title.toLowerCase().includes(query)
        const matchesPublicTitle = assignment.public_title?.toLowerCase().includes(query)
        if (!matchesTitle && !matchesPublicTitle) return false
      }

      // Usage filter
      const usageCount = assignment.assignment_usages?.length ?? 0
      if (usageFilter === 'used' && usageCount === 0) return false
      if (usageFilter === 'unused' && usageCount > 0) return false

      // Content type filter
      if (contentTypeFilter && assignment.content_type !== contentTypeFilter) return false

      return true
    })
  }, [initialAssignments, searchQuery, usageFilter, contentTypeFilter])

  const usageOptions = [
    { value: 'all', label: 'Usage: Any' },
    { value: 'used', label: 'In Use' },
    { value: 'unused', label: 'Unused' },
  ]

  const contentTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'standard', label: 'Standard' },
    { value: 'video', label: 'Video' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'announcement', label: 'Announcement' },
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Assignment Library</h1>
          <p className="mt-1 text-[var(--color-fg-muted)]">
            Browse and manage reusable content units.
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <PlusIcon className="h-4 w-4" />
          Create Assignment
        </Button>
      </div>

      {initialError && (
        <div className="mb-6 rounded-[var(--radius-md)] bg-[var(--color-error-subtle)] p-4 text-sm text-[var(--color-error)]">
          {initialError}
        </div>
      )}

      {/* Search and filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-36">
          <Select
            options={contentTypeOptions}
            value={contentTypeFilter}
            onChange={(e) => setContentTypeFilter(e.target.value as ContentTypeFilter)}
          />
        </div>
        <div className="w-36">
          <Select
            options={usageOptions}
            value={usageFilter}
            onChange={(e) => setUsageFilter(e.target.value as UsageFilter)}
          />
        </div>
      </div>

      {filteredAssignments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Assignments</CardTitle>
            <CardDescription>
              {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <AssignmentList
              assignments={filteredAssignments}
              onEdit={handleEditClick}
              onRefresh={handleRefresh}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Assignments</CardTitle>
            <CardDescription>Standalone content units that can be reused across challenges.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[200px] items-center justify-center text-[var(--color-fg-muted)]">
              <div className="text-center">
                <FileTextIcon className="mx-auto h-12 w-12 text-[var(--color-fg-subtle)]" />
                <h3 className="mt-4 text-lg font-medium text-[var(--color-fg)]">
                  {initialAssignments.length === 0 ? 'No assignments yet' : 'No matching assignments'}
                </h3>
                <p className="mt-1 text-sm">
                  {initialAssignments.length === 0
                    ? 'Create your first assignment to build your content library.'
                    : 'Try adjusting your search or filters.'}
                </p>
                {initialAssignments.length === 0 && (
                  <Button className="mt-4" variant="secondary" onClick={handleAddClick}>
                    <PlusIcon className="h-4 w-4" />
                    Create Assignment
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AssignmentForm
        assignment={editingAssignment}
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

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}
