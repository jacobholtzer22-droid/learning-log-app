'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface ReactionButtonProps {
  logId: string
}

export function ReactionButton({ logId }: ReactionButtonProps) {
  const [count, setCount] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadReactionData()
  }, [logId])

  const loadReactionData = async () => {
    setLoading(true)
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get like count
    const { count: likeCount } = await supabase
      .from('reactions')
      .select('*', { count: 'exact', head: true })
      .eq('log_id', logId)
      .eq('reaction_type', 'like')

    setCount(likeCount || 0)

    // Check if current user has liked
    if (user) {
      const { data } = await supabase
        .from('reactions')
        .select('id')
        .eq('log_id', logId)
        .eq('user_id', user.id)
        .eq('reaction_type', 'like')
        .single()

      setHasLiked(!!data)
    }
    
    setLoading(false)
  }

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || loading) return

    setLoading(true)

    if (hasLiked) {
      // Unlike
      await supabase
        .from('reactions')
        .delete()
        .eq('log_id', logId)
        .eq('user_id', user.id)
        .eq('reaction_type', 'like')

      setHasLiked(false)
      setCount(count - 1)
    } else {
      // Like
      await supabase
        .from('reactions')
        .insert({
          log_id: logId,
          user_id: user.id,
          reaction_type: 'like',
        })

      setHasLiked(true)
      setCount(count + 1)
      
      // Send email notification to log owner
      try {
        // Get log owner
        const { data: log } = await supabase
          .from('logs')
          .select('user_id, title')
          .eq('id', logId)
          .single()
        
        if (log && log.user_id !== user.id) {
          await fetch('/api/send-notification-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'like',
              recipientUserId: log.user_id,
              actorUserId: user.id,
              logId: logId,
              logTitle: log.title,
            }),
          })
        }
      } catch (emailError) {
        // Silently fail - email is optional
        console.error('Failed to send like notification email:', emailError)
      }
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-1.5 text-sm transition ${
        hasLiked
          ? 'text-red-500'
          : 'text-gray-400 hover:text-red-400'
      } disabled:opacity-50`}
    >
      <svg
        className="w-5 h-5"
        fill={hasLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{count}</span>
    </button>
  )
}