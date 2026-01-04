'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function EmailConfirmedPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-lime-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="LearningLogs"
              width={100}
              height={100}
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-amber-800 mb-4">Email Verified!</h1>
          
          <div className="bg-white rounded-xl shadow-sm border border-lime-200 p-8 space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            
            <div>
              <p className="text-lg text-gray-900 font-medium mb-2">
                Successfully verified email
              </p>
              <p className="text-gray-600">
                Your email has been confirmed. You can now access all features of LearningLogs.
              </p>
            </div>

            <div className="pt-4">
              <Link
                href="/library"
                className="block w-full px-6 py-3 text-lg font-medium rounded-lg transition-colors bg-lime-600 text-white hover:bg-lime-700 active:bg-lime-800 text-center"
              >
                Continue to Library
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

