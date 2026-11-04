export default function StatCard({ label, value, detail, accent = 'blue' }) {
  const accentClasses = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    navy: 'bg-slate-100 text-slate-700',
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${accentClasses[accent]}`}>
          {detail}
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </article>
  )
}
