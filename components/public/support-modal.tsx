'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ContentRenderer } from './content-renderer'

interface SupportModalProps {
  supportInfo?: string | null
  contactInfo?: string | null
  passwordInstructions?: string | null
  brandColor?: string
  /** Trigger variant - icon only or text button */
  variant?: 'icon' | 'button'
  /** Custom label for the button variant */
  label?: string
  /** Custom title for the modal */
  title?: string
}

export function SupportModal({
  supportInfo,
  contactInfo,
  passwordInstructions,
  brandColor = '#ff6b4a',
  variant = 'icon',
  label = 'Info',
  title = 'Support',
}: SupportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure we only render portal on client
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  // Don't render if there's nothing to show
  const hasContent = supportInfo || contactInfo || passwordInstructions
  if (!hasContent) return null

  const modalContent = isOpen ? (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        style={{ zIndex: 9999 }}
      />
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden transform transition-all duration-200"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          style={{ backgroundColor: `${brandColor}08` }}
        >
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
            type="button"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
          {/* Support Info - Rich Content */}
          {supportInfo && (
            <div>
              <ContentRenderer 
                html={supportInfo} 
                variant="default"
              />
            </div>
          )}

          {/* Contact Info Section */}
          {contactInfo && (
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ContactIcon className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700">Contact</h3>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{contactInfo}</p>
            </div>
          )}

          {/* Password Instructions Section */}
          {passwordInstructions && (
            <div 
              className="rounded-xl p-4 border"
              style={{ 
                borderColor: `${brandColor}30`,
                backgroundColor: `${brandColor}08`
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <LockIcon className="h-4 w-4" style={{ color: brandColor }} />
                <h3 className="text-sm font-semibold" style={{ color: brandColor }}>
                  Password Access
                </h3>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{passwordInstructions}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      {/* Trigger Button */}
      {variant === 'icon' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-105"
          style={{ 
            backgroundColor: `${brandColor}15`,
            color: brandColor 
          }}
          aria-label="Support information"
          type="button"
        >
          <InfoIcon className="h-5 w-5" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
          style={{ 
            backgroundColor: `${brandColor}15`,
            color: brandColor 
          }}
          type="button"
        >
          <InfoIcon className="h-4 w-4" />
          {label}
        </button>
      )}

      {/* Portal the modal to document body */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function ContactIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  )
}

function LockIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}
