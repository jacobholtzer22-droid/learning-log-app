import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '../Components/Toast'
import { LoadingScreen } from '../Components/LoadingScreen'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LearningLogs',
  description: 'Track and reflect on what you learn',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LearningLogs',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#84cc16',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" href="/logo.png" />
      </head>
      <body className={`${inter.className} bg-gray-50`}>
        <ToastProvider>
          <LoadingScreen />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
