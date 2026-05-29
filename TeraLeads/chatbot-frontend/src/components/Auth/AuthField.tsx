interface AuthFieldProps {
  id: string
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  invalid: boolean
  hint?: string
}

export function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  invalid,
  hint,
}: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        aria-invalid={invalid}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="min-h-touch w-full rounded-md border border-line bg-white px-3 text-ink focus:border-spruce focus:outline-none focus:ring-2 focus:ring-spruce"
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
