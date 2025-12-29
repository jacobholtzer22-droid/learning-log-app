import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'

async function getSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

async function getUserProfile(username: string) {
  const supabase = await getSupabaseClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()
  
  return profile
}

async function getUserLogs(userId: string) {
  const supabase = await getSupabaseClient()
  
  const { data: logs } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_shared', true)
    .order('created_at', { ascending: false })
  
  return logs || []
}

async function getFollowStats(userId: string) {
  const supabase = await getSupabaseClient()
  
  const { count: followers } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)
  
  const { count: following } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)
  
  return { followers: followers || 0, following: following || 0 }
}

function LogCard({ log }: any) {
  const contentTypeColors: Record<string, string> = {
    book: 'bg-purple-100 text-purple-800',
    podcast: 'bg-green-100 text-green-800',
    article: 'bg-blue-100 text-blue-800',
    course: 'bg-orange-100 text-orange-800',
    video: 'bg-red-100 text-red-800',
    other: 'bg-gray-100 text-gray-800',
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${contentTypeColors[log.content_type]}`}>
              {log.content_type}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(log.consumed_date)}
            </span>
          </div>
          <h3 className="font-semibold text-lg text-gray-900">{log.title}</h3>
          {log.creator && (
            <p className="text-sm text-gray-600">by {log.creator}</p>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-gray-700 mb-1">Key Points:</p>
          <p className="text-gray-600 whitespace-pre-wrap">{log.key_points}</p>
        </div>

        <div>
          <p className="font-medium text-gray-700 mb-1">How I'll Use This:</p>
          <p className="text-gray-600 whitespace-pre-wrap">{log.practical_application}</p>
        </div>

        <div>
          <p className="font-medium text-gray-700 mb-1">Summary:</p>
          <p className="text-gray-600 whitespace-pre-wrap">{log.summary}</p>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Logged {formatDate(log.created_at)}
        </p>
      </div>
    </div>
  )
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const profile = await getUserProfile(username)
  
  if (!profile) {
    notFound()
  }
  
  const logs = await getUserLogs(profile.id)
  const stats = await getFollowStats(profile.id)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/search" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Search
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">@{profile.username}</h1>
              {profile.full_name && (
                <p className="text-gray-600 mt-1">{profile.full_name}</p>
              )}
            </div>
          </div>

          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-semibold text-gray-900">{stats.followers}</span>
              <span className="text-gray-600 ml-1">Followers</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">{stats.following}</span>
              <span className="text-gray-600 ml-1">Following</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">{logs.length}</span>
              <span className="text-gray-600 ml-1">Shared Logs</span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4">Shared Learning Logs</h2>
        
        {logs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No shared logs yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log: any) => (
              <LogCard key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}