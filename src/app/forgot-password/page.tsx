import Link from 'next/link'
import { Card, CardContent } from '@/shared/ui/card'

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-[420px] border bg-card shadow-sm">
        <CardContent className="p-8 text-center">
          <p className="text-xl font-semibold text-foreground">Pops Industrial Coatings</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Password reset</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Password reset is handled by the shop administrator for this demo. Ask an admin
            to issue a new staff invitation or reset your account in Supabase.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
