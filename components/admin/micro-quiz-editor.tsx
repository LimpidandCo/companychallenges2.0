'use client'

import { useState, useEffect } from 'react'
import { Button, Spinner, Textarea } from '@/components/ui'
import { MicroQuizList } from './micro-quiz-list'
import { MicroQuizForm } from './micro-quiz-form'
import { getMicroQuizzesForAssignment, createMicroQuiz } from '@/lib/actions/micro-quizzes'
import type { MicroQuiz, AssignmentUsageWithAssignment } from '@/lib/types/database'

interface MicroQuizEditorProps {
  usage: AssignmentUsageWithAssignment | null
  open: boolean
  onClose: () => void
}

export function MicroQuizEditor({ usage, open, onClose }: MicroQuizEditorProps) {
  const [quizzes, setQuizzes] = useState<MicroQuiz[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<MicroQuiz | null>(null)
  const [showBulkPaste, setShowBulkPaste] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkImporting, setBulkImporting] = useState(false)

  // Load quizzes when dialog opens
  useEffect(() => {
    if (open && usage) {
      loadQuizzes()
    }
  }, [open, usage])

  const loadQuizzes = async () => {
    if (!usage) return

    setLoading(true)
    setError(null)

    try {
      const result = await getMicroQuizzesForAssignment(usage.assignment_id)
      if (result.success) {
        setQuizzes(result.data)
      } else {
        setError(result.error)
      }
    } catch {
      setError('Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingQuiz(null)
    setError(null)
    onClose()
  }

  const handleAddNew = () => {
    setEditingQuiz(null)
    setShowForm(true)
  }

  const handleEdit = (quiz: MicroQuiz) => {
    setEditingQuiz(quiz)
    setShowForm(true)
  }

  const handleFormCancel = () => {
    setEditingQuiz(null)
    setShowForm(false)
  }

  const handleFormSuccess = () => {
    setEditingQuiz(null)
    setShowForm(false)
    loadQuizzes()
  }

  const handleBulkImport = async () => {
    if (!usage || !bulkText.trim()) return

    const lines = bulkText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)

    if (lines.length === 0) return

    setBulkImporting(true)
    setError(null)
    let imported = 0

    try {
      for (const line of lines) {
        const result = await createMicroQuiz({
          assignment_id: usage.assignment_id,
          question: line,
          quiz_type: 'reflection',
          options: null,
          scale_min: null,
          scale_max: null,
          scale_labels: null,
        })
        if (result.success) imported++
      }

      setBulkText('')
      setShowBulkPaste(false)
      loadQuizzes()
    } catch {
      setError(`Imported ${imported} of ${lines.length} questions. Some failed.`)
    } finally {
      setBulkImporting(false)
    }
  }

  if (!usage || !open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative my-8 w-full max-w-2xl mx-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                    <QuizIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Quiz Questions
                    </h2>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {usage.assignment.internal_title}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 max-h-[calc(100vh-280px)] overflow-y-auto">
            {error && (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 font-medium"
                >
                  Dismiss
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Spinner size="lg" />
                  <p className="mt-3 text-sm text-gray-500">Loading questions...</p>
                </div>
              </div>
            ) : showBulkPaste ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Paste Questions</p>
                  <Button variant="ghost" size="sm" onClick={() => setShowBulkPaste(false)}>
                    Cancel
                  </Button>
                </div>
                <Textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={"One question per line, e.g.:\nWhat was your key takeaway?\nHow will you apply this?\nWhat surprised you most?"}
                  rows={8}
                  className="resize-none font-mono text-sm"
                  disabled={bulkImporting}
                />
                <p className="text-xs text-gray-500">
                  Each line becomes a reflection-type question. You can change the type after import.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {bulkText.split('\n').filter(l => l.trim()).length} question(s)
                  </span>
                  <Button
                    onClick={handleBulkImport}
                    disabled={bulkImporting || !bulkText.trim()}
                    size="sm"
                  >
                    {bulkImporting ? <Spinner size="sm" className="mr-2" /> : null}
                    Import All
                  </Button>
                </div>
              </div>
            ) : showForm ? (
              <MicroQuizForm
                key={editingQuiz?.id ?? 'new'}
                assignmentId={usage.assignment_id}
                quiz={editingQuiz}
                onCancel={handleFormCancel}
                onSuccess={handleFormSuccess}
              />
            ) : quizzes.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {quizzes.length} question{quizzes.length !== 1 ? 's' : ''} • Drag to reorder
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowBulkPaste(true)}>
                      <PasteIcon className="h-4 w-4 mr-1.5" />
                      Paste Questions
                    </Button>
                    <Button onClick={handleAddNew} size="sm">
                      <PlusIcon className="h-4 w-4 mr-1.5" />
                      Add Question
                    </Button>
                  </div>
                </div>
                <MicroQuizList
                  quizzes={quizzes}
                  onEdit={handleEdit}
                  onRefresh={loadQuizzes}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
                  <QuizIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">No questions yet</h3>
                <p className="mt-1 text-sm text-gray-500 max-w-sm">
                  Add reflection questions to gather insights from participants after they complete this assignment.
                </p>
                <div className="flex items-center gap-3 mt-5">
                  <Button onClick={handleAddNew}>
                    <PlusIcon className="h-4 w-4 mr-1.5" />
                    Add Question
                  </Button>
                  <Button variant="secondary" onClick={() => setShowBulkPaste(true)}>
                    <PasteIcon className="h-4 w-4 mr-1.5" />
                    Paste Questions
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function PasteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
  )
}

function QuizIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
