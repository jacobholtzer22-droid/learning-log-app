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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition"
        {...props}
      />
    </div>
  )
}

function Textarea({ label, ...props }: any) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition resize-none"
        {...props}
      />
    </div>
  )
}

export default function CreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('logs').insert({
        user_id: user.id,
        content_type: formData.contentType,
        title: formData.title,
        creator: formData.creator || null,
        consumed_date: formData.consumedDate,
        key_points: formData.keyPoints,
        practical_application: formData.practicalApplication,
        summary: formData.summary,
        is_shared: formData.isShared,
      })

      if (error) throw error

      router.push('/library')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create log')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20 max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-6">Create Learning Log</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-lime-200 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What did you learn from?
            </label>
            <select
              value={formData.contentType}
              onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none"
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
            label="When did you finish it? *"
            type="date"
            value={formData.consumedDate}
            onChange={(e: any) => setFormData({ ...formData, consumedDate: e.target.value })}
            required
          />

          <div className="border-t pt-6">
            <Textarea
              label="1. What are the 3 most important points? (In your own words) *"
              value={formData.keyPoints}
              onChange={(e: any) => setFormData({ ...formData, keyPoints: e.target.value })}
              placeholder="Write the 3 key takeaways that matter most to you..."
              rows={5}
              required
            />
          </div>

          <Textarea
            label="2. How will you use this in the next 7 days? (Real example) *"
            value={formData.practicalApplication}
            onChange={(e: any) => setFormData({ ...formData, practicalApplication: e.target.value })}
            placeholder="Describe a specific, concrete way you'll apply this learning..."
            rows={4}
            required
          />

          <Textarea
            label="3. Summary *"
            value={formData.summary}
            onChange={(e: any) => setFormData({ ...formData, summary: e.target.value })}
            placeholder="Write a brief summary in your own words..."
            rows={3}
            required
          />

          <div className="flex items-center space-x-3 pt-4 border-t">
            <input
              type="checkbox"
              id="isShared"
              checked={formData.isShared}
              onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
              className="w-5 h-5 text-lime-600 rounded focus:ring-2 focus:ring-lime-500"
            />
            <label htmlFor="isShared" className="text-sm font-medium text-gray-700">
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