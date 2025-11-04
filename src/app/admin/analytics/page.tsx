'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  Zap,
  Clock,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import RevenueChart from '@/components/admin/analytics/revenue-chart';
import ActiveUsersGauge from '@/components/admin/analytics/active-users-gauge';
import BetsPerMinuteChart from '@/components/admin/analytics/bets-per-minute-chart';
import TopPlayersTable from '@/components/admin/analytics/top-players-table';
import RealTimeFeed from '@/components/admin/analytics/real-time-feed';
import { useMetricsEngine } from '@/lib/analytics/metrics-engine';
import { formatCurrency, formatPercentage } from '@/lib/analytics/calculations';

interface RevenueData {
  totalWagered: number;
  totalPayout: number;
  totalRevenue: number;
  totalBets: number;
  avgBet: number;
  houseEdge: number;
}

interface RealtimeMetrics {
  activeUsers: number;
  activeRounds: number;
  betsPerMinute: number;
  revenueLastHour: number;
  onlineUsers: number;
  avgCrashPoint: string;
  bpmData: Array<{ minute: string; count: number }>;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('24h');
  const [revenueData, setRevenueData] = useState<any>(null);
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const metricsEngine = useMetricsEngine();

  // Fetch revenue data
  const fetchRevenueData = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/analytics/revenue?period=${period}`
      );
      if (response.ok) {
        const data = await response.json();
        setRevenueData(data);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  }, [period]);

  // Fetch real-time metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/analytics/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRevenueData(), fetchMetrics()]);
      setLoading(false);
    };
    loadData();
  }, [fetchRevenueData, fetchMetrics]);

  // Auto-refresh metrics
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  // Start metrics engine for real-time updates
  useEffect(() => {
    metricsEngine.start();

    const unsubscribe = metricsEngine.subscribe('bet', () => {
      // Refresh metrics when new bet comes in
      fetchMetrics();
    });

    return () => {
      unsubscribe();
      metricsEngine.stop();
    };
  }, [metricsEngine, fetchMetrics]);

  const handleRefresh = () => {
    fetchRevenueData();
    fetchMetrics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
          <p className="text-cream">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  const current = revenueData?.current as RevenueData;
  const comparison = revenueData?.comparison;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-gold mb-2">
            Analytics & Métriques
          </h1>
          <p className="text-cream/60">
            Analyse en temps réel des performances de la plateforme
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-navy border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold/40"
          >
            <option value="24h">24 heures</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
          </select>

          {/* Auto-refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              autoRefresh
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-navy border border-gold/20 text-cream'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm">
                {autoRefresh ? 'Live' : 'Pausé'}
              </span>
            </div>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Last Update */}
      <div className="flex items-center gap-2 text-xs text-cream/40">
        <Clock className="w-3 h-3" />
        <span>
          Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
        </span>
      </div>

      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Online Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <h3 className="text-cream/60 text-sm mb-2">Utilisateurs en Ligne</h3>
          <p className="text-3xl font-bold text-cream">
            {metrics?.onlineUsers || 0}
          </p>
          <p className="text-xs text-cream/40 mt-2">Actifs (5 dernières min)</p>
        </motion.div>

        {/* Active Rounds */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <h3 className="text-cream/60 text-sm mb-2">Rounds Actifs</h3>
          <p className="text-3xl font-bold text-cream">
            {metrics?.activeRounds || 0}
          </p>
          <p className="text-xs text-cream/40 mt-2">
            Crash moyen: {metrics?.avgCrashPoint || '0.00'}x
          </p>
        </motion.div>

        {/* Bets Per Minute */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Zap className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <h3 className="text-cream/60 text-sm mb-2">Paris / Minute</h3>
          <p className="text-3xl font-bold text-cream">
            {metrics?.betsPerMinute || 0}
          </p>
          <p className="text-xs text-cream/40 mt-2">Dernière minute</p>
        </motion.div>

        {/* Revenue Last Hour */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-gold/10">
              <DollarSign className="w-6 h-6 text-gold" />
            </div>
          </div>
          <h3 className="text-cream/60 text-sm mb-2">Revenus (1h)</h3>
          <p className="text-3xl font-bold text-cream">
            {formatCurrency(metrics?.revenueLastHour || 0)}
          </p>
          <p className="text-xs text-cream/40 mt-2">Dernière heure</p>
        </motion.div>
      </div>

      {/* Revenue Summary Cards */}
      {current && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-cream/60 text-sm">Revenus Totaux</h3>
              {comparison && (
                <div
                  className={`flex items-center gap-1 text-xs ${
                    comparison.revenueChange >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {comparison.revenueChange >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(comparison.revenueChange).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-gold">
              {formatCurrency(current.totalRevenue)}
            </p>
            <p className="text-xs text-cream/40 mt-2">
              House Edge: {formatPercentage(current.houseEdge)}
            </p>
          </div>

          {/* Total Wagered */}
          <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6">
            <h3 className="text-cream/60 text-sm mb-2">Total Misé</h3>
            <p className="text-2xl font-bold text-cream">
              {formatCurrency(current.totalWagered)}
            </p>
            <p className="text-xs text-cream/40 mt-2">
              {current.totalBets} paris
            </p>
          </div>

          {/* Average Bet */}
          <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6">
            <h3 className="text-cream/60 text-sm mb-2">Pari Moyen</h3>
            <p className="text-2xl font-bold text-cream">
              {formatCurrency(current.avgBet)}
            </p>
            <p className="text-xs text-cream/40 mt-2">Par transaction</p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gold" />
            <h2 className="text-xl font-display text-gold">
              Évolution des Revenus
            </h2>
          </div>
          <RevenueChart data={revenueData?.hourly || []} period={period} />
        </div>

        {/* Bets Per Minute Chart */}
        <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-display text-gold">
              Paris par Minute
            </h2>
          </div>
          <BetsPerMinuteChart data={metrics?.bpmData || []} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Users Gauge */}
        <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-display text-gold">
              Utilisateurs Actifs
            </h2>
          </div>
          <ActiveUsersGauge current={metrics?.onlineUsers || 0} max={100} />
        </div>

        {/* Top Players */}
        <div className="lg:col-span-2 bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gold" />
            <h2 className="text-xl font-display text-gold">Top Joueurs</h2>
          </div>
          <TopPlayersTable period={period} />
        </div>
      </div>

      {/* Real-time Feed */}
      <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-gold" />
          <h2 className="text-xl font-display text-gold">
            Activité en Temps Réel
          </h2>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2"></div>
        </div>
        <RealTimeFeed />
      </div>
    </div>
  );
}
