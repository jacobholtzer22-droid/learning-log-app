'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useToast } from './Toast'

interface UnfollowButtonProps {
  userId: string
}

export function UnfollowButton({ userId }: UnfollowButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleUnfollow = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId)

    if (!error) {
      showToast('Unfollowed')
    } else {
      showToast('Failed to unfollow', 'error')
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleUnfollow}
      disabled={loading}
      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition"
    >
      {loading ? '...' : 'Unfollow'}
    </button>
  )
}