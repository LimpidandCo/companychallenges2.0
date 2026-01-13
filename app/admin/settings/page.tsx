import { Metadata } from 'next'
import { SettingsClient } from './settings-client'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your account and preferences',
}

// Force dynamic rendering since we use Clerk hooks
export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  return <SettingsClient />
}

