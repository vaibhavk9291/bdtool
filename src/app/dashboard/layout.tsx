import { requireUser } from '@/lib/auth'
import { AppShell } from '@/components/AppShell'
import { InstallPrompt } from '@/components/InstallPrompt'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser()
  
  return (
    <AppShell user={session}>
      {children}
      <InstallPrompt />
    </AppShell>
  )
}
