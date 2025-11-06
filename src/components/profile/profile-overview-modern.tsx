'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Target, Zap, Award, Flame, Crown, Star } from 'lucide-react';

interface UserStats {
  totalBets: number;
  totalWagered: number;
  biggestWin: number;
  winRate: number;
  totalWon: number;
  currentStreak: number;
  level: number;
  xp: number;
  nextLevelXp: number;
}

export function ProfileOverviewModern() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalBets: 0,
    totalWagered: 0,
    biggestWin: 0,
    winRate: 0,
    totalWon: 0,
    currentStreak: 0,
    level: 1,
    xp: 0,
    nextLevelXp: 1000,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/user');
      if (response.ok) {
        const data = await response.json();
        // Calculate level from total bets
        const level = Math.floor(data.stats.totalBets / 10) + 1;
        const xp = (data.stats.totalBets % 10) * 100;
        
        setStats({
          ...data.stats,
          level,
          xp,
          nextLevelXp: 1000,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  const xpPercentage = (stats.xp / stats.nextLevelXp) * 100;
  const balance = user?.balance_type === 'virtual' ? user.demo_balance : user?.live_balance || 0;

  return (
    <div className="space-y-6">
      {/* Player Card - Gaming Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy/95 to-black border-4 border-gold/30 p-8"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full">
            <defs>
              <pattern id="player-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <circle cx="25" cy="25" r="2" fill="currentColor" className="text-gold"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#player-grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* Level Badge & Name */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold via-yellow-500 to-gold flex items-center justify-center border-4 border-yellow-400 shadow-2xl shadow-gold/50">
                    <span className="text-3xl font-black text-navy">{stats.level}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                </motion.div>
                
                <div>
                  <h2 className="text-3xl font-black text-white mb-1">
                    {user?.display_name || 'Player'}
                  </h2>
                  <p className="text-gold font-bold">Level {stats.level} Crasher</p>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-cream/60 mb-2">
                  <span>Experience</span>
                  <span>{stats.xp}/{stats.nextLevelXp} XP</span>
                </div>
                <div className="h-3 bg-navy/50 rounded-full overflow-hidden border-2 border-gold/30">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-gold via-yellow-500 to-gold relative"
                  >
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Balance Display - Gaming Style */}
            <div className="text-right">
              <p className="text-sm text-cream/60 mb-1">💰 Balance</p>
              <div className="bg-black/50 rounded-xl px-6 py-3 border-2 border-gold/30">
                <p className="text-3xl font-black text-gold">
                  {balance.toFixed(2)}
                </p>
                <p className="text-xs text-cream/60">TND</p>
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  user?.balance_type === 'virtual' 
                    ? 'bg-green-500/20 text-green-400 border-2 border-green-500/30' 
                    : 'bg-gold/20 text-gold border-2 border-gold/30'
                }`}>
                  {user?.balance_type === 'virtual' ? '🎮 Virtual' : '💎 Live'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Gaming Achievement Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Win Rate */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-navy/90 backdrop-blur-sm rounded-2xl p-5 border-2 border-green-500/30 hover:border-green-500/50 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-xs font-bold text-cream/60 uppercase">Win Rate</p>
            </div>
            <p className="text-3xl font-black text-green-400 mb-1">
              {stats.winRate.toFixed(1)}%
            </p>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.winRate}%` }}
                transition={{ delay: 0.3, duration: 1 }}
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Total Won */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-yellow-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-navy/90 backdrop-blur-sm rounded-2xl p-5 border-2 border-gold/30 hover:border-gold/50 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gold/20 rounded-lg">
                <Trophy className="w-5 h-5 text-gold" />
              </div>
              <p className="text-xs font-bold text-cream/60 uppercase">Total Won</p>
            </div>
            <p className="text-2xl font-black text-gold mb-1">
              +{stats.totalWon.toFixed(0)}
            </p>
            <p className="text-xs text-cream/60">TND</p>
          </div>
        </motion.div>

        {/* Biggest Win */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-navy/90 backdrop-blur-sm rounded-2xl p-5 border-2 border-purple-500/30 hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-purple-400" fill="currentColor" />
              </div>
              <p className="text-xs font-bold text-cream/60 uppercase">Best Win</p>
            </div>
            <p className="text-2xl font-black text-purple-400 mb-1">
              +{stats.biggestWin.toFixed(0)}
            </p>
            <p className="text-xs text-cream/60">TND</p>
          </div>
        </motion.div>

        {/* Current Streak */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-navy/90 backdrop-blur-sm rounded-2xl p-5 border-2 border-orange-500/30 hover:border-orange-500/50 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-xs font-bold text-cream/60 uppercase">Streak</p>
            </div>
            <p className="text-3xl font-black text-orange-400 mb-1">
              {stats.currentStreak}
            </p>
            <p className="text-xs text-cream/60">wins in a row</p>
          </div>
        </motion.div>
      </div>

      {/* Game Activity - Chart Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-navy/50 rounded-2xl p-6 border-2 border-gold/20"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-gold" />
            Activity Stats
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-black text-blue-400">{stats.totalBets}</p>
            <p className="text-xs text-cream/60 mt-1">Total Games</p>
          </div>
          <div>
            <p className="text-2xl font-black text-purple-400">{stats.totalWagered.toFixed(0)}</p>
            <p className="text-xs text-cream/60 mt-1">Total Wagered (TND)</p>
          </div>
          <div>
            <p className="text-2xl font-black text-gold">{((stats.totalWon / (stats.totalWagered || 1)) * 100).toFixed(0)}%</p>
            <p className="text-xs text-cream/60 mt-1">ROI</p>
          </div>
        </div>
      </motion.div>

      {/* Achievements Preview - Coming Soon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-gold/10 to-purple-500/10 rounded-2xl p-6 border-2 border-gold/30"
      >
        <h3 className="text-xl font-black text-white flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-gold" />
          Recent Achievements
        </h3>
        <div className="flex items-center gap-4">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold/30 to-yellow-500/30 border-2 border-gold/50 flex items-center justify-center cursor-pointer"
            >
              <Star className="w-8 h-8 text-gold" fill="currentColor" />
            </motion.div>
          ))}
          <div className="flex-1 text-center">
            <p className="text-sm text-cream/60">More achievements coming soon! 🎮</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
