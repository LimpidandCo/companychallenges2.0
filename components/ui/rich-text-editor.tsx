'use client'

import { useCallback, useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@/lib/utils/cn'

export interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  hint?: string
  error?: string
  className?: string
  disabled?: boolean
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  label,
  hint,
  error,
  className,
  disabled = false,
}: RichTextEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[var(--color-primary)] underline hover:no-underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-[var(--radius-md)]',
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-[var(--radius-md)]',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none p-3 min-h-[150px] focus:outline-none',
          '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2',
          '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2',
          '[&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-2 [&_h3]:mb-1',
          '[&_p]:my-2',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2',
          '[&_li]:my-1',
          '[&_a]:text-[var(--color-primary)] [&_a]:underline',
          '[&_.ProseMirror-placeholder]:text-[var(--color-fg-subtle)]'
        ),
      },
    },
  })

  const handleSetLink = useCallback(() => {
    if (!editor) return
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run()
    }
    setLinkUrl('')
    setLinkDialogOpen(false)
  }, [editor, linkUrl])

  const handleRemoveLink = useCallback(() => {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
    setLinkDialogOpen(false)
  }, [editor])

  const handleAddImage = useCallback(() => {
    if (!editor || !imageUrl) return
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl('')
    setImageDialogOpen(false)
  }, [editor, imageUrl])

  const handleAddVideo = useCallback(() => {
    if (!editor || !videoUrl) return
    editor.chain().focus().setYoutubeVideo({ src: videoUrl }).run()
    setVideoUrl('')
    setVideoDialogOpen(false)
  }, [editor, videoUrl])

  const openLinkDialog = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href || ''
    setLinkUrl(previousUrl)
    setLinkDialogOpen(true)
  }, [editor])

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-fg)]">
          {label}
        </label>
      )}

      <div
        className={cn(
          'rounded-[var(--radius-md)] border bg-[var(--color-bg)]',
          error
            ? 'border-[var(--color-error)]'
            : 'border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-[var(--color-border)] p-2 bg-[var(--color-bg-subtle)] rounded-t-[var(--radius-md)]">
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor?.isActive('heading', { level: 1 })}
              disabled={disabled}
              title="Heading 1"
            >
              H1
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor?.isActive('heading', { level: 2 })}
              disabled={disabled}
              title="Heading 2"
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor?.isActive('heading', { level: 3 })}
              disabled={disabled}
              title="Heading 3"
            >
              H3
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive('bold')}
              disabled={disabled}
              title="Bold (Cmd+B)"
            >
              <BoldIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive('italic')}
              disabled={disabled}
              title="Italic (Cmd+I)"
            >
              <ItalicIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              active={editor?.isActive('strike')}
              disabled={disabled}
              title="Strikethrough"
            >
              <StrikeIcon className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive('bulletList')}
              disabled={disabled}
              title="Bullet List"
            >
              <BulletListIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive('orderedList')}
              disabled={disabled}
              title="Numbered List"
            >
              <OrderedListIcon className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton
              onClick={openLinkDialog}
              active={editor?.isActive('link')}
              disabled={disabled}
              title="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setImageDialogOpen(true)}
              disabled={disabled}
              title="Add Image"
            >
              <ImageIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setVideoDialogOpen(true)}
              disabled={disabled}
              title="Embed Video"
            >
              <VideoIcon className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={disabled || !editor?.can().undo()}
              title="Undo (Cmd+Z)"
            >
              <UndoIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={disabled || !editor?.can().redo()}
              title="Redo (Cmd+Shift+Z)"
            >
              <RedoIcon className="h-4 w-4" />
            </ToolbarButton>
          </ToolbarGroup>
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} />
      </div>

      {hint && !error && (
        <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p>
      )}
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}

      {/* Link Dialog */}
      {linkDialogOpen && (
        <MiniDialog
          title="Add Link"
          onClose={() => setLinkDialogOpen(false)}
        >
          <div className="space-y-3">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              {editor?.isActive('link') && (
                <button
                  onClick={handleRemoveLink}
                  className="px-3 py-1.5 text-sm text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] rounded-[var(--radius-md)]"
                >
                  Remove
                </button>
              )}
              <button
                onClick={() => setLinkDialogOpen(false)}
                className="px-3 py-1.5 text-sm text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] rounded-[var(--radius-md)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSetLink}
                disabled={!linkUrl}
                className="px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </MiniDialog>
      )}

      {/* Image Dialog */}
      {imageDialogOpen && (
        <MiniDialog
          title="Add Image"
          onClose={() => setImageDialogOpen(false)}
        >
          <div className="space-y-3">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setImageDialogOpen(false)}
                className="px-3 py-1.5 text-sm text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] rounded-[var(--radius-md)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddImage}
                disabled={!imageUrl}
                className="px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </MiniDialog>
      )}

      {/* Video Dialog */}
      {videoDialogOpen && (
        <MiniDialog
          title="Embed Video"
          onClose={() => setVideoDialogOpen(false)}
        >
          <div className="space-y-3">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              autoFocus
            />
            <p className="text-xs text-[var(--color-fg-muted)]">
              Supports YouTube URLs
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setVideoDialogOpen(false)}
                className="px-3 py-1.5 text-sm text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] rounded-[var(--radius-md)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVideo}
                disabled={!videoUrl}
                className="px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-50"
              >
                Embed
              </button>
            </div>
          </div>
        </MiniDialog>
      )}
    </div>
  )
}

// Helper Components

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-[var(--color-border)]" />
}

interface ToolbarButtonProps {
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  title?: string
  children: React.ReactNode
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-[var(--color-primary)] text-white'
          : 'text-[var(--color-fg)] hover:bg-[var(--color-bg-hover)]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

interface MiniDialogProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

function MiniDialog({ title, onClose, children }: MiniDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-[var(--color-fg)]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Icons

function BoldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  )
}

function ItalicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 4h8M6 20h8M14.5 4 9.5 20" />
    </svg>
  )
}

function StrikeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M7.5 6c0-1.5 1.5-3 4.5-3s4.5 1.5 4.5 3c0 1.5-1 2.5-2.5 3M7.5 18c0 1.5 1.5 3 4.5 3s4.5-1.5 4.5-3c0-1.5-1-2.5-2.5-3" />
    </svg>
  )
}

function BulletListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

function OrderedListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6h11M10 12h11M10 18h11" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h1v4M4 10h2M4 18h2l-2-3h2" />
    </svg>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  )
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function UndoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
  )
}

function RedoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
