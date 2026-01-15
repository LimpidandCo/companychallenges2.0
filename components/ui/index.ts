import type { VariantProps } from 'class-variance-authority'
import type { buttonVariants } from './button'

// Button with derived props type
export { Button, buttonVariants } from './button'
export type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }

// SimpleInput provides backward-compatible label/hint/error API
export { SimpleInput as Input, type SimpleInputProps as InputProps } from './simple-input'
// Also export the raw input for advanced use cases
export { Input as BaseInput } from './input'

// Textarea with derived props type
export { Textarea } from './textarea'
export type TextareaProps = React.ComponentProps<'textarea'>
// SimpleSelect provides backward-compatible options-based API
export { SimpleSelect as Select, type SimpleSelectProps as SelectProps, type SimpleSelectOption } from './simple-select'
// Also export the compositional Radix Select for advanced use cases
export {
  Select as RadixSelect,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select'
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'
export { Badge, type BadgeProps } from './badge'
export { Spinner, type SpinnerProps } from './spinner'
// SimpleDialog provides backward-compatible onClose API
export { SimpleDialog as Dialog, type SimpleDialogProps as DialogProps } from './simple-dialog'
// Also export the compositional Radix Dialog for advanced use cases
export {
  Dialog as RadixDialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './dialog'
export { RichTextEditor, type RichTextEditorProps } from './rich-text-editor'
export { TagInput, type TagInputProps } from './tag-input'
export { Skeleton, SkeletonText, SkeletonCard, SkeletonList, SkeletonTable } from './skeleton'
