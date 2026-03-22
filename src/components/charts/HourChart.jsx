import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function HourChart({ data = [] }) {
  const hasData = data.some((d) => d.avgWPM > 0);

  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        No hourly data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256} minWidth={1} minHeight={1}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
        <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} interval={2} axisLine={{ stroke: '#374151' }} tickLine={{ stroke: '#374151' }} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#374151' }} tickLine={{ stroke: '#374151' }} />
        <Tooltip
          contentStyle={{ background: '#0f3460', border: '1px solid #374151', borderRadius: '8px', color: '#e4e4e7', fontSize: '12px' }}
          formatter={(value, name, props) => [`${value} WPM (${props.payload.count} tests)`, 'Average']}
        />
        <Bar dataKey="avgWPM" fill="#e94560" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
