import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './profile-form'

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    // If no profile, they likely haven't onboarded
    redirect('/onboarding')
  }

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <ProfileForm profile={profile} />
    </div>
  )
}
