'use client'

import * as React from 'react'
import {
  Dialog as RadixDialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog'

export interface SimpleDialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

/**
 * SimpleDialog provides backward-compatible API with onClose prop.
 * Use RadixDialog directly for advanced Radix UI Dialog features.
 */
export function SimpleDialog({
  open,
  onClose,
  children,
  className,
}: SimpleDialogProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <RadixDialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={className}>
        {children}
      </DialogContent>
    </RadixDialog>
  )
}

// Re-export sub-components for convenience
export { DialogHeader, DialogTitle, DialogDescription, DialogFooter }
