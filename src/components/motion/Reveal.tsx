import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { useInView } from '../../lib/useInView'

export type RevealVariant = 'up' | 'left' | 'right' | 'scale' | 'blur'

/** Fades + moves its children in when they first scroll into view. */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  variant = 'up',
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  variant?: RevealVariant
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>()

  const hiddenTransform =
    variant === 'left'
      ? `translateX(${-y}px)`
      : variant === 'right'
        ? `translateX(${y}px)`
        : variant === 'scale'
          ? 'scale(0.95)'
          : `translateY(${y}px)`

  return (
    <div
      ref={ref}
      className={cn(
        'transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform',
        inView
          ? 'translate-x-0 translate-y-0 scale-100 opacity-100'
          : 'opacity-0',
        className,
      )}
      style={
        inView
          ? undefined
          : {
              transform: variant === 'blur' ? undefined : hiddenTransform,
              filter: variant === 'blur' ? 'blur(8px)' : undefined,
              transitionDelay: `${delay}ms`,
            }
      }
    >
      {children}
    </div>
  )
}

/** Animates a number up the first time it becomes visible. */
export function CountUp({
  to,
  duration = 1400,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: {
  to: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4)
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(to * (1 - Math.pow(1 - t, 3)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  const text = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US')

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {text}
      {suffix}
    </span>
  )
}
