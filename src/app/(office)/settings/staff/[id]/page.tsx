import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/shared/db/server'
import { Badge } from '@/shared/ui/badge'
import { EditStaffForm } from './edit-staff-form'
import { CopyLinkBox } from '../../_components/copy-link-box'
import type { StaffListItem } from '@/modules/settings'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ updated?: string; invite_link?: string; invited?: string }>
}

export default async function StaffDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff')
    .select('id, email, name, role, phone, is_active, created_at')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const staff = data as StaffListItem

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/settings/staff"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            ← Back to staff
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">{staff.name}</h2>
            {staff.is_active ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="warning">Inactive</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{staff.email}</p>
        </div>
      </div>

      {sp.updated === 'true' ? (
        <div role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Staff member updated successfully.
        </div>
      ) : null}

      {sp.invite_link ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            Invitation link — save this now
          </p>
          <p className="mt-1 text-sm text-amber-800">
            This is the fallback if the invitation email doesn&apos;t arrive. Copy it before
            navigating away — it will not be shown again from this UI.
          </p>
          <div className="mt-3">
            <CopyLinkBox label="Invitation link" value={sp.invite_link} />
          </div>
        </div>
      ) : sp.invited === 'true' ? (
        <div role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Invitation email sent. The staff member should receive it shortly.
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-6">
        <EditStaffForm staff={staff} />
      </div>
    </div>
  )
}
