'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors
          }
        },
      },
    }
  )
}

export async function createLog(formData: {
  contentType: string
  title: string
  creator?: string
  consumedDate: string
  keyPoints: string
  practicalApplication: string
  summary: string
  isShared: boolean
}) {
  const supabase = await getSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

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

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/Library')
  revalidatePath('/Feed')
  
  return { success: true }
}

export async function getUserLogs() {
  const supabase = await getSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function getFeedLogs() {
  const supabase = await getSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = follows?.map(f => f.following_id) || []

  if (followingIds.length === 0) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('logs')
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_url
      )
    `)
    .in('user_id', followingIds)
    .eq('is_shared', true)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function deleteLog(logId: string) {
  const supabase = await getSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/Library')
  
  return { success: true }
}