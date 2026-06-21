import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function AreaFrequencyChart({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <h3 className="font-display font-semibold text-ink mb-4">Áreas de desconforto mais reportadas</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E4E9E8" />
          <XAxis type="number" allowDecimals={false} tick={{ fill: '#64706F', fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="nome"
            width={150}
            tick={{ fill: '#1F2A2E', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: '#EAF4F3' }}
            contentStyle={{ borderRadius: 12, border: '1px solid #CFE6E4', fontFamily: 'Inter' }}
          />
          <Bar dataKey="total" fill="#E8714A" radius={[0, 8, 8, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
