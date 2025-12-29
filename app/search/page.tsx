 'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { BottomNav } from '../../Components/BottomNav'
import Link from 'next/link'

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [following, setFollowing] = useState<Set<string>>(new Set())

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        
        // Load who current user is following
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
        
        if (follows) {
          setFollowing(new Set(follows.map(f => f.following_id)))
        }
      }
    }
    loadCurrentUser()
  }, [])

  const searchUsers = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${searchQuery}%`)
      .limit(20)
    
    setUsers(data || [])
    setLoading(false)
  }

  const handleFollow = async (userId: string) => {
    if (!currentUserId) return

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: currentUserId,
        following_id: userId,
      })

    if (!error) {
      setFollowing(new Set([...following, userId]))
    }
  }

  const handleUnfollow = async (userId: string) => {
    if (!currentUserId) return

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)

    if (!error) {
      const newFollowing = new Set(following)
      newFollowing.delete(userId)
      setFollowing(newFollowing)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20 max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Find Friends</h1>

        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              placeholder="Search by username..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              onClick={searchUsers}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {users.length === 0 && !loading && searchQuery && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
          </div>
        )}

        <div className="space-y-3">
          {users.map((user) => {
            const isFollowing = following.has(user.id)
            const isCurrentUser = user.id === currentUserId

            return (
              <div
                key={user.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <Link href={`/user/${user.username}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                      @{user.username}
                    </h3>
                  </Link>
                  {user.full_name && (
                    <p className="text-sm text-gray-600">{user.full_name}</p>
                  )}
                </div>

                {!isCurrentUser && (
                  <button
                    onClick={() => isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      isFollowing
                        ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
                
                {isCurrentUser && (
                  <span className="text-sm text-gray-500">You</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
