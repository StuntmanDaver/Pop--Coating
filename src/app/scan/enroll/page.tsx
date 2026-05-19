import { enrollWorkstationFromForm } from './actions'

interface EnrollPageProps {
  searchParams: Promise<{ token?: string; error?: string }>
}

export default async function ScanEnrollPage({ searchParams }: EnrollPageProps) {
  const params = await searchParams
  const token = params.token?.trim() ?? ''

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-50">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <p className="text-xs uppercase tracking-widest text-zinc-400">Scan station setup</p>
        <h1 className="mt-3 text-2xl font-semibold">Enroll this iPad</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          Open the one-time workstation enrollment URL on the iPad assigned to this
          station. After enrollment, the device can use the scan flow.
        </p>

        <form action={enrollWorkstationFromForm} className="mt-6 space-y-4">
          <div>
            <label htmlFor="token" className="mb-1 block text-sm font-medium text-zinc-200">
              Enrollment token
            </label>
            <input
              id="token"
              name="token"
              type="text"
              required
              minLength={16}
              maxLength={128}
              defaultValue={token}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            />
          </div>
          <button
            type="submit"
            className="min-h-11 w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
          >
            Enroll workstation
          </button>
        </form>
      </section>
    </main>
  )
}
