import { TYPE_META } from '../../lib/mutationDisplay.js'

export default function MutationTypeBadge({ type }) {
  const meta = TYPE_META[type] ?? {
    label: type || 'Mutasi',
    badge: 'bg-pink-light text-pink-dark',
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.badge}`}
    >
      {meta.label}
    </span>
  )
}
