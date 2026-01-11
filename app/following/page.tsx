import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BottomNav } from '../../Components/BottomNav'
import { UnfollowButton } from '../../Components/UnfollowButton'

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

async function getFollowingData() {
  const supabase = await getSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { following: [], followers: [], currentUserId: null }

  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = followingData?.map(f => f.following_id) || []

  let following: any[] = []
  if (followingIds.length > 0) {
    const { data: followingProfiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', followingIds)
    
    following = followingProfiles || []
  }

  const { data: followersData } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', user.id)

  const followerIds = followersData?.map(f => f.follower_id) || []

  let followers: any[] = []
  if (followerIds.length > 0) {
    const { data: followerProfiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', followerIds)
    
    followers = followerProfiles || []
  }

  return { following, followers, currentUserId: user.id }
}

export default async function FollowingPage() {
  const { following, followers, currentUserId } = await getFollowingData()

  if (!currentUserId) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20 max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-6">Connections</h1>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Following ({following.length})
          </h2>
          
          {following.length === 0 ? (
            <div className="bg-white rounded-lg border border-lime-200 p-6 text-center">
              <p className="text-gray-500">You're not following anyone yet</p>
              <Link href="/search" className="text-lime-600 hover:text-lime-700 text-sm mt-2 inline-block">
                Find people to follow
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {following.map((user: any) => (
                <div key={user.id} className="bg-white rounded-lg border border-lime-200 p-4 flex items-center justify-between">
                  <Link href={`/user/${user.username}`} className="flex-1">
                    <p className="font-medium text-gray-900 hover:text-lime-600">@{user.username}</p>
                    {user.full_name && (
                      <p className="text-sm text-gray-500">{user.full_name}</p>
                    )}
                  </Link>
                  <UnfollowButton userId={user.id} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Followers ({followers.length})
          </h2>
          
          {followers.length === 0 ? (
            <div className="bg-white rounded-lg border border-lime-200 p-6 text-center">
              <p className="text-gray-500">No followers yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {followers.map((user: any) => (
                <div key={user.id} className="bg-white rounded-lg border border-lime-200 p-4 flex items-center justify-between">
                  <Link href={`/user/${user.username}`} className="flex-1">
                    <p className="font-medium text-gray-900 hover:text-lime-600">@{user.username}</p>
                    {user.full_name && (
                      <p className="text-sm text-gray-500">{user.full_name}</p>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}