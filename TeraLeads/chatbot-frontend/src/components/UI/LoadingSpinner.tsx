'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
}

export function LoadingSpinner({
  size = 'md',
  label = 'Loading',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <span role="status" aria-label={label} className={`inline-flex items-center ${className}`}>
      <span
        aria-hidden="true"
        className={`inline-block animate-spin rounded-full border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size]}`}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
