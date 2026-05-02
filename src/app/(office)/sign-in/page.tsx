import { redirect } from 'next/navigation'
import { signInStaff } from '@/modules/auth'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Alert, AlertDescription } from '@/shared/ui/alert'

async function handleSignIn(formData: FormData) {
  'use server'
  const result = await signInStaff({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if ('success' in result) {
    redirect('/')
  }
  // Anti-enumeration-safe error returned; encode for searchParams
  redirect(`/sign-in?error=${encodeURIComponent(result.error)}`)
}

interface SignInPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  // searchParams is async in Next.js 16
  const params = await searchParams
  const errorMessage = params.error ? decodeURIComponent(params.error) : null

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-[400px] border shadow-sm bg-card rounded-[var(--radius)]">
        <CardContent className="p-8">
          {/* 1. Wordmark */}
          <p className="text-xl font-semibold text-foreground text-center">
            Pops Industrial Coatings
          </p>

          {/* 2. Heading */}
          <h1 className="text-2xl font-semibold text-foreground text-center mt-2">
            Sign in
          </h1>

          {/* 3. Subtext */}
          <p className="text-sm text-muted-foreground text-center mt-2">
            Pops Industrial Coatings
          </p>

          {/* Auth error Alert — destructive, role=alert, above form fields */}
          {errorMessage && (
            <div className="mt-4">
              <Alert variant="destructive" role="alert">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </div>
          )}

          <form action={handleSignIn} className="mt-4 flex flex-col gap-4">
            {/* 4. Email field */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="email"
                className="text-sm text-foreground"
              >
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

            {/* 5. Password field */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="password"
                className="text-sm text-foreground"
              >
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

            {/* 6. Sign In button — primary variant, full width */}
            <Button
              type="submit"
              variant="default"
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* 7. Forgot password link */}
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
