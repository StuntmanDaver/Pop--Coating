import { redirect } from 'next/navigation'
import { createClient } from '@/shared/db/server'

export default async function OfficeHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')
  redirect('/dashboard')
}
