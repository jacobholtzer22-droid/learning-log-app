'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function Button({ children, variant = 'primary', ...props }: any) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  }
  
  return (
    <button
      className={`w-full px-4 py-2 font-medium rounded-lg transition-colors ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ followers: 0, following: 0, logs: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profile)

        // Get follower count
        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id)

        // Get following count
        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id)

        // Get log count
        const { count: logs } = await supabase
          .from('logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        setStats({
          followers: followers || 0,
          following: following || 0,
          logs: logs || 0,
        })
      }
      
      setLoading(false)
    }

    loadProfile()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20 max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Username</label>
            <p className="text-lg text-gray-900">@{profile?.username || 'N/A'}</p>
          </div>

          {profile?.full_name && (
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="text-lg text-gray-900">{profile.full_name}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-lg text-gray-900">{user?.email}</p>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-semibold text-gray-900">{stats.followers}</span>
                <span className="text-gray-600 ml-1">Followers</span>
              </div>
              <Link href="/following" className="hover:text-blue-600">
                <span className="font-semibold text-gray-900">{stats.following}</span>
                <span className="text-gray-600 ml-1">Following</span>
              </Link>
              <div>
                <span className="font-semibold text-gray-900">{stats.logs}</span>
                <span className="text-gray-600 ml-1">Total Logs</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-1">Export Your Data</h3>
            <p className="text-sm text-blue-700 mb-3">
              Download all your learning logs as JSON
            </p>
            <Button
              variant="secondary"
              onClick={async () => {
                const { data } = await supabase
                  .from('logs')
                  .select('*')
                  .eq('user_id', user.id)
                
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `learning-logs-${new Date().toISOString()}.json`
                a.click()
              }}
            >
              Export Data
            </Button>
          </div>

          <Button
            variant="secondary"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}