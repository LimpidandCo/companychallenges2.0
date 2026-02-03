'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { Extension } from '@tiptap/core'
import { cn } from '@/lib/utils/cn'

// Custom Font Size extension
const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run()
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
        },
    }
  },
})

// Font options
const FONT_FAMILIES = [
  { value: '', label: 'Default' },
  { value: 'Inter, sans-serif', label: 'Sans Serif' },
  { value: 'Georgia, serif', label: 'Serif' },
  { value: 'ui-monospace, monospace', label: 'Mono' },
]

// Font sizes using CSS classes
const FONT_SIZES = [
  { value: '0.875rem', label: 'Small' },
  { value: '1rem', label: 'Normal' },
  { value: '1.25rem', label: 'Large' },
  { value: '1.5rem', label: 'XL' },
]

// Color palette
const TEXT_COLORS = [
  { value: '', label: 'Default', color: 'var(--color-fg)' },
  { value: '#ef4444', label: 'Red', color: '#ef4444' },
  { value: '#f97316', label: 'Orange', color: '#f97316' },
  { value: '#eab308', label: 'Yellow', color: '#eab308' },
  { value: '#22c55e', label: 'Green', color: '#22c55e' },
  { value: '#3b82f6', label: 'Blue', color: '#3b82f6' },
  { value: '#8b5cf6', label: 'Purple', color: '#8b5cf6' },
  { value: '#ec4899', label: 'Pink', color: '#ec4899' },
]

const HIGHLIGHT_COLORS = [
  { value: '', label: 'None', color: 'transparent' },
  { value: '#fef08a', label: 'Yellow', color: '#fef08a' },
  { value: '#bbf7d0', label: 'Green', color: '#bbf7d0' },
  { value: '#bfdbfe', label: 'Blue', color: '#bfdbfe' },
  { value: '#fbcfe8', label: 'Pink', color: '#fbcfe8' },
  { value: '#fed7aa', label: 'Orange', color: '#fed7aa' },
]

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
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[var(--color-accent)] underline hover:no-underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-xl my-4',
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-xl my-4',
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
          'prose prose-sm max-w-none px-4 py-3 min-h-[180px] focus:outline-none',
          'text-[var(--color-fg)]',
          '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-[var(--color-fg)]',
          '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-[var(--color-fg)]',
          '[&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-[var(--color-fg)]',
          '[&_p]:my-2 [&_p]:text-[var(--color-fg)]',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2',
          '[&_li]:my-1 [&_li]:text-[var(--color-fg)]',
          '[&_a]:text-[var(--color-accent)] [&_a]:underline',
          '[&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-accent)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--color-fg-muted)]',
          '[&_code]:bg-[var(--color-bg-muted)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono',
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
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-semibold text-[var(--color-fg)]">
          {label}
        </label>
      )}

      <div
        className={cn(
          'rounded-xl border-[1.5px] bg-[var(--color-bg)] overflow-hidden transition-all duration-150',
          error
            ? 'border-[var(--color-error)] shadow-[var(--shadow-xs)]'
            : 'border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:shadow-[var(--shadow-sm)]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-[var(--color-border)] px-2 py-2 bg-[var(--color-bg-muted)]">
          {/* Headings */}
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

          {/* Font Family & Size */}
          <ToolbarGroup>
            <ToolbarSelect
              options={FONT_FAMILIES}
              value={editor?.getAttributes('textStyle').fontFamily || ''}
              onChange={(value) => {
                if (value) {
                  editor?.chain().focus().setFontFamily(value).run()
                } else {
                  editor?.chain().focus().unsetFontFamily().run()
                }
              }}
              disabled={disabled}
              title="Font Family"
              className="w-24"
            />
            <ToolbarSelect
              options={FONT_SIZES}
              value={getCurrentFontSize(editor)}
              onChange={(value) => {
                if (value && value !== '1rem') {
                  (editor?.chain().focus() as any).setFontSize(value).run()
                } else {
                  (editor?.chain().focus() as any).unsetFontSize().run()
                }
              }}
              disabled={disabled}
              title="Font Size"
              className="w-20"
            />
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Text Formatting */}
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

          {/* Colors */}
          <ToolbarGroup>
            <ColorPicker
              colors={TEXT_COLORS}
              currentColor={editor?.getAttributes('textStyle').color || ''}
              onSelect={(color) => {
                if (color) {
                  editor?.chain().focus().setColor(color).run()
                } else {
                  editor?.chain().focus().unsetColor().run()
                }
              }}
              disabled={disabled}
              title="Text Color"
              icon={<TextColorIcon className="h-4 w-4" />}
            />
            <ColorPicker
              colors={HIGHLIGHT_COLORS}
              currentColor={editor?.getAttributes('highlight').color || ''}
              onSelect={(color) => {
                if (color) {
                  editor?.chain().focus().toggleHighlight({ color }).run()
                } else {
                  editor?.chain().focus().unsetHighlight().run()
                }
              }}
              disabled={disabled}
              title="Highlight"
              icon={<HighlightIcon className="h-4 w-4" />}
            />
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              active={editor?.isActive({ textAlign: 'left' })}
              disabled={disabled}
              title="Align Left"
            >
              <AlignLeftIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              active={editor?.isActive({ textAlign: 'center' })}
              disabled={disabled}
              title="Align Center"
            >
              <AlignCenterIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              active={editor?.isActive({ textAlign: 'right' })}
              disabled={disabled}
              title="Align Right"
            >
              <AlignRightIcon className="h-4 w-4" />
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
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              active={editor?.isActive('blockquote')}
              disabled={disabled}
              title="Quote"
            >
              <QuoteIcon className="h-4 w-4" />
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

          <div className="flex-1" />

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
          <div className="space-y-4">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full h-10 rounded-lg border-[1.5px] border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              {editor?.isActive('link') && (
                <button
                  onClick={handleRemoveLink}
                  className="px-3 py-2 text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] rounded-lg transition-colors"
                >
                  Remove
                </button>
              )}
              <button
                onClick={() => setLinkDialogOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-muted)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetLink}
                disabled={!linkUrl}
                className="px-4 py-2 text-sm font-medium bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
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
          <div className="space-y-4">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full h-10 rounded-lg border-[1.5px] border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              autoFocus
            />
            {imageUrl && (
              <div className="aspect-video rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setImageDialogOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-muted)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddImage}
                disabled={!imageUrl}
                className="px-4 py-2 text-sm font-medium bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
              >
                Add Image
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
          <div className="space-y-4">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full h-10 rounded-lg border-[1.5px] border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              autoFocus
            />
            <p className="text-xs text-[var(--color-fg-muted)] flex items-center gap-2">
              <span className="text-base">📺</span> Supports YouTube URLs
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setVideoDialogOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-muted)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVideo}
                disabled={!videoUrl}
                className="px-4 py-2 text-sm font-medium bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
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
  return <div className="mx-1.5 h-5 w-px bg-[var(--color-border)]" />
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
        'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-all duration-150',
        active
          ? 'bg-[var(--color-accent)] text-white shadow-sm'
          : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

interface ToolbarSelectProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  title?: string
  className?: string
}

function ToolbarSelect({
  options,
  value,
  onChange,
  disabled,
  title,
  className,
}: ToolbarSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      title={title}
      className={cn(
        'h-8 rounded-lg border-0 bg-transparent px-2 text-xs font-medium text-[var(--color-fg-muted)] transition-all duration-150',
        'hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-0',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

interface ColorPickerProps {
  colors: { value: string; label: string; color: string }[]
  currentColor: string
  onSelect: (color: string) => void
  disabled?: boolean
  title?: string
  icon: React.ReactNode
}

function ColorPicker({
  colors,
  currentColor,
  onSelect,
  disabled,
  title,
  icon,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        title={title}
        className={cn(
          'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-all duration-150',
          'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]',
          disabled && 'opacity-40 cursor-not-allowed'
        )}
      >
        <span className="relative">
          {icon}
          {currentColor && (
            <span
              className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
              style={{ backgroundColor: currentColor }}
            />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2 shadow-lg">
          <div className="grid grid-cols-4 gap-1">
            {colors.map((c) => (
              <button
                key={c.value || 'default'}
                type="button"
                onClick={() => {
                  onSelect(c.value)
                  setIsOpen(false)
                }}
                title={c.label}
                className={cn(
                  'h-6 w-6 rounded-md border-2 transition-all duration-150',
                  currentColor === c.value
                    ? 'border-[var(--color-accent)] scale-110'
                    : 'border-transparent hover:scale-110'
                )}
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper to get current font size from editor
function getCurrentFontSize(editor: Editor | null): string {
  if (!editor) return '1rem'
  const attrs = editor.getAttributes('textStyle')
  return attrs.fontSize || '1rem'
}

interface MiniDialogProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

function MiniDialog({ title, onClose, children }: MiniDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-2xl animate-scale-in">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-[var(--color-fg)]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-fg)] transition-colors"
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
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
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

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
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

function TextColorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12M6 15l6-12 6 12M8 13h8" />
    </svg>
  )
}

function HighlightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
    </svg>
  )
}

function AlignLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h10.5m-10.5 5.25h16.5" />
    </svg>
  )
}

function AlignCenterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M6.75 12h10.5M3.75 17.25h16.5" />
    </svg>
  )
}

function AlignRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M10.5 12h10.5M3.75 17.25h16.5" />
    </svg>
  )
}
