'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BottomNav } from '../../Components/BottomNav'
import { BackButton } from '../../Components/BackButton'
import { Spinner } from '../../Components/Spinner'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow'
  created_at: string
  actor_username: string
  actor_id: string
  log_id?: string
  log_title?: string
  comment_content?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const allNotifications: Notification[] = []

    // Get followers (people who followed you)
    const { data: followers } = await supabase
      .from('follows')
      .select('follower_id, created_at')
      .eq('following_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (followers) {
      const followerIds = followers.map(f => f.follower_id)
      const { data: followerProfiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', followerIds)

      followers.forEach(follow => {
        const profile = followerProfiles?.find(p => p.id === follow.follower_id)
        if (profile) {
          allNotifications.push({
            id: `follow-${follow.follower_id}-${follow.created_at}`,
            type: 'follow',
            created_at: follow.created_at,
            actor_username: profile.username,
            actor_id: profile.id,
          })
        }
      })
    }

    // Get your logs to find likes and comments on them
    const { data: userLogs } = await supabase
      .from('logs')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('is_shared', true)

    const logIds = userLogs?.map(log => log.id) || []

    if (logIds.length > 0) {
      // Get likes on your logs
      const { data: likes } = await supabase
        .from('reactions')
        .select('id, user_id, log_id, created_at')
        .in('log_id', logIds)
        .eq('reaction_type', 'like')
        .neq('user_id', user.id) // Don't show your own likes
        .order('created_at', { ascending: false })
        .limit(50)

      if (likes) {
        const likerIds = [...new Set(likes.map(l => l.user_id))]
        const { data: likerProfiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', likerIds)

        likes.forEach(like => {
          const profile = likerProfiles?.find(p => p.id === like.user_id)
          const log = userLogs?.find(l => l.id === like.log_id)
          if (profile && log) {
            allNotifications.push({
              id: `like-${like.id}`,
              type: 'like',
              created_at: like.created_at,
              actor_username: profile.username,
              actor_id: profile.id,
              log_id: like.log_id,
              log_title: log.title,
            })
          }
        })
      }

      // Get comments on your logs
      const { data: comments } = await supabase
        .from('comments')
        .select('id, user_id, log_id, content, created_at')
        .in('log_id', logIds)
        .neq('user_id', user.id) // Don't show your own comments
        .order('created_at', { ascending: false })
        .limit(50)

      if (comments) {
        const commenterIds = [...new Set(comments.map(c => c.user_id))]
        const { data: commenterProfiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', commenterIds)

        comments.forEach(comment => {
          const profile = commenterProfiles?.find(p => p.id === comment.user_id)
          const log = userLogs?.find(l => l.id === comment.log_id)
          if (profile && log) {
            allNotifications.push({
              id: `comment-${comment.id}`,
              type: 'comment',
              created_at: comment.created_at,
              actor_username: profile.username,
              actor_id: profile.id,
              log_id: comment.log_id,
              log_title: log.title,
              comment_content: comment.content,
            })
          }
        })
      }
    }

    // Sort all notifications by date (newest first)
    allNotifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    setNotifications(allNotifications)
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'follow':
        return `started following you`
      case 'like':
        return `liked your log "${notification.log_title}"`
      case 'comment':
        return `commented on your log "${notification.log_title}"`
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <BackButton />
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-amber-700">Loading notifications...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <BackButton />
        <h1 className="text-2xl font-bold text-amber-800 mb-6">Notifications</h1>

        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-lime-200">
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications yet</h3>
            <p className="mt-1 text-sm text-gray-700">
              You'll see notifications here when people interact with your content
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white rounded-lg border border-lime-200 p-4 hover:bg-lime-50 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {notification.type === 'follow' && (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    {notification.type === 'like' && (
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                    )}
                    {notification.type === 'comment' && (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <Link
                            href={`/user/${notification.actor_username}`}
                            className="font-semibold text-lime-600 hover:text-lime-700"
                          >
                            @{notification.actor_username}
                          </Link>
                          {' '}
                          <span className="text-gray-600">{getNotificationText(notification)}</span>
                        </p>
                        {notification.comment_content && (
                          <p className="text-sm text-gray-500 mt-1 italic">
                            "{notification.comment_content}"
                          </p>
                        )}
                        {notification.log_id && (
                          <Link
                            href={`/feed#log-${notification.log_id}`}
                            className="text-xs text-lime-600 hover:text-lime-700 mt-1 inline-block"
                          >
                            View log →
                          </Link>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                  </div>
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

