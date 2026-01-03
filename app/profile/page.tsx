'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BottomNav } from '../../Components/BottomNav'
import { Spinner } from '../../Components/Spinner'
import { useToast } from '../../Components/Toast'

function Button({ children, variant = 'primary', ...props }: any) {
  const variants = {
    primary: 'bg-lime-600 text-white hover:bg-lime-700',
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
  const { showToast } = useToast()
  
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

        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id)

        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id)

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
    showToast('Signed out')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Spinner size="lg" />
        <p className="mt-4 text-amber-700">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20 max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/logo.png"
            alt="LearningLogs"
            width={40}
            height={40}
          />
          <h1 className="text-2xl font-bold text-amber-800">Profile</h1>
        </div>

        <div className="bg-white rounded-lg border border-lime-200 p-6 space-y-4 mb-6">
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
              <Link href="/following" className="hover:text-lime-600">
                <span className="font-semibold text-gray-900">{stats.followers}</span>
                <span className="text-gray-600 ml-1">Followers</span>
              </Link>
              <Link href="/following" className="hover:text-lime-600">
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
          <Link
            href="/notifications"
            className="block bg-lime-50 border border-lime-200 rounded-lg p-4 hover:bg-lime-100 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-amber-800">Notifications</h3>
                  <p className="text-sm text-amber-700">See who liked, commented, or followed you</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
            <h3 className="font-medium text-amber-800 mb-1">Import Your Data</h3>
            <p className="text-sm text-amber-700 mb-3">
              Import from another source (Excel, Goodreads, etc.)
            </p>
            <Button
              variant="secondary"
              onClick={() => router.push('/import')}
            >
              Import Data
            </Button>
          </div>

          <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
            <h3 className="font-medium text-amber-800 mb-1">Export Your Data</h3>
            <p className="text-sm text-amber-700 mb-3">
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
                showToast('Data exported!')
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
      <BottomNav />
    </div>
  )
}