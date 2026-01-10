'use client'

import { Fragment, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Dialog({ open, onClose, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={cn(
            'relative w-full max-w-lg transform overflow-hidden rounded-[var(--radius-lg)]',
            'bg-[var(--color-bg)] shadow-[var(--shadow-xl)]',
            'transition-all'
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
    <h2 className={cn('text-lg font-semibold text-[var(--color-fg)]', className)}>
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
    <div className={cn('px-6 py-4', className)}>
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
