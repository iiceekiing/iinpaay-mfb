interface InpaayLogoProps {
  size?: number;
  className?: string;
}

export function InpaayLogo({ size = 56, className = '' }: InpaayLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Main blue gradient for letters */}
        <linearGradient id="ipGrad" x1="20" y1="10" x2="100" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#1A56F0" />
          <stop offset="50%"  stopColor="#1A3AF7" />
          <stop offset="100%" stopColor="#0D2ECC" />
        </linearGradient>

        {/* Cyan accent gradient for orbit */}
        <linearGradient id="orbitGrad" x1="5" y1="80" x2="115" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#00D4FF" />
          <stop offset="40%"  stopColor="#1A56F0" />
          <stop offset="100%" stopColor="#1A3AF7" />
        </linearGradient>

        {/* Dot cyan gradient */}
        <linearGradient id="dotGrad" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#00B8D9" />
        </linearGradient>
      </defs>

      {/* ── Orbit / swoosh ring ── */}
      {/* Main bottom orbit arc */}
      <path
        d="M 18 82 Q 60 108 102 82"
        stroke="url(#orbitGrad)"
        strokeWidth="7.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cyan left swoosh accent */}
      <path
        d="M 18 82 Q 8 60 22 42"
        stroke="#00D4FF"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Letter "i" ── */}
      {/* i — stem */}
      <rect x="27" y="46" width="13" height="44" rx="6.5" fill="url(#ipGrad)" />
      {/* i — dot */}
      <circle cx="33.5" cy="30" r="8.5" fill="url(#ipGrad)" />

      {/* ── Letter "p" ── */}
      {/* p — vertical stem (extends below bowl) */}
      <rect x="50" y="46" width="13" height="56" rx="6.5" fill="url(#ipGrad)" />
      {/* p — bowl (right semicircle) */}
      <path
        d="M 63 46 Q 92 46 92 64 Q 92 82 63 82"
        stroke="url(#ipGrad)"
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Small cyan accent dot (upper right) ── */}
      <circle cx="102" cy="42" r="5.5" fill="#00D4FF" />
    </svg>
  );
}
