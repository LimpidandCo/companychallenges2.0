'use client'

import { useCallback, useState, useEffect, useSyncExternalStore, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Editor } from '@/components/ui/rich-editor/editor'
import {
  EditorProvider,
  createInitialState,
  useContainer,
  useEditorDispatch,
  serializeToHtml,
  type ContainerNode,
} from '@/components/ui/rich-editor'
import { EditorActions } from '@/components/ui/rich-editor/lib/reducer/actions'
import { uploadFile } from '@/lib/actions/upload'
import { cn } from '@/lib/utils/cn'
import { InfoButtonConfig, DEFAULT_INFO_BUTTON_CONFIG } from '@/components/ui/rich-editor/info-button'

export type ContentType = 'challenge-description' | 'assignment-instructions' | 'assignment-content'

export interface AdvancedEditorProps {
  /** Current content as JSON (ContainerNode) or null for new content */
  value: ContainerNode | null
  /** Called when editor closes with the updated content */
  onChange: (content: ContainerNode, html: string) => void
  /** Type of content being edited (for default templates) */
  contentType: ContentType
  /** Whether the editor modal is open */
  open: boolean
  /** Called when the editor should close */
  onClose: () => void
  /** Whether to show template switcher (default: true for assignments, false for challenge) */
  showTemplates?: boolean
  /** Optional preview URL - if provided, shows preview button */
  previewUrl?: string
}

// SSR-safe subscription for mounted state
const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

/**
 * Full-screen advanced editor that opens as an overlay.
 * Provides a focused editing experience with auto-save on close.
 */
export function AdvancedEditor({
  value,
  onChange,
  contentType,
  open,
  onClose,
  showTemplates,
  previewUrl,
}: AdvancedEditorProps) {
  // SSR-safe way to check if we're on the client
  const isMounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)

  if (!open || !isMounted) return null

  // Get initial state from value or create default template
  const initialState = value
    ? createInitialState(value)
    : createInitialState(getDefaultTemplate(contentType))

  // Default: show templates only for assignment content types
  const shouldShowTemplates = showTemplates ?? contentType.startsWith('assignment')

  return createPortal(
    <div className="fixed inset-0 z-100 bg-gray-100">
      <EditorProvider initialState={initialState}>
        <EditorContent
          contentType={contentType}
          onChange={onChange}
          onClose={onClose}
          showTemplates={shouldShowTemplates}
          previewUrl={previewUrl}
        />
      </EditorProvider>
    </div>,
    document.body
  )
}

/**
 * Inner editor content component that has access to the editor context
 */
function EditorContent({
  contentType,
  onChange,
  onClose,
  showTemplates,
  previewUrl,
}: {
  contentType: ContentType
  onChange: (content: ContainerNode, html: string) => void
  onClose: () => void
  showTemplates: boolean
  previewUrl?: string
}) {
  const container = useContainer()
  const dispatch = useEditorDispatch()
  
  // Page background color from container attributes (stored in the content itself)
  const pageBackgroundColor = container.attributes?.pageBackgroundColor as string || '#ffffff'
  
  // Get info button config from container attributes (stored as JSON string)
  const infoButtonConfig: InfoButtonConfig = (() => {
    const stored = container.attributes?.infoButtonConfig
    if (typeof stored === 'string') {
      try {
        return JSON.parse(stored) as InfoButtonConfig
      } catch {
        return DEFAULT_INFO_BUTTON_CONFIG
      }
    }
    return DEFAULT_INFO_BUTTON_CONFIG
  })()
  
  // Update page background color in container (so it persists)
  const setPageBackgroundColor = useCallback((color: string) => {
    dispatch(EditorActions.updateAttributes('root', { pageBackgroundColor: color }, true))
  }, [dispatch])
  
  // Update info button config in container (stored as JSON string so it persists)
  const setInfoButtonConfig = useCallback((config: InfoButtonConfig) => {
    dispatch(EditorActions.updateAttributes('root', { infoButtonConfig: JSON.stringify(config) }, true))
  }, [dispatch])

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const initialContainerRef = useRef(JSON.stringify(container))

  // Track changes
  useEffect(() => {
    const currentContent = JSON.stringify(container)
    setHasUnsavedChanges(currentContent !== initialContainerRef.current)
  }, [container])

  const handleSave = useCallback(() => {
    setSaveStatus('saving')
    
    // Export to HTML for public rendering
    const html = serializeToHtml(container)
    
    // Pass back the JSON content and HTML
    onChange(container, html)
    
    // Update the initial ref so we know we're "saved"
    initialContainerRef.current = JSON.stringify(container)
    setHasUnsavedChanges(false)
    
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }, [container, onChange])

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true)
    } else {
      onClose()
    }
  }, [hasUnsavedChanges, onClose])

  const handleDiscardAndClose = useCallback(() => {
    setShowUnsavedDialog(false)
    onClose()
  }, [onClose])

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  // Custom image upload handler
  const handleUploadImage = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadFile(formData, 'assignments')
    
    if (result.success) {
      return result.url
    }
    throw new Error(result.error)
  }, [])

  const handlePreview = useCallback(() => {
    if (!previewUrl) return
    
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true)
    } else {
      window.open(previewUrl, '_blank')
    }
  }, [previewUrl, hasUnsavedChanges])

  return (
    <div className="flex flex-col h-full">
      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-pop-in">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unsaved Changes</h3>
              <p className="text-gray-600">
                You have unsaved changes. What would you like to do?
              </p>
            </div>
            <div className="flex border-t border-gray-200">
              <button
                onClick={handleDiscardAndClose}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={() => setShowUnsavedDialog(false)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors border-l border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSave()
                  setShowUnsavedDialog(false)
                  if (previewUrl) {
                    setTimeout(() => window.open(previewUrl, '_blank'), 100)
                  } else {
                    onClose()
                  }
                }}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal header */}
      <header className="shrink-0 bg-white border-b border-gray-200 relative z-[200]">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Close */}
          <button
            onClick={handleClose}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon className="h-4 w-4" />
            Close
          </button>
          
          {/* Center: Label + status */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">
              {getSimpleContentTypeLabel(contentType)}
            </span>
            {hasUnsavedChanges && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Unsaved
              </span>
            )}
          </div>
          
          {/* Right: Preview + Save */}
          <div className="flex items-center gap-2">
            {previewUrl && (
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Preview as end-user"
              >
                <ExternalLinkIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saveStatus === 'saving'}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                hasUnsavedChanges
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  : saveStatus === 'saved'
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
              )}
            >
              {saveStatus === 'saving' ? (
                <>
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Editor area - clean neutral background */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        <div className="h-full flex items-start justify-center p-4 md:p-8">
          {/* The "island" - the actual page content area */}
          <div 
            className="w-full max-w-5xl h-full rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col"
            style={{ backgroundColor: pageBackgroundColor }}
          >
            <Editor
              onUploadImage={handleUploadImage}
              notionBased={true}
              showExportButton={false}
              showTemplates={showTemplates}
              onPreviewClick={previewUrl ? handlePreview : undefined}
              pageBackgroundColor={pageBackgroundColor}
              onPageBackgroundColorChange={setPageBackgroundColor}
              infoButtonConfig={infoButtonConfig}
              onInfoButtonConfigChange={setInfoButtonConfig}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Get a simpler label for the header
 */
function getSimpleContentTypeLabel(contentType: ContentType): string {
  switch (contentType) {
    case 'challenge-description':
      return 'Challenge Page'
    case 'assignment-instructions':
      return 'Instructions'
    case 'assignment-content':
      return 'Assignment Page'
    default:
      return 'Page'
  }
}

/**
 * Get the default template for a content type
 */
function getDefaultTemplate(contentType: ContentType): ContainerNode {
  const timestamp = Date.now()
  
  switch (contentType) {
    case 'challenge-description':
      return {
        id: 'root',
        type: 'container',
        children: [
          {
            id: `h1-${timestamp}`,
            type: 'h1',
            content: 'Welcome to this Challenge',
            attributes: {},
          },
          {
            id: `p-${timestamp}-1`,
            type: 'p',
            content: 'This challenge will guide you through a series of assignments designed to help you grow and develop new skills.',
            attributes: {},
          },
          {
            id: `h2-${timestamp}`,
            type: 'h2',
            content: 'What you\'ll learn',
            attributes: {},
          },
          {
            id: `ol-${timestamp}`,
            type: 'ol',
            lines: [
              { content: 'Key concept one' },
              { content: 'Key concept two' },
              { content: 'Key concept three' },
            ],
            attributes: {},
          },
          {
            id: `p-${timestamp}-2`,
            type: 'p',
            content: '',
            attributes: {},
          },
        ],
        attributes: {
          pageBackgroundColor: '#ffffff'
        },
      }

    case 'assignment-instructions':
      return {
        id: 'root',
        type: 'container',
        children: [
          {
            id: `h2-${timestamp}`,
            type: 'h2',
            content: 'Instructions',
            attributes: {},
          },
          {
            id: `p-${timestamp}-1`,
            type: 'p',
            content: 'Follow these steps to complete this assignment.',
            attributes: {},
          },
          {
            id: `ol-${timestamp}`,
            type: 'ol',
            lines: [
              { content: 'Step one' },
              { content: 'Step two' },
              { content: 'Step three' },
            ],
            attributes: {},
          },
        ],
        attributes: {
          pageBackgroundColor: '#ffffff'
        },
      }

    case 'assignment-content':
    default:
      return {
        id: 'root',
        type: 'container',
        children: [
          {
            id: `h1-${timestamp}`,
            type: 'h1',
            content: 'Assignment Title',
            attributes: {},
          },
          {
            id: `p-${timestamp}-1`,
            type: 'p',
            content: 'Start writing your assignment content here.',
            attributes: {},
          },
          {
            id: `p-${timestamp}-2`,
            type: 'p',
            content: '',
            attributes: {},
          },
        ],
        attributes: {
          pageBackgroundColor: '#ffffff'
        },
      }
  }
}

// Simple icons
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

/**
 * Trigger button to open the advanced editor
 */
export function EditorTrigger({
  label = 'content',
  hasContent = false,
  onClick,
}: {
  label?: string
  hasContent?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all",
        "text-sm",
        hasContent
          ? "border-[var(--color-border)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-muted)]"
          : "border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-subtle)]",
      )}
    >
      <span className="flex items-center gap-2">
        <EditIcon className="h-4 w-4 text-[var(--color-fg-muted)]" />
        <span className="text-[var(--color-fg)]">
          {hasContent ? `Edit ${label}` : `Add ${label}`}
        </span>
      </span>
      {hasContent && (
        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
          Has content
        </span>
      )}
    </button>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}
