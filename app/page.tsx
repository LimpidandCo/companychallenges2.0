import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to admin dashboard by default
  // Public challenge/assignment access happens via /c/[slug] and /a/[slug]
  redirect('/admin')
}
