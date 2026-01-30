import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '../Components/Toast'
import { LoadingProvider } from '../Components/LoadingProvider'
import { LOGO_URL } from '../Lib/logo'

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
        <link rel="apple-touch-icon" href={LOGO_URL} />
        <link rel="icon" href={LOGO_URL} />
      </head>
      <body className={`${inter.className} bg-gray-50`}>
        <ToastProvider>
          <LoadingProvider>
            {children}
          </LoadingProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
