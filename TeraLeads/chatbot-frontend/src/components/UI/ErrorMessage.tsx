'use client'

interface ErrorMessageProps {
  message: string
  className?: string
  onDismiss?: () => void
}

export function ErrorMessage({ message, className = '', onDismiss }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={`rounded-lg bg-red-50 p-3 text-red-500 text-sm flex items-center justify-between gap-2 ${className}`}
    >
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="p-1 hover:bg-red-100 rounded"
        >
          ×
        </button>
      )}
    </div>
  )
}
