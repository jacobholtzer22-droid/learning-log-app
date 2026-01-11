'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useLoading } from '../../Components/LoadingProvider'

function Button({ children, ...props }: any) {
  return (
    <button
      className="w-full px-6 py-3 text-lg font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-lime-600 text-white hover:bg-lime-700 active:bg-lime-800"
      {...props}
    >
      {children}
    </button>
  )
}

function Input({ label, error, ...props }: any) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-800 mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setLoading: setGlobalLoading } = useLoading()
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setGlobalLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/library')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to login')
      setGlobalLoading(false)
      setLoading(false)
    }
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
          <h1 className="text-4xl font-bold text-amber-800">LearningLogs</h1>
          <p className="mt-3 text-base font-medium text-amber-700 max-w-md mx-auto">
            Turn passive content into durable memory in under 3 minutes
          </p>
          <p className="mt-4 text-amber-600">Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6 bg-white p-6 rounded-xl shadow-sm border border-lime-200">
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="text-center text-sm text-gray-700">
            Don't have an account?{' '}
            <Link href="/signup" className="text-lime-600 hover:text-lime-700 font-medium">
              sign up here
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
