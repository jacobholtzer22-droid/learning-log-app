'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { BottomNav } from '../../../../Components/BottomNav'
import { Spinner } from '../../../../Components/Spinner'
import { getLogQuestions } from '../../../../Lib/logQuestions'

function Button({ children, type = 'button', variant = 'primary', ...props }: any) {
  const baseStyles = 'font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variantStyles = {
    primary: 'bg-lime-600 text-white hover:bg-lime-700 active:bg-lime-800 px-6 py-3',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 px-6 py-3',
    muted: 'bg-gray-300 text-gray-500 px-6 py-3 cursor-not-allowed',
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

export default function EditLogPage() {
  const router = useRouter()
  const params = useParams()
  const logId = params.logId as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [formData, setFormData] = useState({
    contentType: 'book',
    title: '',
    creator: '',
    consumedDate: '',
    keyPoints: '',
    practicalApplication: '',
    optionalApplication: '',
    summary: '',
    isShared: false,
    isInProgress: false,
    progressCurrent: '',
    progressTotal: '',
  })

  useEffect(() => {
    async function loadLog() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: log, error: fetchError } = await supabase
          .from('logs')
          .select('*')
          .eq('id', logId)
          .eq('user_id', user.id)
          .single()

        if (fetchError || !log) {
          setError('Log not found or you do not have permission to edit it')
          return
        }

        setFormData({
          contentType: log.content_type || 'book',
          title: log.title || '',
          creator: log.creator || '',
          consumedDate: log.consumed_date ? new Date(log.consumed_date).toISOString().split('T')[0] : '',
          keyPoints: log.key_points || '',
          practicalApplication: log.practical_application || '',
          optionalApplication: (log as { optional_application?: string }).optional_application || '',
          summary: log.summary || '',
          isShared: log.is_shared || false,
          isInProgress: log.is_in_progress || false,
          progressCurrent: log.progress_current ? String(log.progress_current) : '',
          progressTotal: log.progress_total ? String(log.progress_total) : '',
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load log')
      } finally {
        setLoading(false)
      }
    }

    if (logId) {
      loadLog()
    }
  }, [logId, router, supabase])

  const isFormValid =
    formData.title.trim() !== '' &&
    formData.consumedDate.trim() !== '' &&
    formData.keyPoints.trim() !== '' &&
    formData.practicalApplication.trim() !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('logs')
        .update({
          content_type: formData.contentType,
          title: formData.title,
          creator: formData.creator || null,
          consumed_date: formData.consumedDate,
          key_points: formData.keyPoints || null,
          practical_application: formData.practicalApplication || null,
          optional_application: formData.optionalApplication || null,
          summary: formData.summary || null,
          is_shared: formData.isShared,
          is_in_progress: formData.isInProgress,
          progress_current: formData.progressCurrent ? parseFloat(formData.progressCurrent) : null,
          progress_total: formData.progressTotal ? parseFloat(formData.progressTotal) : null,
        })
        .eq('id', logId)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      router.push('/library')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update log')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-[env(safe-area-inset-top,0px)]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20 max-w-2xl mx-auto px-4 safe-area-top pb-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-6">Edit Learning Log</h1>

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

          <div className="bg-lime-50 border border-lime-300 rounded-lg p-4 border-t pt-6">
            <p className="text-sm font-medium text-lime-800 mb-2">💡 Reflection questions <span className="text-lime-700 font-semibold">(required)</span></p>
            <p className="text-xs text-lime-700 mb-4">
              Answer these to lock in what you learned.
            </p>
            {(() => {
              const q = getLogQuestions(formData.contentType)
              return (
                <>
                  <Textarea
                    label={`${q.q1} *`}
                    value={formData.keyPoints}
                    onChange={(e: any) => setFormData({ ...formData, keyPoints: e.target.value })}
                    placeholder={q.q1}
                    rows={4}
                    required
                  />
                  <Textarea
                    label={`${q.q2} *`}
                    value={formData.practicalApplication}
                    onChange={(e: any) => setFormData({ ...formData, practicalApplication: e.target.value })}
                    placeholder={q.q2}
                    rows={3}
                    className="mt-4"
                    required
                  />
                </>
              )
            })()}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 border-t pt-6">
            <p className="text-sm font-medium text-gray-500 mb-2">Optional</p>
            <Textarea
              label="Summary (notes/quotes)"
              value={formData.summary}
              onChange={(e: any) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Write a summary, notes, quotes, or anything that will help you remember this..."
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Put anything you want to remember yourself here.
            </p>
            {(() => {
              const q = getLogQuestions(formData.contentType)
              return (
                <div className="mt-4">
                  <Textarea
                    label={`${q.q3} (optional)`}
                    value={formData.optionalApplication}
                    onChange={(e: any) => setFormData({ ...formData, optionalApplication: e.target.value })}
                    placeholder={q.q3}
                    rows={3}
                  />
                </div>
              )
            })()}
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
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isFormValid ? 'primary' : 'muted'}
              disabled={saving || !isFormValid}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Saving...
                </span>
              ) : (
                'Update Log'
              )}
            </Button>
          </div>
        </form>
      </div>
      <BottomNav />
    </div>
  )
}

