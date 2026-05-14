export function Logo({ className = "h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Circle with MEMI text */}
      <circle cx="30" cy="30" r="24" fill="url(#logoGradient)" />
      <text x="30" y="38" fontFamily="system-ui, sans-serif" fontSize="20" fontWeight="700" fill="white" textAnchor="middle">
        MEMI
      </text>

      {/* Company name */}
      <text x="65" y="24" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="600" fill="white" letterSpacing="0.5">
        MIDDLE EAST
      </text>
      <text x="65" y="40" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="600" fill="#94a3b8" letterSpacing="0.5">
        MEDIA INSIGHTS
      </text>

      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoMark({ className = "h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="24" fill="url(#logoGradient2)" />
      <text x="30" y="38" fontFamily="system-ui, sans-serif" fontSize="20" fontWeight="700" fill="white" textAnchor="middle">
        MEMI
      </text>

      <defs>
        <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
