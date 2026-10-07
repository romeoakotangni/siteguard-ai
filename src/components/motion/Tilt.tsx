import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

/**
 * Pointer-following 3D tilt — cards lean toward the cursor and lift slightly.
 * Pure transform, no layout thrash.
 */
export function Tilt({
  children,
  className,
  max = 6,
  lift = 4,
}: {
  children: ReactNode
  className?: string
  max?: number
  lift?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [style, setStyle] = useState<CSSProperties | undefined>(undefined)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setStyle({
      transform: `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(${-lift}px)`,
    })
  }

  const onLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
    })
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        'transition-transform duration-300 ease-out will-change-transform motion-reduce:transform-none',
        className,
      )}
      style={style}
    >
      {children}
    </div>
  )
}
