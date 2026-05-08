import Image from 'next/image'

interface LogoMarkProps {
  src?: string
  className?: string
  width?: number
  height?: number
}

export default function LogoMark({
  src = '/logo-v2.png',
  className,
  width = 200,
  height = 136,
}: LogoMarkProps) {
  return (
    <Image
      src={src}
      alt="Unique Stays USA"
      width={width}
      height={height}
      className={className}
    />
  )
}
