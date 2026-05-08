interface LogoMarkProps {
  className?: string
}

// logo-cards.png: 1024×353 crop of the three polaroid cards (illustrations only, no letters)
// ViewBox 300×130 → aspect ratio ~2.31:1
// At h-10 (40px): renders ~92px wide   (navbar)
// At h-14 (56px): renders ~129px wide  (footer)
export default function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 300 130"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Unique Stays USA"
      className={className}
    >
      {/* Three polaroid card illustrations */}
      <image
        href="/logo-cards.png"
        x="0"
        y="0"
        width="300"
        height="104"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* "Unique Stays USA" handwritten wordmark in Caveat */}
      <text
        x="150"
        y="124"
        textAnchor="middle"
        fontFamily="var(--font-caveat), Caveat, cursive"
        fontWeight="700"
        fontSize="22"
        fill="oklch(0.55 0.14 38)"
        letterSpacing="0.5"
      >
        Unique Stays USA
      </text>
    </svg>
  )
}
