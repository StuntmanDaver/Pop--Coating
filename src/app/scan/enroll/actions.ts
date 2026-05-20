'use server'

import { redirect } from 'next/navigation'
import { enrollWorkstation } from '@/modules/settings'

export async function enrollWorkstationFromForm(formData: FormData) {
  const token = formData.get('token')
  await enrollWorkstation({ token })
  redirect('/scan')
}
