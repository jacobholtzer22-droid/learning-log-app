'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useToast } from './Toast'

interface FollowButtonProps {
  userId: string
  hasLogs?: boolean
}

export function FollowButton({ userId, hasLogs = false }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const { showToast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    checkFollowStatus()
  }, [userId])

  const checkFollowStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setLoading(false)
      return
    }

    setCurrentUserId(user.id)

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single()

    setIsFollowing(!!data)
    setLoading(false)
  }

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      showToast('Please log in to follow users', 'error')
      return
    }

    setLoading(true)

    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)

      if (!error) {
        setIsFollowing(false)
        showToast('Unfollowed')
      } else {
        showToast('Failed to unfollow', 'error')
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUserId,
          following_id: userId,
        })

      if (!error) {
        setIsFollowing(true)
        showToast('Following!')
        
        // Send email notification (server will handle getting recipient email)
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          if (currentUser) {
            const response = await fetch('/api/send-notification-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'follow',
                recipientUserId: userId,
                actorUserId: currentUser.id,
              }),
            })
            
            const result = await response.json()
            if (!response.ok) {
              console.error('Email notification failed:', result)
            } else {
              console.log('Email notification sent:', result)
            }
          }
        } catch (emailError) {
          // Log error but don't block the follow action
          console.error('Failed to send follow notification email:', emailError)
        }
      } else {
        showToast('Failed to follow', 'error')
      }
    }

    setLoading(false)
    router.refresh()
  }

  if (currentUserId === userId) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleFollowToggle}
        disabled={loading}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition disabled:opacity-50 ${
          isFollowing
            ? 'text-red-600 bg-red-50 hover:bg-red-100'
            : 'text-white bg-lime-600 hover:bg-lime-700'
        }`}
      >
        {loading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
      </button>
      {!isFollowing && !loading && hasLogs && (
        <span className="text-sm text-gray-600">Follow to see logs</span>
      )}
    </div>
  )
}