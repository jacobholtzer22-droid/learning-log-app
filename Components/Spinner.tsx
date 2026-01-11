export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Rolling log animation */}
        <div className="absolute inset-0 rounded-full border-4 border-lime-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-600 animate-spin"></div>
      </div>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Spinner size="lg" />
      <p className="mt-4 text-amber-700">Loading...</p>
    </div>
  )
}