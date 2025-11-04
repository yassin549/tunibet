'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BetsPerMinuteChartProps {
  data: Array<{ minute: string; count: number }>;
}

export default function BetsPerMinuteChart({ data }: BetsPerMinuteChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-cream/40">
        Aucune donnée disponible
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    time: `${5 - index}m`,
    Paris: item.count,
  }));

  const maxValue = Math.max(...chartData.map((d) => d.Paris));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
        <XAxis
          dataKey="time"
          stroke="#9ca3af"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#9ca3af"
          style={{ fontSize: '12px' }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a2e',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            borderRadius: '8px',
            color: '#f5f5dc',
          }}
          cursor={{ fill: 'rgba(212, 175, 55, 0.1)' }}
        />
        <Bar dataKey="Paris" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.Paris === maxValue
                  ? '#d4af37'
                  : entry.Paris > maxValue * 0.7
                  ? '#a78bfa'
                  : '#8b5cf6'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
