import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BackButton } from '../../../../Components/BackButton'
import { UnfollowButton } from '../../../../Components/UnfollowButton'
import { FollowButton } from '../../../../Components/FollowButton'

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

async function getFollowingData(userId: string) {
  const supabase = await getSupabaseClient()
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const currentUserId = currentUser?.id || null

  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

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
    .eq('following_id', userId)

  const followerIds = followersData?.map(f => f.follower_id) || []

  let followers: any[] = []
  if (followerIds.length > 0) {
    const { data: followerProfiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', followerIds)
    
    followers = followerProfiles || []
  }

  return { following, followers, currentUserId }
}

export default async function UserConnectionsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const profile = await getUserProfile(username)
  
  if (!profile) {
    notFound()
  }

  const { following, followers, currentUserId } = await getFollowingData(profile.id)
  const isCurrentUser = currentUserId === profile.id

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <BackButton />
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-amber-800 mb-2">
            @{profile.username}'s Connections
          </h1>
          {profile.full_name && (
            <p className="text-gray-600">{profile.full_name}</p>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Following ({following.length})
          </h2>
          
          {following.length === 0 ? (
            <div className="bg-white rounded-lg border border-lime-200 p-6 text-center">
              <p className="text-gray-500">
                {isCurrentUser ? "You're not following anyone yet" : `@${profile.username} isn't following anyone yet`}
              </p>
              {isCurrentUser && (
                <Link href="/search" className="text-lime-600 hover:text-lime-700 text-sm mt-2 inline-block">
                  Find people to follow
                </Link>
              )}
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
                  {isCurrentUser ? (
                    <UnfollowButton userId={user.id} />
                  ) : (
                    <FollowButton userId={user.id} hasLogs={false} />
                  )}
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
              <p className="text-gray-500">
                {isCurrentUser ? "No followers yet" : `@${profile.username} has no followers yet`}
              </p>
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
                  {!isCurrentUser && currentUserId && user.id !== currentUserId && (
                    <FollowButton userId={user.id} hasLogs={false} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

