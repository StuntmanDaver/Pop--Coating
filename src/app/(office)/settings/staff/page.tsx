import Link from 'next/link'
import { listStaff } from '@/modules/settings'
import type { StaffListItem } from '@/modules/settings'
import { Badge } from '@/shared/ui/badge'

interface PageProps {
  searchParams: Promise<{ include_inactive?: string }>
}

export default async function StaffListPage({ searchParams }: PageProps) {
  const params = await searchParams
  const includeInactive = params.include_inactive === 'true'

  const staff = await listStaff({ include_inactive: includeInactive })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Staff</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {staff.length === 0
              ? 'No staff members found.'
              : `${staff.length} ${staff.length === 1 ? 'member' : 'members'}.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ToggleInactive includeInactive={includeInactive} />
          <Link
            href="/settings/staff/invite"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Invite staff
          </Link>
        </div>
      </div>

      {staff.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center">
          <p className="text-sm text-muted-foreground">
            No staff yet.{' '}
            <Link href="/settings/staff/invite" className="text-link underline-offset-4 hover:underline">
              Invite the first one
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/5">
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Email</th>
                <th scope="col" className="px-4 py-3 font-medium">Role</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.map((member) => (
                <StaffRow key={member.id} member={member} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StaffRow({ member }: { member: StaffListItem }) {
  return (
    <tr className="hover:bg-muted/5">
      <td className="px-4 py-3 font-medium text-foreground">
        <Link href={`/settings/staff/${member.id}`} className="hover:underline">
          {member.name}
        </Link>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
      <td className="px-4 py-3">
        <Badge variant="muted">{member.role}</Badge>
      </td>
      <td className="px-4 py-3">
        {member.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="warning">Inactive</Badge>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/settings/staff/${member.id}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Edit
        </Link>
      </td>
    </tr>
  )
}

function ToggleInactive({ includeInactive }: { includeInactive: boolean }) {
  return (
    <Link
      href={includeInactive ? '/settings/staff' : '/settings/staff?include_inactive=true'}
      className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
    >
      {includeInactive ? 'Hide inactive' : 'Show inactive'}
    </Link>
  )
}
