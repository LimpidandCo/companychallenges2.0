'use client'

import type { EditorContent } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'
import { FloatingInfoButton, InfoButtonConfig } from '@/components/ui/rich-editor/info-button'

interface ContentRendererProps {
  /** Pre-rendered HTML from the editor */
  html?: string | null
  /** Legacy HTML content (for backward compatibility) */
  legacyHtml?: string | null
  /** Additional CSS classes */
  className?: string
  /** Prose styling variant */
  variant?: 'default' | 'compact' | 'large'
}

/**
 * Renders rich content from the advanced editor.
 * Uses pre-rendered HTML for efficient, consistent rendering.
 */
export function ContentRenderer({
  html,
  legacyHtml,
  className,
  variant = 'default',
}: ContentRendererProps) {
  const htmlContent = html || legacyHtml

  if (!htmlContent) {
    return null
  }

  return (
    <div
      className={cn(
        'prose max-w-none',
        // Base text color
        'text-gray-900',
        // Variant sizes
        variant === 'compact' && 'prose-sm',
        variant === 'large' && 'prose-lg',
        // Headings
        'prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900',
        'prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-0',
        'prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8',
        'prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-6',
        // Paragraphs - relaxed spacing
        'prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4',
        // Links
        'prose-a:text-[var(--color-accent)] prose-a:no-underline hover:prose-a:underline',
        // Strong/Em
        'prose-strong:text-gray-900 prose-strong:font-semibold',
        'prose-em:text-gray-600',
        // Code
        'prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-gray-800',
        'prose-pre:bg-gray-100 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:p-4',
        // Blockquotes
        'prose-blockquote:border-l-4 prose-blockquote:border-[var(--color-accent)] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:not-italic',
        // Lists - explicit styling to ensure bullets/numbers always show
        'prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4 prose-ul:ml-4',
        'prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4 prose-ol:ml-4',
        'prose-li:text-gray-700 prose-li:my-1 prose-li:pl-1',
        '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:ml-4 [&_ul]:my-4',
        '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:ml-4 [&_ol]:my-4',
        '[&_li]:my-1 [&_li]:text-gray-700',
        // Images
        'prose-img:rounded-xl prose-img:shadow-lg prose-img:my-6',
        // Horizontal rules
        'prose-hr:border-gray-200 prose-hr:my-8',
        // Tables
        'prose-table:w-full prose-table:border-collapse',
        'prose-th:bg-gray-50 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-gray-200 prose-th:text-gray-900',
        'prose-td:px-4 prose-td:py-3 prose-td:border prose-td:border-gray-200 prose-td:text-gray-700',
        // Embedded iframes (YouTube, Vimeo, etc.)
        '[&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:shadow-lg [&_iframe]:my-6',
        // Video elements
        '[&_video]:w-full [&_video]:rounded-xl [&_video]:shadow-lg [&_video]:my-6',
        // Embedded content wrapper (for responsive embeds)
        '[&_.embed-container]:relative [&_.embed-container]:pb-[56.25%] [&_.embed-container]:h-0 [&_.embed-container]:overflow-hidden',
        '[&_.embed-container_iframe]:absolute [&_.embed-container_iframe]:top-0 [&_.embed-container_iframe]:left-0 [&_.embed-container_iframe]:w-full [&_.embed-container_iframe]:h-full',
        className
      )}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}

/**
 * Helper to extract InfoButtonConfig from JSON content
 */
function extractInfoButtonConfig(json: EditorContent | null | undefined): InfoButtonConfig | null {
  if (!json || !json.attributes) return null
  
  const stored = json.attributes.infoButtonConfig
  if (typeof stored === 'string') {
    try {
      const config = JSON.parse(stored) as InfoButtonConfig
      if (config.enabled) return config
    } catch {
      return null
    }
  }
  return null
}

/**
 * Wrapper for assignment instructions
 */
export function InstructionsRenderer({
  assignment,
  className,
}: {
  assignment: {
    instructions_html?: string | null
    instructions?: string | null
    instructions_json?: EditorContent | null
  }
  className?: string
}) {
  if (!assignment.instructions_html && !assignment.instructions) {
    return null
  }

  // Extract background from JSON (using new pageBackgroundColor)
  const json = assignment.instructions_json
  const pageBackgroundColor = json?.attributes?.pageBackgroundColor as string | undefined

  if (pageBackgroundColor && pageBackgroundColor !== '#ffffff') {
    return (
      <div 
        className="rounded-2xl p-6 sm:p-8"
        style={{ backgroundColor: pageBackgroundColor }}
      >
        <ContentRenderer
          html={assignment.instructions_html}
          legacyHtml={assignment.instructions}
          className={className}
        />
      </div>
    )
  }

  return (
    <ContentRenderer
      html={assignment.instructions_html}
      legacyHtml={assignment.instructions}
      className={className}
    />
  )
}

/**
 * Wrapper for assignment content 
 */
export function AssignmentContentRenderer({
  assignment,
  className,
}: {
  assignment: {
    content_html?: string | null
    content?: string | null
    content_json?: EditorContent | null
  }
  className?: string
}) {
  if (!assignment.content_html && !assignment.content) {
    return null
  }

  const json = assignment.content_json
  const pageBackgroundColor = json?.attributes?.pageBackgroundColor as string | undefined
  const infoButtonConfig = extractInfoButtonConfig(json)

  // Render with page background if set
  if (pageBackgroundColor && pageBackgroundColor !== '#ffffff') {
    return (
      <div className="relative">
        <div 
          className="rounded-2xl p-6 sm:p-8 shadow-sm"
          style={{ backgroundColor: pageBackgroundColor }}
        >
          <ContentRenderer
            html={assignment.content_html}
            legacyHtml={assignment.content}
            className={className}
            variant="large"
          />
        </div>
        {infoButtonConfig && <FloatingInfoButton config={infoButtonConfig} preview />}
      </div>
    )
  }

  return (
    <>
      <ContentRenderer
        html={assignment.content_html}
        legacyHtml={assignment.content}
        className={className}
        variant="large"
      />
      {infoButtonConfig && <FloatingInfoButton config={infoButtonConfig} preview />}
    </>
  )
}

/**
 * Wrapper for challenge description
 */
export function ChallengeDescriptionRenderer({
  challenge,
  className,
}: {
  challenge: {
    description_html?: string | null
    description?: string | null
    description_json?: EditorContent | null
    brand_color?: string | null
  }
  className?: string
}) {
  if (!challenge.description_html && !challenge.description) {
    return null
  }

  const json = challenge.description_json
  const pageBackgroundColor = json?.attributes?.pageBackgroundColor as string | undefined
  const infoButtonConfig = extractInfoButtonConfig(json)

  // Use page background color if set
  if (pageBackgroundColor && pageBackgroundColor !== '#ffffff') {
    return (
      <div className="relative">
        <div 
          className="rounded-2xl p-6 sm:p-8 shadow-sm"
          style={{ backgroundColor: pageBackgroundColor }}
        >
          <ContentRenderer
            html={challenge.description_html}
            legacyHtml={challenge.description}
            className={className}
          />
        </div>
        {infoButtonConfig && <FloatingInfoButton config={infoButtonConfig} preview />}
      </div>
    )
  }

  return (
    <>
      <ContentRenderer
        html={challenge.description_html}
        legacyHtml={challenge.description}
        className={className}
      />
      {infoButtonConfig && <FloatingInfoButton config={infoButtonConfig} preview />}
    </>
  )
}
