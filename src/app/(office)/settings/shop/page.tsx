import { createClient } from '@/shared/db/server'
import { ShopSettingsForm } from './shop-settings-form'

interface PageProps {
  searchParams: Promise<{ saved?: string }>
}

export default async function ShopSettingsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shop_settings')
    .select(
      'timezone, currency, job_number_prefix, brand_color_hex, default_due_days, tablet_inactivity_hours, pin_mode, is_first_job_created'
    )
    .single()

  if (error || !data) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Failed to load shop settings: {error?.message ?? 'not found'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Shop settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your shop&apos;s operational defaults.
        </p>
      </div>

      {sp.saved === 'true' ? (
        <div role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Settings saved successfully.
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-6">
        <ShopSettingsForm settings={data} />
      </div>
    </div>
  )
}
