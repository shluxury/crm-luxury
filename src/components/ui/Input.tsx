import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, style, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-lg px-3 py-2 text-sm outline-none transition',
            error ? 'border-red-700 focus:border-red-500 focus:ring-1 focus:ring-red-500' : '',
            className
          )}
          style={{
            background: 'var(--bg-3)',
            border: error ? '1px solid #E05252' : '1px solid var(--border)',
            color: 'var(--text)',
            ...style,
          }}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
