import type { Route } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/shared/db/server'

export default async function RootPage() {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const isPortal = host.startsWith('track.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')
  redirect((isPortal ? '/my' : '/dashboard') as Route)
}
