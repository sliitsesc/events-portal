import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check their role in the database
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_volunteer')
    .eq('id', user.id)
    .single()

  // The Security Gate Logic:
  // If they are NOT an admin AND NOT a volunteer, kick them back to the student view.
  // Note: We allow Admins in here too, so the Secretary can also scan tickets if it gets busy!
  if (!profile?.is_admin && !profile?.is_volunteer) {
    redirect('/events')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* A simple, distinct top navigation bar just for the scanning app */}
      <header className="bg-orange-600 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="font-bold text-xl">SESC Scanner Team</h1>
          <span className="text-sm opacity-90 hidden sm:inline-block">Logged in as: {user.email}</span>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}