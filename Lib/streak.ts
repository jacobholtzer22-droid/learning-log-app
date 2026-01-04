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
 * Calculate user streak based on daily activity
 * Activity counts if user:
 * - Created a new log on that day (based on created_at)
 * - Updated progress on a log on that day (based on updated_at, if different from created_at)
 * 
 * Streak rules:
 * - Streaks must be consecutive days (no gaps)
 * - If you skip a day, the streak resets
 * - Starts counting from the most recent activity date backwards
 * - Example: Log on Thu, skip Fri, log on Sat = streak of 1 (just Sat)
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
  
  // Get unique activity dates (from created_at or updated_at)
  const activityDates = new Set<string>()
  
  logs.forEach(log => {
    // Add creation date
    if (log.created_at) {
      const createdDate = new Date(log.created_at).toISOString().split('T')[0]
      activityDates.add(createdDate)
    }
    
    // Add update date if it exists and is different from created_at
    // This represents progress updates
    if (log.updated_at && log.updated_at !== log.created_at) {
      const updatedDate = new Date(log.updated_at).toISOString().split('T')[0]
      activityDates.add(updatedDate)
    }
  })
  
  // Convert to sorted array (most recent first)
  const sortedDates = Array.from(activityDates).sort().reverse()
  
  if (sortedDates.length === 0) {
    return 0
  }
  
  // Calculate streak by checking consecutive days
  // Start from the most recent activity date and count backwards
  const mostRecentActivity = sortedDates[0]
  let checkDate = new Date(mostRecentActivity + 'T00:00:00.000Z')
  let consecutiveDays = 0
  
  // Count consecutive days with activity going backwards
  // Keep a copy of sorted dates to check against
  const datesSet = new Set(sortedDates)
  
  while (true) {
    const checkDateStr = checkDate.toISOString().split('T')[0]
    
    if (datesSet.has(checkDateStr)) {
      consecutiveDays++
      // Move to previous day
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
    } else {
      // If we're checking yesterday or earlier and no activity, break
      break
    }
    
    // Safety check: don't go back more than a reasonable amount (e.g., 1000 days)
    if (consecutiveDays > 1000) break
  }
  
  // Return the streak count (1 or more days)
  return consecutiveDays
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

