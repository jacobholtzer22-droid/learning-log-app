import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { BottomNav } from '../../Components/BottomNav'
import { DeleteLogButton } from '../../Components/DeleteLogButton'
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

async function getUserLogs() {
  const supabase = await getSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', user.id)
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

export default async function LibraryPage() {
  const { data: logs } = await getUserLogs()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20 max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-amber-800">My Library</h1>
          <Link 
            href="/create"
            className="text-lime-600 hover:text-lime-700 font-medium text-sm"
          >
            + New Log
          </Link>
        </div>

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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No logs yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start logging what you learn!
            </p>
            <div className="mt-6">
              <Link href="/create">
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-lime-600 hover:bg-lime-700">
                  Create Your First Log
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log: any) => (
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
                      {log.is_shared && (
                        <span className="text-xs px-2 py-1 rounded-full bg-lime-50 text-lime-700">
                          Shared
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">{log.title}</h3>
                    {log.creator && (
                      <p className="text-sm text-gray-600">by {log.creator}</p>
                    )}
                  </div>
                  <DeleteLogButton logId={log.id} />
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