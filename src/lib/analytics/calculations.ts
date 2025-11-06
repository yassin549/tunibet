/**
 * Analytics Calculations
 * Utility functions for calculating metrics and statistics
 */

export interface RevenueData {
  totalWagered: number;
  totalPayout: number;
  totalRevenue: number;
  totalBets: number;
  avgBet: number;
  houseEdge: number;
}

export interface HourlyData {
  hour: string;
  wagered: number;
  payout: number;
  revenue: number;
  betCount: number;
}

export interface PlayerData {
  userId: string;
  email: string;
  displayName: string;
  totalWagered: number;
  totalProfit: number;
  betCount: number;
  winRate: number;
}

export interface RealtimeMetrics {
  activeUsers: number;
  activeRounds: number;
  betsPerMinute: number;
  revenueLastHour: number;
  timestamp: string;
}

/**
 * Calculate house edge percentage
 */
export function calculateHouseEdge(
  totalWagered: number,
  totalPayout: number
): number {
  if (totalWagered === 0) return 0;
  const revenue = totalWagered - totalPayout;
  return (revenue / totalWagered) * 100;
}

/**
 * Calculate profit margin
 */
export function calculateProfitMargin(
  revenue: number,
  totalWagered: number
): number {
  if (totalWagered === 0) return 0;
  return (revenue / totalWagered) * 100;
}

/**
 * Calculate average bet size
 */
export function calculateAvgBet(
  totalWagered: number,
  betCount: number
): number {
  if (betCount === 0) return 0;
  return totalWagered / betCount;
}

/**
 * Calculate win rate percentage
 */
export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return (wins / total) * 100;
}

/**
 * Calculate growth rate between two periods
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number
): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(avg);
  }
  return result;
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(data: number[]): number {
  if (data.length === 0) return 0;
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squaredDiffs = data.map((val) => Math.pow(val - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  return Math.sqrt(variance);
}

/**
 * Get time period label
 */
export function getTimePeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    '24h': 'Dernières 24 heures',
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    custom: 'Période personnalisée',
  };
  return labels[period] || period;
}

/**
 * Get date range for period
 */
export function getDateRangeForPeriod(period: string): {
  start: Date;
  end: Date;
} {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '24h':
      start.setHours(start.getHours() - 24);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    default:
      start.setHours(start.getHours() - 24);
  }

  return { start, end };
}

/**
 * Aggregate hourly data into daily
 */
export function aggregateToDaily(hourlyData: HourlyData[]): HourlyData[] {
  const dailyMap = new Map<string, HourlyData>();

  hourlyData.forEach((item) => {
    const date = new Date(item.hour).toISOString().split('T')[0];

    if (dailyMap.has(date)) {
      const existing = dailyMap.get(date)!;
      existing.wagered += item.wagered;
      existing.payout += item.payout;
      existing.revenue += item.revenue;
      existing.betCount += item.betCount;
    } else {
      dailyMap.set(date, {
        hour: date,
        wagered: item.wagered,
        payout: item.payout,
        revenue: item.revenue,
        betCount: item.betCount,
      });
    }
  });

  return Array.from(dailyMap.values()).sort((a, b) =>
    a.hour.localeCompare(b.hour)
  );
}

/**
 * Calculate trend direction
 */
export function getTrendDirection(
  current: number,
  previous: number
): 'up' | 'down' | 'stable' {
  const change = current - previous;
  const threshold = Math.abs(previous * 0.05); // 5% threshold

  if (Math.abs(change) < threshold) return 'stable';
  return change > 0 ? 'up' : 'down';
}

/**
 * Calculate percentile
 */
export function calculatePercentile(data: number[], percentile: number): number {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Group data by time interval
 */
export function groupByTimeInterval(
  data: Array<{ timestamp: string; value: number }>,
  interval: 'hour' | 'day' | 'week'
): Array<{ time: string; value: number }> {
  const grouped = new Map<string, number>();

  data.forEach((item) => {
    const date = new Date(item.timestamp);
    let key: string;

    switch (interval) {
      case 'hour':
        key = date.toISOString().slice(0, 13) + ':00:00';
        break;
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
    }

    grouped.set(key, (grouped.get(key) || 0) + item.value);
  });

  return Array.from(grouped.entries())
    .map(([time, value]) => ({ time, value }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Calculate retention rate
 */
export function calculateRetentionRate(
  returningUsers: number,
  totalUsers: number
): number {
  if (totalUsers === 0) return 0;
  return (returningUsers / totalUsers) * 100;
}

/**
 * Calculate churn rate
 */
export function calculateChurnRate(
  lostUsers: number,
  totalUsers: number
): number {
  if (totalUsers === 0) return 0;
  return (lostUsers / totalUsers) * 100;
}
