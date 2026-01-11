'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ReactionButton } from './ReactionButton'
import { CommentSection } from './CommentSection'

interface FeedLogItemProps {
  log: {
    id: string
    title: string
    creator?: string
    content_type: string
    consumed_date: string
    created_at: string
    summary: string
    key_points?: string
    practical_application?: string
    is_in_progress?: boolean
    progress_current?: number
    progress_total?: number
    profiles?: {
      username: string
      full_name?: string
      avatar_url?: string
    }
  }
  contentTypeColors: Record<string, string>
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function FeedLogItem({ log, contentTypeColors }: FeedLogItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Check if there's additional content beyond the summary
  const hasAdditionalContent = !!(log.key_points || log.practical_application)

  return (
    <div className="bg-white rounded-lg border border-lime-200 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${contentTypeColors[log.content_type]}`}>
              {log.content_type}
            </span>
            {log.is_in_progress && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                In Progress
              </span>
            )}
            <span className="text-xs text-gray-600">
              {formatDate(log.consumed_date)}
            </span>
          </div>
          <h3 className="font-semibold text-lg text-gray-900">{log.title}</h3>
          {log.creator && (
            <p className="text-sm text-gray-700">by {log.creator}</p>
          )}
          {log.profiles && (
            <Link 
              href={`/user/${log.profiles.username}`}
              className="text-sm text-lime-600 hover:text-lime-700 mt-1 inline-block"
            >
              @{log.profiles.username}
            </Link>
          )}
          {log.is_in_progress && log.progress_current && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-medium">Progress:</span>
                <span>
                  {log.content_type === 'book' 
                    ? `${Math.round(log.progress_current)}${log.progress_total ? ` / ${Math.round(log.progress_total)} pages` : ' pages read'}`
                    : (log.content_type === 'podcast' || log.content_type === 'video' || log.content_type === 'course')
                    ? `${Math.round(log.progress_current)}${log.progress_total ? ` / ${Math.round(log.progress_total)} minutes` : ' minutes'}`
                    : log.progress_current
                  }
                  {log.progress_total && log.progress_current && (
                    <span className="ml-1 text-gray-500">
                      ({Math.round((log.progress_current / log.progress_total) * 100)}%)
                    </span>
                  )}
                </span>
              </div>
              {log.progress_total && log.progress_current && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((log.progress_current / log.progress_total) * 100))}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-gray-800 mb-1">Summary:</p>
          <p className="text-gray-700 whitespace-pre-wrap">{log.summary}</p>
        </div>

        {isExpanded && (
          <>
            {log.key_points && (
              <div>
                <p className="font-medium text-gray-800 mb-1">Key Points:</p>
                <p className="text-gray-700 whitespace-pre-wrap">{log.key_points}</p>
              </div>
            )}

            {log.practical_application && (
              <div>
                <p className="font-medium text-gray-800 mb-1">How I'll Use This:</p>
                <p className="text-gray-700 whitespace-pre-wrap">{log.practical_application}</p>
              </div>
            )}
          </>
        )}

        {hasAdditionalContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-lime-600 hover:text-lime-700 font-medium text-sm transition-colors"
          >
            {isExpanded ? 'See less' : 'See more'}
          </button>
        )}
      </div>

      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Logged {formatDate(log.created_at)}
          </p>
          <ReactionButton logId={log.id} />
        </div>
        <CommentSection logId={log.id} />
      </div>
    </div>
  )
}

