interface LogoMarkProps {
  className?: string
}

// logo-mark.png: 950×670 transparent PNG — three polaroid cards, letters removed
// ViewBox 300×248 → aspect ratio ~1.21:1
// At h-12 (48px): renders ~58px wide  (navbar)
// At h-16 (64px): renders ~77px wide  (footer)
export default function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 300 248"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Unique Stays USA"
      className={className}
    >
      {/* Three polaroid card illustrations — transparent PNG */}
      <image
        href="/logo-mark.png"
        x="0"
        y="0"
        width="300"
        height="212"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* "Unique Stays USA" handwritten wordmark in Caveat */}
      <text
        x="150"
        y="240"
        textAnchor="middle"
        fontFamily="var(--font-caveat), Caveat, cursive"
        fontWeight="700"
        fontSize="22"
        fill="oklch(0.40 0.12 235)"
        letterSpacing="0.5"
      >
        Unique Stays USA
      </text>
    </svg>
  )
}
