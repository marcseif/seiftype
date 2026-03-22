import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function AccuracyChart({ data = [] }) {
  const filtered = data.filter((d) => d.avgAccuracy !== null);

  if (filtered.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        No accuracy data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256} minWidth={1} minHeight={1}>
      <AreaChart data={filtered} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
        <defs>
          <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} axisLine={{ stroke: '#374151' }} tickLine={{ stroke: '#374151' }} />
        <YAxis domain={[80, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#374151' }} tickLine={{ stroke: '#374151' }} />
        <Tooltip
          contentStyle={{ background: '#0f3460', border: '1px solid #374151', borderRadius: '8px', color: '#e4e4e7', fontSize: '12px' }}
          formatter={(value) => [`${value}%`, 'Accuracy']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Area type="monotone" dataKey="avgAccuracy" stroke="#22c55e" fill="url(#accGrad)" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
