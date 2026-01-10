'use client'

import { useState, useEffect } from 'react'

// TEMPORARY: Match this with clerk-provider.tsx
const DEMO_MODE = true

interface DemoUserButtonProps {
  afterSignOutUrl?: string
}

function PlaceholderAvatar() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-medium text-[var(--color-accent-fg)]">
      D
    </div>
  )
}

export function DemoUserButton({ afterSignOutUrl }: DemoUserButtonProps) {
  const [UserButton, setUserButton] = useState<React.ComponentType<any> | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    // In demo mode, don't even try to load Clerk
    if (DEMO_MODE) {
      return
    }

    // Only try to load Clerk if not in demo mode
    import('@clerk/nextjs')
      .then((mod) => {
        setUserButton(() => mod.UserButton)
      })
      .catch(() => {
        setError(true)
      })
  }, [])

  // Demo mode or error: show placeholder
  if (DEMO_MODE || error || !UserButton) {
    return <PlaceholderAvatar />
  }

  // Clerk is available
  return (
    <UserButton
      afterSignOutUrl={afterSignOutUrl}
      appearance={{
        elements: {
          avatarBox: 'h-9 w-9',
        }
      }}
    />
  )
}
