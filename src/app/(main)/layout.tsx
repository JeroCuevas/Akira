import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/shared/components'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen">
      <Navbar userEmail={user?.email} />
      <main className="pt-16 px-4 py-8 container mx-auto">
        {children}
      </main>
    </div>
  )
}
