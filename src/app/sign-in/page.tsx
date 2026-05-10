import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { signInStaff, requestCustomerMagicLink } from '@/modules/auth'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Alert, AlertDescription } from '@/shared/ui/alert'

async function handleOfficeSignIn(formData: FormData) {
  'use server'
  const result = await signInStaff({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if ('success' in result) {
    redirect('/')
  }
  redirect(`/sign-in?error=${encodeURIComponent(result.error)}`)
}

async function handlePortalMagicLink(formData: FormData) {
  'use server'
  await requestCustomerMagicLink({ email: formData.get('email') })
  redirect('/sign-in?sent=true')
}

interface SignInPageProps {
  searchParams: Promise<{ error?: string; sent?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [headersList, params] = await Promise.all([headers(), searchParams])
  const host = headersList.get('host') ?? ''
  const isPortal = host.startsWith('track.')

  if (isPortal) {
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
            <form action={handlePortalMagicLink} className="mt-6 flex flex-col gap-4">
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

  // Office sign-in (email + password)
  const errorMessage = params.error ? decodeURIComponent(params.error) : null

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
            Pops Industrial Coatings
          </p>

          {errorMessage && (
            <div className="mt-4">
              <Alert variant="destructive" role="alert">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </div>
          )}

          <form action={handleOfficeSignIn} className="mt-4 flex flex-col gap-4">
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
                aria-invalid={errorMessage ? 'true' : undefined}
                autoComplete="email"
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-sm text-foreground">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                aria-required="true"
                aria-invalid={errorMessage ? 'true' : undefined}
                autoComplete="current-password"
                className="w-full"
              />
            </div>
            <Button type="submit" variant="default" className="w-full mt-2">
              Sign In
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-2">
            <a
              href="/forgot-password"
              className="underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Forgot your password?
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
