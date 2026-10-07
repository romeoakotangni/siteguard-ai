import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-9.5 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink',
        'placeholder:text-ink-faint transition-colors',
        'hover:border-ink-faint focus:border-accent focus:outline-none',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-muted">{hint}</span>}
    </label>
  )
}

export function Select({
  className,
  children,
  ...props
}: InputHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-9.5 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink',
        'hover:border-ink-faint focus:border-accent focus:outline-none',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
