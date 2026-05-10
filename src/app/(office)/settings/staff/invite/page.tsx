import Link from 'next/link'
import { InviteStaffForm } from './invite-staff-form'

export default function InviteStaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/settings/staff"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to staff
        </Link>
        <h2 className="mt-3 text-xl font-semibold tracking-tight">Invite staff member</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          An invitation email will be sent. You&apos;ll also see the invite link on the next
          screen as a fallback if the email doesn&apos;t arrive.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <InviteStaffForm />
      </div>
    </div>
  )
}
