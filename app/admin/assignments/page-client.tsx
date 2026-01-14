'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select, Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter, Spinner } from '@/components/ui'
import { AssignmentForm, AssignmentList } from '@/components/admin'
import { exportAssignments, importAssignments, getImportTemplate } from '@/lib/actions/import-export'
import type { AssignmentWithUsages } from '@/lib/types/database'

interface AssignmentsPageClientProps {
  initialAssignments: AssignmentWithUsages[]
  initialError: string | null
  availableTags: string[]
}

type UsageFilter = 'all' | 'used' | 'unused'
type ContentTypeFilter = '' | 'standard' | 'video' | 'quiz' | 'announcement'

export function AssignmentsPageClient({
  initialAssignments,
  initialError,
  availableTags,
}: AssignmentsPageClientProps) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<AssignmentWithUsages | null>(null)

  // Import/Export state
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [usageFilter, setUsageFilter] = useState<UsageFilter>('all')
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>('')
  const [tagFilter, setTagFilter] = useState<string>('')

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

  // Export handlers
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportAssignments()
      if (result.success) {
        // Download the file
        const blob = new Blob([Buffer.from(result.data, 'base64')], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `assignments-export-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    const result = await getImportTemplate()
    if (result.success) {
      const blob = new Blob([Buffer.from(result.data, 'base64')], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'assignments-import-template.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportResult(null)

    try {
      // Read file as base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string)?.split(',')[1]
        if (!base64) {
          setIsImporting(false)
          return
        }

        const result = await importAssignments(base64, { skipExisting: true })
        if (result.success) {
          setImportResult({
            imported: result.imported,
            skipped: result.skipped,
            errors: result.errors,
          })
          router.refresh()
        }
        setIsImporting(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setIsImporting(false)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle tag click from list
  const handleTagClick = (tag: string) => {
    setTagFilter(tag)
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

      // Tag filter
      if (tagFilter && (!assignment.tags || !assignment.tags.includes(tagFilter))) return false

      return true
    })
  }, [initialAssignments, searchQuery, usageFilter, contentTypeFilter, tagFilter])

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

  const tagOptions = [
    { value: '', label: 'All Tags' },
    ...availableTags.map((tag) => ({ value: tag, label: tag })),
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Assignment Library</h1>
          <p className="mt-1 text-[var(--color-fg-muted)]">
            Assignments saved for reuse across challenges. Create new assignments from the challenge page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setImportDialogOpen(true)}
            disabled={isImporting}
          >
            {isImporting ? <Spinner size="sm" className="mr-2" /> : <UploadIcon className="h-4 w-4 mr-2" />}
            Import
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={isExporting || initialAssignments.length === 0}
          >
            {isExporting ? <Spinner size="sm" className="mr-2" /> : <DownloadIcon className="h-4 w-4 mr-2" />}
            Export
          </Button>
        </div>
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
        {availableTags.length > 0 && (
          <div className="w-36">
            <Select
              options={tagOptions}
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            />
          </div>
        )}
        <div className="w-36">
          <Select
            options={usageOptions}
            value={usageFilter}
            onChange={(e) => setUsageFilter(e.target.value as UsageFilter)}
          />
        </div>
      </div>

      {/* Active filter indicator */}
      {tagFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-[var(--color-fg-muted)]">Filtered by tag:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]">
            {tagFilter}
            <button
              onClick={() => setTagFilter('')}
              className="ml-1 hover:text-[var(--color-error)]"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {filteredAssignments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Saved Assignments</CardTitle>
            <CardDescription>
              {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''} in your library
              {searchQuery && ` matching "${searchQuery}"`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <AssignmentList
              assignments={filteredAssignments}
              onEdit={handleEditClick}
              onRefresh={handleRefresh}
              onTagClick={handleTagClick}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Saved Assignments</CardTitle>
            <CardDescription>Reusable content units saved from your challenges.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[200px] items-center justify-center text-[var(--color-fg-muted)]">
              <div className="text-center">
                <FileTextIcon className="mx-auto h-12 w-12 text-[var(--color-fg-subtle)]" />
                <h3 className="mt-4 text-lg font-medium text-[var(--color-fg)]">
                  {initialAssignments.length === 0 ? 'Library is empty' : 'No matching assignments'}
                </h3>
                <p className="mt-1 text-sm max-w-sm">
                  {initialAssignments.length === 0
                    ? 'Create assignments from the challenge page and check "Save for future reference" to add them here.'
                    : 'Try adjusting your search or filters.'}
                </p>
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

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => { setImportDialogOpen(false); setImportResult(null); }}>
        <DialogHeader>
          <DialogTitle>Import Assignments</DialogTitle>
          <DialogDescription>
            Upload an Excel file to import assignments into your library.
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          {importResult ? (
            <div className="space-y-4">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-success-subtle)] p-4">
                <p className="font-medium text-[var(--color-success)]">Import Complete</p>
                <p className="text-sm text-[var(--color-fg-muted)] mt-1">
                  {importResult.imported} assignment{importResult.imported !== 1 ? 's' : ''} imported
                  {importResult.skipped > 0 && `, ${importResult.skipped} skipped`}
                </p>
              </div>
              {importResult.errors.length > 0 && (
                <div className="rounded-[var(--radius-md)] bg-[var(--color-warning-subtle)] p-4">
                  <p className="font-medium text-[var(--color-warning)]">Warnings</p>
                  <ul className="text-sm text-[var(--color-fg-muted)] mt-1 space-y-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)] p-8 text-center">
                <UploadIcon className="mx-auto h-10 w-10 text-[var(--color-fg-subtle)]" />
                <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
                  Select an Excel file (.xlsx) to import
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  {isImporting ? <Spinner size="sm" className="mr-2" /> : null}
                  Choose File
                </Button>
              </div>

              <div className="text-center">
                <button
                  onClick={handleDownloadTemplate}
                  className="text-sm text-[var(--color-accent)] hover:underline"
                >
                  Download template file
                </button>
              </div>

              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-4 text-sm">
                <p className="font-medium text-[var(--color-fg)]">Import notes:</p>
                <ul className="mt-2 space-y-1 text-[var(--color-fg-muted)] list-disc list-inside">
                  <li>Rows with existing slugs will be skipped</li>
                  <li>Internal Title is the only required field</li>
                  <li>Tags should be comma-separated</li>
                </ul>
              </div>
            </>
          )}
        </DialogContent>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => { setImportDialogOpen(false); setImportResult(null); }}
          >
            {importResult ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleImportFile}
        className="hidden"
      />
    </div>
  )
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}
