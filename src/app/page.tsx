import { redirect } from 'next/navigation'

// Root page — redirects to sign-in.
// The (office) and (portal) route groups handle domain-specific routing.
export default function RootPage() {
  redirect('/sign-in')
}
