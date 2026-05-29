import Link from 'next/link'

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded text-ink no-underline">
      <span
        aria-hidden="true"
        className="grid h-8 w-8 place-items-center rounded-md bg-spruce font-display text-lg text-white"
      >
        F
      </span>
      <span className="font-display text-xl">Front Desk</span>
    </Link>
  )
}
