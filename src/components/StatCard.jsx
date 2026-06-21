export default function StatCard({ label, value, accent = 'teal' }) {
  const accentClasses = {
    teal: 'text-teal-700',
    coral: 'text-coral-600',
    leaf: 'text-leaf-600'
  }
  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">{label}</p>
      <p className={`font-display font-extrabold text-2xl sm:text-3xl ${accentClasses[accent]}`}>{value}</p>
    </div>
  )
}
