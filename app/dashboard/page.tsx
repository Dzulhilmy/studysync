import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')
    
  // Safely get the role and force it to lowercase
  const rawRole = (session.user as any)?.role || ''
  const role = String(rawRole).toLowerCase().trim()

  console.log('🔍 [Dashboard] User logged in with role:', rawRole)

  if (role === 'admin') redirect('/admin')
  if (role === 'teacher') redirect('/teacher')
  if (role === 'student') redirect('/student')

  console.log('❌ [Dashboard] Unrecognized role, redirecting to login...')

  redirect('/login')
}