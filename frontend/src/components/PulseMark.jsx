export default function PulseMark({ className = 'w-8 h-8', animated = false }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="12" className="fill-pine-900" />
      <path
        d="M8 24H16L19 15L24 32L28 20L31 24H40"
        stroke="#E8B04B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'pulse-line' : ''}
      />
    </svg>
  );
}
