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
      className={`flex items-start justify-between gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger ${className}`}
    >
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="-my-1 grid min-h-touch min-w-touch place-items-center rounded hover:bg-white/60"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  )
}
