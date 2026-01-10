import { getClients } from '@/lib/actions/clients'
import { ClientsPageClient } from './page-client'

export default async function ClientsPage() {
  const result = await getClients()

  const clients = result.success ? result.data : []
  const error = result.success ? null : result.error

  return <ClientsPageClient initialClients={clients} initialError={error} />
}
