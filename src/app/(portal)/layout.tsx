import { requireCustomer } from '@/shared/auth-helpers'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireCustomer()
  return <>{children}</>
}
