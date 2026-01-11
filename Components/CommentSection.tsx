'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useToast } from './Toast'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  username?: string
}

interface CommentSectionProps {
  logId: string
}

export function CommentSection({ logId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const { showToast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadComments()
    getCurrentUser()
  }, [logId])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)
  }

  const loadComments = async () => {
    setLoading(true)
    
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('log_id', logId)
      .order('created_at', { ascending: true })

    if (commentsData && commentsData.length > 0) {
      const userIds = [...new Set(commentsData.map(c => c.user_id))]
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      const commentsWithUsernames = commentsData.map(comment => ({
        ...comment,
        username: profilesData?.find(p => p.id === comment.user_id)?.username || 'unknown'
      }))

      setComments(commentsWithUsernames)
    } else {
      setComments([])
    }
    
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showToast('Please log in to comment', 'error')
      setSubmitting(false)
      return
    }

    const { error } = await supabase
      .from('comments')
      .insert({
        log_id: logId,
        user_id: user.id,
        content: newComment.trim(),
      })

    if (!error) {
      setNewComment('')
      await loadComments()
      showToast('Comment posted!')
      
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
              type: 'comment',
              recipientUserId: log.user_id,
              actorUserId: user.id,
              logId: logId,
              logTitle: log.title,
              commentContent: newComment.trim(),
            }),
          })
        }
      } catch (emailError) {
        // Silently fail - email is optional
        console.error('Failed to send comment notification email:', emailError)
      }
    } else {
      showToast('Failed to post comment', 'error')
    }

    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    await loadComments()
    showToast('Comment deleted')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-lime-600 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <p className="text-sm text-gray-400">Loading comments...</p>
          ) : (
            <>
              {comments.length > 0 && (
                <div className="space-y-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-lime-50 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Link 
                              href={`/user/${comment.username}`}
                              className="text-sm font-medium text-lime-600 hover:text-lime-700"
                            >
                              @{comment.username}
                            </Link>
                            <span className="text-xs text-gray-400">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                        </div>
                        {currentUserId === comment.user_id && (
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-gray-400 hover:text-red-500 transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-lime-600 rounded-lg hover:bg-lime-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? '...' : 'Post'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}