import { cn } from '@/lib/utils'
import { type SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, style, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-lg px-3 py-2 text-sm outline-none transition',
            error ? 'border-red-700 focus:border-red-500' : '',
            className
          )}
          style={{
            background: 'var(--bg-3)',
            border: error ? '1px solid #E05252' : '1px solid var(--border)',
            color: 'var(--text)',
            ...style,
          }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-3)', color: 'var(--text)' }}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
export default Select
