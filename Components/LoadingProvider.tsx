'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { LoadingScreen } from './LoadingScreen'

interface LoadingContextType {
  setLoading: (loading: boolean) => void
  isLoading: boolean
}

const LoadingContext = createContext<LoadingContextType | null>(null)

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider')
  }
  return context
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasShownInitial, setHasShownInitial] = useState(false)

  // Show initial loading screen on first mount
  useEffect(() => {
    if (!hasShownInitial) {
      const timer = setTimeout(() => {
        setIsLoading(false)
        setHasShownInitial(true)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [hasShownInitial])

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  return (
    <LoadingContext.Provider value={{ setLoading, isLoading }}>
      {children}
      {isLoading && <LoadingScreen />}
    </LoadingContext.Provider>
  )
}

