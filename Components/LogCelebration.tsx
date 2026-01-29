'use client'

import { useEffect, useRef } from 'react'

function Button({ children, onClick, className = '' }: { children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-medium rounded-lg transition-colors bg-lime-600 text-white hover:bg-lime-700 active:bg-lime-800 px-6 py-3 ${className}`}
    >
      {children}
    </button>
  )
}

export function LogCelebration({
  isFirstLog,
  onContinue,
}: {
  isFirstLog: boolean
  onContinue: () => void
}) {
  const hasFired = useRef(false)

  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true

    const duration = 2500
    const end = Date.now() + duration
    const colors = ['#84cc16', '#a3e635', '#fbbf24', '#f59e0b', '#22c55e']

    void import('canvas-confetti').then(({ default: confetti }) => {
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        })
        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()

      // Big center burst
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.6 },
          colors,
        })
      }, 200)
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-amber-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 py-12 relative z-10">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        {isFirstLog ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              You started a one day streak!
            </h1>
            <p className="text-lg text-gray-700 mt-4">
              Come back tomorrow to make it 2.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              Log saved!
            </h1>
            <p className="text-lg text-gray-700 mt-4">
              You&apos;re on a roll. Keep building your streak!
            </p>
          </>
        )}
        <div className="pt-6">
          <Button onClick={onContinue} className="w-full">
            View My Library
          </Button>
        </div>
      </div>
    </div>
  )
}
