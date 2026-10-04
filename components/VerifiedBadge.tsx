type VerifiedBadgeProps = {
  size?: 'sm' | 'md'
  title?: string
}

export function VerifiedBadge({
  size = 'md',
  title = 'Asesor verificado',
}: VerifiedBadgeProps) {
  const dimension = size === 'sm' ? 17 : 19
  const checkSize = size === 'sm' ? 10 : 11

  return (
    <span
      title={title}
      aria-label={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${dimension}px`,
        height: `${dimension}px`,
        borderRadius: '50%',
        background: '#1877F2',
        color: '#fff',
        flexShrink: 0,
        verticalAlign: 'middle',
        boxSizing: 'border-box',
      }}
    >
      <svg
        width={checkSize}
        height={checkSize}
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2.2 6.2 4.8 8.7 9.8 3.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
