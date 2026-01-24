'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { FontFamily } from '@tiptap/extension-font-family'
import { Highlight } from '@tiptap/extension-highlight'
import { Underline } from '@tiptap/extension-underline'
import { cn } from '@/lib/utils/cn'

// Custom FontSize extension - TipTap doesn't have one built in
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
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
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
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})

export interface InlineRichEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  hint?: string
  className?: string
  minHeight?: string
  required?: boolean
  /** Optional image upload handler. When provided, enables file upload in addition to URL. */
  onUploadImage?: (file: File) => Promise<string>
}

// Font options - common web-safe fonts plus some modern choices
const FONT_FAMILIES = [
  // System defaults
  { label: 'Default', value: '' },
  { label: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
  // Sans-serif
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Lato', value: 'Lato, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  // Serif
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Palatino', value: '"Palatino Linotype", Palatino, serif' },
  { label: 'Book Antiqua', value: '"Book Antiqua", Palatino, serif' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
  { label: 'Merriweather', value: 'Merriweather, serif' },
  // Monospace
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Consolas', value: 'Consolas, monospace' },
  { label: 'Monaco', value: 'Monaco, monospace' },
  { label: 'Fira Code', value: '"Fira Code", monospace' },
  // Display/Decorative
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
  { label: 'Brush Script', value: '"Brush Script MT", cursive' },
  { label: 'Lucida Handwriting', value: '"Lucida Handwriting", cursive' },
]

// Font sizes
const FONT_SIZES = [
  { label: 'Default', value: '' },
  { label: '10px', value: '10px' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
  { label: '36px', value: '36px' },
  { label: '48px', value: '48px' },
]

// Preset colors for quick selection
const COLOR_PRESETS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
  '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
]

/**
 * WordPress-style rich text editor with full formatting controls.
 * Includes: fonts, sizes, colors, alignment, lists, links, images.
 */
export function InlineRichEditor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  label,
  hint,
  className,
  minHeight = '150px',
  required = false,
  onUploadImage,
}: InlineRichEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#000000')
  const [showImageMenu, setShowImageMenu] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const imageMenuRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:no-underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg my-4',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none px-4 py-3 focus:outline-none',
          'text-gray-900',
          '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2',
          '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2',
          '[&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-3 [&_h3]:mb-2',
          '[&_p]:my-2',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2',
          '[&_li]:my-1',
          '[&_a]:text-blue-600 [&_a]:underline',
          '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600',
          '[&_.ProseMirror-placeholder]:text-gray-400'
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  // Close color picker and image menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false)
      }
      if (imageMenuRef.current && !imageMenuRef.current.contains(event.target as Node)) {
        setShowImageMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href || ''
    const url = window.prompt(
      'Enter URL:\n\n• External: https://example.com\n• Internal assignment: /a/assignment-slug\n• Internal challenge: /c/challenge-slug',
      previousUrl
    )
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImageFromUrl = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
    setShowImageMenu(false)
  }, [editor])

  const handleImageFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor || !onUploadImage) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setIsUploading(true)
    setShowImageMenu(false)

    try {
      const url = await onUploadImage(file)
      editor.chain().focus().setImage({ src: url }).run()
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
      // Reset input so the same file can be selected again
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }, [editor, onUploadImage])

  const handleImageButtonClick = useCallback(() => {
    if (onUploadImage) {
      // Show menu with upload and URL options
      setShowImageMenu(!showImageMenu)
    } else {
      // Just prompt for URL
      addImageFromUrl()
    }
  }, [onUploadImage, showImageMenu, addImageFromUrl])

  const setFontFamily = useCallback((fontFamily: string) => {
    if (!editor) return
    if (fontFamily) {
      editor.chain().focus().setFontFamily(fontFamily).run()
    } else {
      editor.chain().focus().unsetFontFamily().run()
    }
  }, [editor])

  const setFontSize = useCallback((size: string) => {
    if (!editor) return
    if (size) {
      // Use our custom FontSize extension command
      ;(editor.chain().focus() as any).setFontSize(size).run()
    } else {
      // Reset to default
      ;(editor.chain().focus() as any).unsetFontSize().run()
    }
  }, [editor])

  const setTextColor = useCallback((color: string) => {
    if (!editor) return
    editor.chain().focus().setColor(color).run()
    setShowColorPicker(false)
  }, [editor])

  const currentColor = editor?.getAttributes('textStyle').color || '#000000'

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="rounded-lg border border-gray-300 bg-white overflow-visible focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {/* Toolbar Row 1: Formatting */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 px-2 py-1.5 bg-gray-50">
          {/* Font Family */}
          <select
            value={editor?.getAttributes('textStyle').fontFamily || ''}
            onChange={(e) => setFontFamily(e.target.value)}
            className="h-7 rounded border border-gray-200 bg-white px-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
            title="Font Family"
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>

          {/* Font Size */}
          <select
            value={editor?.getAttributes('textStyle').fontSize || ''}
            onChange={(e) => setFontSize(e.target.value)}
            className="h-7 rounded border border-gray-200 bg-white px-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
            title="Font Size"
          >
            {FONT_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor?.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor?.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor?.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            H3
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            active={editor?.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <BoldIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            active={editor?.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <ItalicIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            active={editor?.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            active={editor?.isActive('strike')}
            title="Strikethrough"
          >
            <StrikethroughIcon className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text Color */}
          <div className="relative" ref={colorPickerRef}>
            <ToolbarButton
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Text Color"
            >
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold">A</span>
                <div 
                  className="w-4 h-1 rounded-sm mt-0.5" 
                  style={{ backgroundColor: currentColor }}
                />
              </div>
            </ToolbarButton>
            
            {showColorPicker && (
              <div className="absolute top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-48 right-0 md:left-0 md:right-auto">
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTextColor(color)}
                      className={cn(
                        "w-8 h-8 rounded border-2 transition-transform hover:scale-110",
                        currentColor === color ? "border-blue-500" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 h-8 px-2 text-xs border border-gray-200 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setTextColor(customColor)}
                    className="h-8 px-2 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Highlight */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
            active={editor?.isActive('highlight')}
            title="Highlight"
          >
            <HighlightIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Toolbar Row 2: Structure & Insert */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 px-2 py-1.5 bg-gray-50">
          {/* Lists */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            active={editor?.isActive('bulletList')}
            title="Bullet List"
          >
            <BulletListIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive('orderedList')}
            title="Numbered List"
          >
            <OrderedListIcon className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            active={editor?.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeftIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            active={editor?.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenterIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            active={editor?.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRightIcon className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Insert */}
          <ToolbarButton
            onClick={setLink}
            active={editor?.isActive('link')}
            title="Insert Link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          {/* Image Insert */}
          <div className="relative" ref={imageMenuRef}>
            <ToolbarButton
              onClick={handleImageButtonClick}
              title={onUploadImage ? "Insert Image" : "Insert Image (URL)"}
            >
              {isUploading ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </ToolbarButton>

            {/* Hidden file input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileSelect}
            />

            {/* Image menu dropdown */}
            {showImageMenu && onUploadImage && (
              <div className="absolute top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-40 left-0">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <UploadIcon className="h-4 w-4" />
                  Upload image
                </button>
                <button
                  type="button"
                  onClick={addImageFromUrl}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  From URL
                </button>
              </div>
            )}
          </div>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            active={editor?.isActive('blockquote')}
            title="Quote"
          >
            <QuoteIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <HorizontalRuleIcon className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Clear Formatting */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
            title="Clear Formatting"
          >
            <ClearFormatIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} />
      </div>

      {hint && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  )
}

// Helper Components

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick?: () => void
  active?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-gray-200" />
}

// Icons

function BoldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6zM6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
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

function UnderlineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 5v6a5 5 0 0 0 10 0V5M5 19h14" />
    </svg>
  )
}

function StrikethroughIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 12H7m10 0a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4m12 0a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4" />
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

function AlignLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h12M3 18h18" />
    </svg>
  )
}

function AlignCenterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M3 18h18" />
    </svg>
  )
}

function AlignRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 12h12M3 18h18" />
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

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  )
}

function HighlightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
    </svg>
  )
}

function HorizontalRuleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  )
}

function ClearFormatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z" />
    </svg>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn(className, 'animate-spin')} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}
