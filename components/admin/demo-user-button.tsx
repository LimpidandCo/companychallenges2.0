'use client'

interface DemoUserButtonProps {
  afterSignOutUrl?: string
}

export function DemoUserButton({ afterSignOutUrl }: DemoUserButtonProps) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-medium text-[var(--color-accent-fg)]">
      A
    </div>
  )
}
