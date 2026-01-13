'use client'

import { type ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'

export interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Dialog({ open, onClose, children, size = 'md' }: DialogProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={cn(
            'relative w-full transform overflow-hidden rounded-2xl',
            'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
            'shadow-2xl animate-scale-in',
            sizeClasses[size]
          )}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export interface DialogHeaderProps {
  children: ReactNode
  className?: string
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn('border-b border-[var(--color-border)] px-6 py-4', className)}>
      {children}
    </div>
  )
}

export interface DialogTitleProps {
  children: ReactNode
  className?: string
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={cn('text-lg font-bold text-[var(--color-fg)]', className)}>
      {children}
    </h2>
  )
}

export interface DialogDescriptionProps {
  children: ReactNode
  className?: string
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <p className={cn('mt-1 text-sm text-[var(--color-fg-muted)]', className)}>
      {children}
    </p>
  )
}

export interface DialogContentProps {
  children: ReactNode
  className?: string
}

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <div className={cn('px-6 py-5', className)}>
      {children}
    </div>
  )
}

export interface DialogFooterProps {
  children: ReactNode
  className?: string
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn('flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4', className)}>
      {children}
    </div>
  )
}
