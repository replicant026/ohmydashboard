export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background */}
      <rect width="32" height="32" rx="8" fill="#18181b" />

      {/* Outer radar ring */}
      <circle cx="16" cy="16" r="9" stroke="#34d399" strokeWidth="1.5" opacity="0.3" />

      {/* Inner radar ring */}
      <circle cx="16" cy="16" r="5.5" stroke="#34d399" strokeWidth="1.5" opacity="0.6" />

      {/* Center dot */}
      <circle cx="16" cy="16" r="2" fill="#34d399" />

      {/* Radar sweep line */}
      <line x1="16" y1="7" x2="16" y2="14" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

      {/* Active agent indicator */}
      <line x1="16" y1="16" x2="22.5" y2="12" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="22.5" cy="12" r="1.5" fill="#6ee7b7" />

      {/* Background agents */}
      <circle cx="10" cy="20" r="1.2" fill="#34d399" opacity="0.5" />
      <circle cx="21" cy="21" r="1" fill="#34d399" opacity="0.4" />
    </svg>
  )
}
