'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/analytics/calculations';

interface RevenueChartProps {
  data: Array<{
    hour: string;
    wagered: number;
    payout: number;
    revenue: number;
    betCount: number;
  }>;
  period: string;
}

export default function RevenueChart({ data, period }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((item) => ({
      time: formatTimeLabel(item.hour, period),
      Revenus: parseFloat(item.revenue.toString()),
      Misé: parseFloat(item.wagered.toString()),
      Payé: parseFloat(item.payout.toString()),
    }));
  }, [data, period]);

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-cream/40">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
        <XAxis
          dataKey="time"
          stroke="#9ca3af"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          stroke="#9ca3af"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a2e',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            borderRadius: '8px',
            color: '#f5f5dc',
          }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Legend
          wrapperStyle={{ color: '#f5f5dc' }}
          iconType="line"
        />
        <Line
          type="monotone"
          dataKey="Revenus"
          stroke="#d4af37"
          strokeWidth={3}
          dot={{ fill: '#d4af37', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="Misé"
          stroke="#60a5fa"
          strokeWidth={2}
          dot={{ fill: '#60a5fa', r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="Payé"
          stroke="#f87171"
          strokeWidth={2}
          dot={{ fill: '#f87171', r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function formatTimeLabel(timestamp: string, period: string): string {
  const date = new Date(timestamp);

  if (period === '24h') {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (period === '7d') {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  }
}
