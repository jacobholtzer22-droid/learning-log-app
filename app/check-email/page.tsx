'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

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
          <h1 className="text-4xl font-bold text-amber-800 mb-4">Check Your Email</h1>
          
          <div className="bg-white rounded-xl shadow-sm border border-lime-200 p-8 space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            
            <div>
              <p className="text-lg text-gray-900 font-medium mb-2">
                We've sent you a confirmation email
              </p>
              {email && (
                <p className="text-gray-700 mb-2">
                  Check <span className="font-semibold">{email}</span>
                </p>
              )}
              <p className="text-gray-600 text-sm">
                Click the link in the email to verify your account and get started with LearningLogs.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-4">
                Didn't receive the email? Check your spam folder or try signing up again.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <Link
                href="/login"
                className="block w-full px-6 py-3 text-lg font-medium rounded-lg transition-colors bg-lime-600 text-white hover:bg-lime-700 active:bg-lime-800 text-center"
              >
                Back to Sign In
              </Link>
              <Link
                href="/signup"
                className="block w-full px-6 py-3 text-base font-medium rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 text-center"
              >
                Sign Up Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-lime-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mx-auto"></div>
        </div>
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  )
}

