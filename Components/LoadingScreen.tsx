'use client'

import { useState, useEffect } from 'react'

export function LoadingScreen() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-lime-100">
      <div className="flex flex-col items-center">
        {/* Animated rolling logs */}
        <div className="relative h-40 w-40 flex flex-col justify-end items-center">
          {/* Log 1 - bottom */}
          <div 
            className="absolute bottom-0 w-24 h-8 rounded-full bg-amber-700 border-2 border-amber-900 shadow-md"
            style={{
              animation: 'rollIn 0.5s ease-out forwards',
              opacity: 0,
              transform: 'translateX(-100px) rotate(-360deg)',
            }}
          >
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-200 border-2 border-amber-400">
              <div className="absolute inset-1 rounded-full border border-amber-400"></div>
            </div>
          </div>
          
          {/* Log 2 */}
          <div 
            className="absolute bottom-8 w-24 h-8 rounded-full bg-amber-700 border-2 border-amber-900 shadow-md"
            style={{
              animation: 'rollIn 0.5s ease-out 0.4s forwards',
              opacity: 0,
              transform: 'translateX(-100px) rotate(-360deg)',
            }}
          >
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-200 border-2 border-amber-400">
              <div className="absolute inset-1 rounded-full border border-amber-400"></div>
            </div>
          </div>
          
          {/* Log 3 */}
          <div 
            className="absolute bottom-16 w-24 h-8 rounded-full bg-amber-700 border-2 border-amber-900 shadow-md"
            style={{
              animation: 'rollIn 0.5s ease-out 0.8s forwards',
              opacity: 0,
              transform: 'translateX(-100px) rotate(-360deg)',
            }}
          >
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-200 border-2 border-amber-400">
              <div className="absolute inset-1 rounded-full border border-amber-400"></div>
            </div>
          </div>
          
          {/* Log 4 */}
          <div 
            className="absolute bottom-24 w-24 h-8 rounded-full bg-amber-700 border-2 border-amber-900 shadow-md"
            style={{
              animation: 'rollIn 0.5s ease-out 1.2s forwards',
              opacity: 0,
              transform: 'translateX(-100px) rotate(-360deg)',
            }}
          >
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-200 border-2 border-amber-400">
              <div className="absolute inset-1 rounded-full border border-amber-400"></div>
            </div>
          </div>
          
          {/* Log 5 - top */}
          <div 
            className="absolute bottom-32 w-24 h-8 rounded-full bg-amber-700 border-2 border-amber-900 shadow-md"
            style={{
              animation: 'rollIn 0.5s ease-out 1.6s forwards',
              opacity: 0,
              transform: 'translateX(-100px) rotate(-360deg)',
            }}
          >
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-200 border-2 border-amber-400">
              <div className="absolute inset-1 rounded-full border border-amber-400"></div>
            </div>
          </div>
        </div>
        
        <h1 
          className="mt-6 text-2xl font-bold text-amber-800"
          style={{
            animation: 'fadeIn 0.5s ease-out 2s forwards',
            opacity: 0,
          }}
        >
          LearningLogs
        </h1>
      </div>

      <style jsx>{`
        @keyframes rollIn {
          0% {
            opacity: 0;
            transform: translateX(-100px) rotate(-360deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) rotate(0deg);
          }
        }
        
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}