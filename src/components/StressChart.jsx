import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { NIVEIS_ESTRESSE } from '../data/stressLevels'

export default function StressChart({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <h3 className="font-display font-semibold text-ink mb-4">Distribuição do nível de estresse</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 0, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E9E8" />
          <XAxis dataKey="nome" tick={{ fill: '#1F2A2E', fontSize: 12 }} interval={0} />
          <YAxis allowDecimals={false} tick={{ fill: '#64706F', fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: '#EAF4FD' }}
            contentStyle={{ borderRadius: 12, border: '1px solid #CFE6FB', fontFamily: 'Inter' }}
          />
          <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={56}>
            {data.map((entry, i) => (
              <Cell key={i} fill={NIVEIS_ESTRESSE.find((n) => n.nome === entry.nome)?.cor ?? '#94A3B8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
