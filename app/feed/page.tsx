import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { BottomNav } from '../../Components/BottomNav'
import { ReactionButton } from '../../Components/ReactionButton'
import { CommentSection } from '../../Components/CommentSection'

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

async function getFeedLogs() {
  const supabase = await getSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = follows?.map(f => f.following_id) || []

  if (followingIds.length === 0) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('logs')
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_url
      )
    `)
    .in('user_id', followingIds)
    .eq('is_shared', true)
    .order('created_at', { ascending: false })

  return { data, error }
}

const contentTypeColors: Record<string, string> = {
  book: 'bg-purple-100 text-purple-800',
  podcast: 'bg-green-100 text-green-800',
  article: 'bg-blue-100 text-blue-800',
  course: 'bg-orange-100 text-orange-800',
  video: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800',
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function FeedPage() {
  const { data: logs } = await getFeedLogs()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20 max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-6">Feed</h1>

        {!logs || logs.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-amber-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No posts yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Follow friends to see their shared learning logs here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(logs) && logs.map((log: any) => (
              <div key={log.id} className="bg-white rounded-lg border border-lime-200 shadow-sm p-4 space-y-3">
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
                    {log.profiles && (
                      <Link 
                        href={`/user/${log.profiles.username}`}
                        className="text-sm text-lime-600 hover:text-lime-700 mt-1 inline-block"
                      >
                        @{log.profiles.username}
                      </Link>
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Logged {formatDate(log.created_at)}
                    </p>
                    <ReactionButton logId={log.id} />
                  </div>
                  <CommentSection logId={log.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}