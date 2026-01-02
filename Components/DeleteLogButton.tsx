'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useToast } from './Toast'

interface DeleteLogButtonProps {
  logId: string
}

export function DeleteLogButton({ logId }: DeleteLogButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this log?')) return

    setLoading(true)

    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', logId)

    if (!error) {
      showToast('Log deleted')
      router.refresh()
    } else {
      showToast('Failed to delete log', 'error')
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
      title="Delete log"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}