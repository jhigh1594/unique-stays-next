import Image from 'next/image'

interface LogoMarkProps {
  className?: string
  width?: number
  height?: number
}

export default function LogoMark({ className, width = 80, height = 80 }: LogoMarkProps) {
  return (
    <Image
      src="/logo-v2.png"
      alt="Unique Stays USA"
      width={width}
      height={height}
      className={className}
    />
  )
}
