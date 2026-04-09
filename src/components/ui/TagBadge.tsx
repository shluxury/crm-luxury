import { getTagColor } from '@/lib/utils'

interface TagBadgeProps {
  tag: string
  onRemove?: () => void
  size?: 'sm' | 'xs'
}

export default function TagBadge({ tag, onRemove, size = 'xs' }: TagBadgeProps) {
  const { bg, border, color } = getTagColor(tag)
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="opacity-60 hover:opacity-100 transition"
          style={{ color }}
        >
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      )}
    </span>
  )
}
