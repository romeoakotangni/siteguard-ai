import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:bg-accent-hover shadow-[0_1px_2px_0_rgb(16_24_40/0.06)] hover:shadow-[0_8px_20px_-8px_rgb(31_94_255/0.55)] ' +
    'relative overflow-hidden before:absolute before:inset-y-0 before:-left-1/2 before:w-1/2 before:skew-x-12 ' +
    "before:bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.35),transparent)] before:content-[''] " +
    'before:transition-transform before:duration-700 ease-out hover:before:translate-x-[320%]',
  secondary:
    'bg-surface text-ink border border-line-strong hover:bg-surface-muted hover:border-ink-faint hover:shadow-card',
  ghost: 'text-ink-soft hover:bg-surface-muted hover:text-ink',
  danger: 'bg-critical text-white hover:brightness-95 hover:shadow-[0_8px_20px_-8px_rgb(220_38_38/0.5)]',
  success: 'bg-healthy text-white hover:brightness-95 hover:shadow-[0_8px_20px_-8px_rgb(22_163_74/0.5)]',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9.5 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap',
        'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out',
        'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
