'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

/**
 * Calculate user streak based on 32-hour activity windows
 * Activity counts if user:
 * - Created a new log (based on created_at)
 * - Updated progress on a log (based on updated_at, if different from created_at)
 * 
 * Streak rules:
 * - Each log must be created within 32 hours of the previous one
 * - If you don't create a log within 32 hours of your last one, the streak resets to 0
 * - Starts counting from the most recent activity timestamp backwards
 * - Checks actual timestamps, not calendar days
 */
export async function getUserStreak(userId: string): Promise<number> {
  const supabase = await getSupabaseClient()
  
  // Get all logs for the user
  const { data: logs } = await supabase
    .from('logs')
    .select('created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (!logs || logs.length === 0) {
    return 0
  }
  
  // Collect all activity timestamps (both created_at and updated_at)
  const activityTimestamps: Date[] = []
  
  logs.forEach(log => {
    // Add creation timestamp
    if (log.created_at) {
      activityTimestamps.push(new Date(log.created_at))
    }
    
    // Add update timestamp if it exists and is different from created_at
    // This represents progress updates
    if (log.updated_at && log.updated_at !== log.created_at) {
      activityTimestamps.push(new Date(log.updated_at))
    }
  })
  
  // Sort timestamps (most recent first)
  activityTimestamps.sort((a, b) => b.getTime() - a.getTime())
  
  if (activityTimestamps.length === 0) {
    return 0
  }
  
  // Check if the most recent activity was within the last 32 hours
  const now = new Date()
  const mostRecentActivity = activityTimestamps[0]
  const hoursSinceLastActivity = (now.getTime() - mostRecentActivity.getTime()) / (1000 * 60 * 60)
  
  // If the most recent activity was more than 32 hours ago, streak is 0
  if (hoursSinceLastActivity > 32) {
    return 0
  }
  
  // Calculate streak by checking if each activity was within 32 hours of the previous one
  let streak = 1 // At least 1 since the most recent activity is within 32 hours
  
  for (let i = 1; i < activityTimestamps.length; i++) {
    const currentActivity = activityTimestamps[i - 1]
    const previousActivity = activityTimestamps[i]
    
    // Calculate hours between current and previous activity
    const hoursBetween = (currentActivity.getTime() - previousActivity.getTime()) / (1000 * 60 * 60)
    
    // If previous activity was within 32 hours of current activity, continue the streak
    if (hoursBetween <= 32) {
      streak++
    } else {
      // Gap is too large, streak ends here
      break
    }
    
    // Safety check: don't count more than a reasonable amount (e.g., 1000 activities)
    if (streak > 1000) break
  }
  
  return streak
}

/**
 * Get streak for current user
 */
export async function getCurrentUserStreak(): Promise<number> {
  const supabase = await getSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return 0
  }
  
  return getUserStreak(user.id)
}

