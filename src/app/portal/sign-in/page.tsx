import { redirect } from 'next/navigation'
import { requestCustomerMagicLink } from '@/modules/auth'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

async function handleMagicLink(formData: FormData) {
  'use server'
  await requestCustomerMagicLink({ email: formData.get('email') })
  // Anti-enumeration: always redirect to success screen regardless of email existence
  redirect('/sign-in?sent=true')
}

interface PortalSignInPageProps {
  searchParams: Promise<{ sent?: string; error?: string }>
}

export default async function PortalSignInPage({ searchParams }: PortalSignInPageProps) {
  const params = await searchParams

  if (params.sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-[400px] border shadow-sm bg-card rounded-[var(--radius)]">
          <CardContent className="p-8 text-center">
            <p className="text-xl font-semibold text-foreground">
              Pops Industrial Coatings
            </p>
            <h1 className="text-2xl font-semibold text-foreground mt-2">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              If an account exists for that address, we sent a sign-in link.
              Check your email inbox.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              <a
                href="/sign-in"
                className="underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Try a different email address
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-[400px] border shadow-sm bg-card rounded-[var(--radius)]">
        <CardContent className="p-8">
          <p className="text-xl font-semibold text-foreground text-center">
            Pops Industrial Coatings
          </p>
          <h1 className="text-2xl font-semibold text-foreground text-center mt-2">
            Sign in
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Enter your email to receive a magic sign-in link.
          </p>

          <form action={handleMagicLink} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-sm text-foreground">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                aria-required="true"
                autoComplete="email"
                className="w-full"
                placeholder="you@example.com"
              />
            </div>

            <Button type="submit" variant="default" className="w-full mt-2">
              Send magic link
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
