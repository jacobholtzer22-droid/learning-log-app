/**
 * Logo URL used across the app. Use absolute URL when NEXT_PUBLIC_APP_URL is set
 * so the logo loads correctly in the iOS Capacitor WebView (which loads from Vercel).
 */
export const LOGO_URL =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`
    : '/logo.png'
