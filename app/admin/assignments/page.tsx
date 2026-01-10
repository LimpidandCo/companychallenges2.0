import { getAssignments } from '@/lib/actions/assignments'
import { AssignmentsPageClient } from './page-client'

export default async function AssignmentsPage() {
  const result = await getAssignments()

  const assignments = result.success ? result.data : []
  const error = result.success ? null : result.error

  return <AssignmentsPageClient initialAssignments={assignments} initialError={error} />
}
