import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts';

export default function WPMChart({ data = [] }) {
  const filtered = data.filter((d) => d.avgWPM !== null);

  if (filtered.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        No data yet. Complete some tests to see your WPM trend.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <AreaChart data={filtered} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
        <defs>
          <linearGradient id="wpmGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e94560" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#e94560" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickFormatter={(d) => d.slice(5)}
          axisLine={{ stroke: '#374151' }}
          tickLine={{ stroke: '#374151' }}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={{ stroke: '#374151' }}
        />
        <Tooltip
          contentStyle={{
            background: '#0f3460',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#e4e4e7',
            fontSize: '12px',
          }}
          formatter={(value) => [`${value} WPM`, 'Average']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Area type="monotone" dataKey="avgWPM" stroke="#e94560" fill="url(#wpmGrad)" strokeWidth={2} dot={{ r: 3, fill: '#e94560' }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
