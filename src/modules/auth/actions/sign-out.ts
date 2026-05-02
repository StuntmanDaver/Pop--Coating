'use server'
import { createClient } from '@/shared/db/server'
import { redirect } from 'next/navigation'

export async function signOutStaff() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/sign-in')
}
