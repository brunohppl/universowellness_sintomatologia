import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function SetorChart({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <h3 className="font-display font-semibold text-ink mb-4">Registros por setor</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ left: 0, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E9E8" />
          <XAxis dataKey="setor" tick={{ fill: '#1F2A2E', fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} tick={{ fill: '#64706F', fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: '#EAF4F3' }}
            contentStyle={{ borderRadius: 12, border: '1px solid #CFE6E4', fontFamily: 'Inter' }}
          />
          <Bar dataKey="total" fill="#2D8B8F" radius={[8, 8, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
