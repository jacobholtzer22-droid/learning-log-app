'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { BottomNav } from '../../Components/BottomNav'
import { Spinner } from '../../Components/Spinner'

function Button({ children, type = 'button', variant = 'primary', ...props }: any) {
  const baseStyles = 'font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variantStyles = {
    primary: 'bg-lime-600 text-white hover:bg-lime-700 active:bg-lime-800 px-6 py-3',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 px-6 py-3',
  }
  
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]}`}
      {...props}
    >
      {children}
    </button>
  )
}

function Input({ label, ...props }: any) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-800 mb-1">
          {label}
        </label>
      )}
      <input
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-500"
        {...props}
      />
    </div>
  )
}

function Textarea({ label, className, ...props }: any) {
  return (
    <div className={`w-full ${className || ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-800 mb-1">
          {label}
        </label>
      )}
      <textarea
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition resize-none text-gray-900 placeholder-gray-500"
        {...props}
      />
    </div>
  )
}

export default function CreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFirstLogCelebration, setShowFirstLogCelebration] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [formData, setFormData] = useState({
    contentType: 'book',
    title: '',
    creator: '',
    consumedDate: new Date().toISOString().split('T')[0],
    keyPoints: '',
    practicalApplication: '',
    summary: '',
    isShared: false,
    isInProgress: false,
    progressCurrent: '',
    progressTotal: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      // Check if this is the user's first log
      const { count } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const isFirstLog = (count || 0) === 0

      const { error } = await supabase.from('logs').insert({
        user_id: user.id,
        content_type: formData.contentType,
        title: formData.title,
        creator: formData.creator || null,
        consumed_date: formData.consumedDate,
        key_points: formData.keyPoints || null,
        practical_application: formData.practicalApplication || null,
        summary: formData.summary,
        is_shared: formData.isShared,
        is_in_progress: formData.isInProgress,
        progress_current: formData.progressCurrent ? parseFloat(formData.progressCurrent) : null,
        progress_total: formData.progressTotal ? parseFloat(formData.progressTotal) : null,
      })

      if (error) throw error

      // Show celebration screen for first log, otherwise redirect
      if (isFirstLog) {
        setShowFirstLogCelebration(true)
      } else {
        router.push('/library')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create log')
    } finally {
      setLoading(false)
    }
  }

  // Show celebration screen for first log
  if (showFirstLogCelebration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-amber-50 to-orange-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6 py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            You just captured something forever that most people forget within 24 hours
          </h1>
          <p className="text-lg text-gray-700 mt-4">
            This is the start of your learning journey. Keep building your knowledge library, one log at a time.
          </p>
          <div className="pt-6">
            <Button
              onClick={() => {
                router.push('/library')
                router.refresh()
              }}
              className="w-full"
            >
              View My Library
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20 max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-6">Create Learning Log</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-lime-200 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              What did you learn from?
            </label>
            <select
              value={formData.contentType}
              onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none text-gray-900"
            >
              <option value="book">Book</option>
              <option value="podcast">Podcast</option>
              <option value="article">Article</option>
              <option value="course">Course</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Input
            label="Title *"
            value={formData.title}
            onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Atomic Habits"
            required
          />

          <Input
            label="Author / Creator (optional)"
            value={formData.creator}
            onChange={(e: any) => setFormData({ ...formData, creator: e.target.value })}
            placeholder="e.g., James Clear"
          />

          <Input
            label={formData.isInProgress ? "When did you start it? *" : "When did you finish it? *"}
            type="date"
            value={formData.consumedDate}
            onChange={(e: any) => setFormData({ ...formData, consumedDate: e.target.value })}
            required
          />

          <div className="flex items-center space-x-3 pt-2 pb-4 border-b">
            <input
              type="checkbox"
              id="isInProgress"
              checked={formData.isInProgress}
              onChange={(e) => setFormData({ ...formData, isInProgress: e.target.checked })}
              className="w-5 h-5 text-lime-600 rounded focus:ring-2 focus:ring-lime-500"
            />
            <label htmlFor="isInProgress" className="text-sm font-medium text-gray-800">
              Mark as "In Progress"
            </label>
          </div>

          {formData.isInProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <p className="text-sm font-medium text-blue-900 mb-2">Track Your Progress</p>
              
              {formData.contentType === 'book' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Pages Read"
                    type="number"
                    min="0"
                    value={formData.progressCurrent}
                    onChange={(e: any) => setFormData({ ...formData, progressCurrent: e.target.value })}
                    placeholder="e.g., 150"
                  />
                  <Input
                    label="Total Pages (optional)"
                    type="number"
                    min="0"
                    value={formData.progressTotal}
                    onChange={(e: any) => setFormData({ ...formData, progressTotal: e.target.value })}
                    placeholder="e.g., 300"
                  />
                </div>
              )}
              
              {(formData.contentType === 'podcast' || formData.contentType === 'video' || formData.contentType === 'course') && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Minutes Watched/Listened"
                    type="number"
                    min="0"
                    value={formData.progressCurrent}
                    onChange={(e: any) => setFormData({ ...formData, progressCurrent: e.target.value })}
                    placeholder="e.g., 45"
                  />
                  <Input
                    label="Total Minutes (optional)"
                    type="number"
                    min="0"
                    value={formData.progressTotal}
                    onChange={(e: any) => setFormData({ ...formData, progressTotal: e.target.value })}
                    placeholder="e.g., 120"
                  />
                </div>
              )}
              
              {(formData.contentType === 'article' || formData.contentType === 'other') && (
                <div>
                  <Input
                    label="Progress Notes (optional)"
                    value={formData.progressCurrent}
                    onChange={(e: any) => setFormData({ ...formData, progressCurrent: e.target.value })}
                    placeholder="e.g., Halfway through, Chapter 5"
                  />
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-6">
            <Textarea
              label="Summary (notes/quotes) *"
              value={formData.summary}
              onChange={(e: any) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Write a summary, notes, quotes, or anything that will help you remember this..."
              rows={4}
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              This is the only required field. Add whatever helps you remember - summary, notes, quotes, key ideas, etc.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-orange-500 text-lg">🔥</span>
              <div>
                <p className="text-sm font-medium text-orange-900 mb-1">Build Your Learning Streak!</p>
                <p className="text-xs text-orange-800">
                  Create logs or update progress daily to build your streak. Every day you're active counts toward your streak!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-900 mb-2">💡 Optional but Recommended</p>
            <p className="text-xs text-amber-800 mb-4">
              Research shows that answering these questions helps you retain information longer, but they're optional.
            </p>
            
            <Textarea
              label="One idea that surprised me"
              value={formData.keyPoints}
              onChange={(e: any) => setFormData({ ...formData, keyPoints: e.target.value })}
              placeholder="What was one idea that surprised you or caught your attention?"
              rows={4}
            />

            <Textarea
              label="One sentence explaining it to someone else"
              value={formData.practicalApplication}
              onChange={(e: any) => setFormData({ ...formData, practicalApplication: e.target.value })}
              placeholder="Explain this idea in one sentence as if you were telling someone else..."
              rows={3}
              className="mt-4"
            />
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t">
            <input
              type="checkbox"
              id="isShared"
              checked={formData.isShared}
              onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
              className="w-5 h-5 text-lime-600 rounded focus:ring-2 focus:ring-lime-500"
            />
            <label htmlFor="isShared" className="text-sm font-medium text-gray-800">
              Share with friends
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Saving...
                </span>
              ) : (
                'Save Log'
              )}
            </Button>
          </div>
        </form>
      </div>
      <BottomNav />
    </div>
  )
}