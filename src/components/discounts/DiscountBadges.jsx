const statusMeta = {
  active: { label: 'Aktif', className: 'bg-success/10 text-success' },
  scheduled: { label: 'Dijadwalkan', className: 'bg-warning/10 text-warning' },
  expired: { label: 'Kedaluwarsa', className: 'bg-cream text-ink-muted' },
  inactive: { label: 'Nonaktif', className: 'bg-error/10 text-error' },
}

const typeMeta = {
  percentage: { label: 'Persentase', className: 'bg-pink-light text-pink-dark' },
  fixed: { label: 'Nominal', className: 'bg-cream text-ink' },
}

const scopeLabels = {
  product: 'Produk',
  transaction: 'Transaksi',
}

function Badge({ className, children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  )
}

export function DiscountStatusBadge({ status }) {
  const meta = statusMeta[status] ?? {
    label: status || '-',
    className: 'bg-cream text-ink-muted',
  }
  return <Badge className={meta.className}>{meta.label}</Badge>
}

export function DiscountTypeBadge({ type }) {
  const meta = typeMeta[type] ?? {
    label: type || '-',
    className: 'bg-cream text-ink-muted',
  }
  return <Badge className={meta.className}>{meta.label}</Badge>
}

export function DiscountScopeLabel({ scope }) {
  return <span className="text-xs font-medium text-ink">{scopeLabels[scope] ?? scope ?? '-'}</span>
}
