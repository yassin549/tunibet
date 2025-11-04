'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Wallet, Activity, DollarSign, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingWithdrawals: number;
  totalWithdrawalAmount: number;
  activeRounds: number;
  totalBetsToday: number;
  revenueToday: number;
  bannedUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Poll every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
          <p className="text-cream">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Utilisateurs Totaux',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'blue',
      subtitle: `${stats?.activeUsers || 0} actifs`,
    },
    {
      title: 'Retraits en Attente',
      value: stats?.pendingWithdrawals || 0,
      icon: Wallet,
      color: 'yellow',
      subtitle: `${stats?.totalWithdrawalAmount?.toFixed(2) || '0.00'} TND`,
      alert: (stats?.pendingWithdrawals || 0) > 0,
    },
    {
      title: 'Rounds Actifs',
      value: stats?.activeRounds || 0,
      icon: Activity,
      color: 'green',
      subtitle: `${stats?.totalBetsToday || 0} paris aujourd'hui`,
    },
    {
      title: 'Revenus Aujourd\'hui',
      value: `${stats?.revenueToday?.toFixed(2) || '0.00'} TND`,
      icon: DollarSign,
      color: 'gold',
      subtitle: 'Bénéfices nets',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display text-gold mb-2">Tableau de Bord</h1>
        <p className="text-cream/60">Vue d'ensemble de la plateforme Tunibet</p>
      </div>

      {/* Alert Banner */}
      {stats && stats.pendingWithdrawals > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-yellow-500 font-semibold mb-1">
              Action Requise
            </h3>
            <p className="text-cream/80 text-sm">
              {stats.pendingWithdrawals} retrait{stats.pendingWithdrawals > 1 ? 's' : ''} en attente d'approbation pour un total de {stats.totalWithdrawalAmount.toFixed(2)} TND
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-navy/50 backdrop-blur-sm border ${
                card.alert ? 'border-yellow-500/30' : 'border-gold/20'
              } rounded-lg p-6 hover:border-gold/40 transition-colors`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-lg ${
                    card.color === 'gold'
                      ? 'bg-gold/10'
                      : card.color === 'yellow'
                      ? 'bg-yellow-500/10'
                      : card.color === 'green'
                      ? 'bg-green-500/10'
                      : 'bg-blue-500/10'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      card.color === 'gold'
                        ? 'text-gold'
                        : card.color === 'yellow'
                        ? 'text-yellow-500'
                        : card.color === 'green'
                        ? 'text-green-500'
                        : 'text-blue-500'
                    }`}
                  />
                </div>
                {card.alert && (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <h3 className="text-cream/60 text-sm mb-2">{card.title}</h3>
              <p className="text-2xl font-bold text-cream mb-1">{card.value}</p>
              <p className="text-xs text-cream/40">{card.subtitle}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6">
        <h2 className="text-xl font-display text-gold mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/retraits"
            className="flex items-center gap-3 p-4 bg-gold/5 hover:bg-gold/10 rounded-lg transition-colors group"
          >
            <Wallet className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-cream font-medium">Gérer les Retraits</p>
              <p className="text-xs text-cream/60">Approuver ou rejeter</p>
            </div>
          </a>
          <a
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-gold/5 hover:bg-gold/10 rounded-lg transition-colors group"
          >
            <Users className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-cream font-medium">Gérer les Utilisateurs</p>
              <p className="text-xs text-cream/60">Bannir, ajuster soldes</p>
            </div>
          </a>
          <a
            href="/admin/rounds"
            className="flex items-center gap-3 p-4 bg-gold/5 hover:bg-gold/10 rounded-lg transition-colors group"
          >
            <Activity className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-cream font-medium">Surveiller les Rounds</p>
              <p className="text-xs text-cream/60">Déboguer, forcer</p>
            </div>
          </a>
        </div>
      </div>

      {/* System Status */}
      {stats && stats.bannedUsers > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <h3 className="text-red-500 font-semibold mb-2">Utilisateurs Bannis</h3>
          <p className="text-cream/80 text-sm">
            {stats.bannedUsers} utilisateur{stats.bannedUsers > 1 ? 's' : ''} actuellement banni{stats.bannedUsers > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
