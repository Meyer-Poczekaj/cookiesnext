'use client'

export function CookieIcon(props: { size?: number }) {
  const size = props.size ?? 22
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-9.5-8.98 3.5 3.5 0 0 0 4.24 4.24A3.5 3.5 0 0 0 21 12Z" />
      <circle cx="8.5" cy="10" r="0.6" fill="currentColor" />
      <circle cx="12" cy="15.5" r="0.6" fill="currentColor" />
      <circle cx="15.5" cy="11.5" r="0.6" fill="currentColor" />
      <circle cx="9.5" cy="14.5" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function ShieldIcon(props: { size?: number }) {
  const size = props.size ?? 28
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5C8 19.2 5 15.5 5 11V6l7-3Z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  )
}

export function CloseIcon(props: { size?: number }) {
  const size = props.size ?? 18
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function ChevronIcon(props: { size?: number; open?: boolean }) {
  const size = props.size ?? 16
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transform: props.open ? 'rotate(180deg)' : undefined,
        transition: 'transform 0.15s ease',
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
