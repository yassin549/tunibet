'use client';

import { useAuth } from '@/contexts/auth-context';
import { CardClassic, CardHeader, CardTitle, CardContent } from '@/components/ui/card-classic';
import { Mail, Calendar, TrendingUp, Wallet, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UserStats {
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  winRate: number;
  biggestWin: number;
  currentStreak: number;
}

export function ProfileOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalBets: 0,
    totalWagered: 0,
    totalWon: 0,
    winRate: 0,
    biggestWin: 0,
    currentStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/stats/user');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <CardClassic variant="cream">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-gold/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-gold">
                {user.display_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-navy dark:text-cream">
                {user.display_name || 'User'}
              </h3>
              <div className="flex items-center space-x-2 text-navy/70 dark:text-cream/70">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-navy/60 dark:text-cream/60 mt-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">
                  Member since {new Date(user.created_at).toLocaleDateString('en-US')}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Display */}
          <div className="pt-4 border-t border-navy/10 dark:border-cream/10">
            <div className={`text-center p-6 rounded-xl border-2 ${
              user.balance_type === 'virtual'
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-gold/10 border-gold/30'
            }`}>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">{user.balance_type === 'virtual' ? '🎮' : '💰'}</span>
                <p className="text-sm font-semibold text-navy/60 dark:text-cream/60">
                  {user.balance_type === 'virtual' ? 'Demo' : 'Live'} Mode
                </p>
              </div>
              <p className={`text-3xl font-bold ${
                user.balance_type === 'virtual' ? 'text-green-600' : 'text-gold'
              }`}>
                {(user.balance_type === 'virtual' ? user.demo_balance : user.live_balance)?.toFixed(2) || '0.00'}{' '}
                <span className="text-lg">TND</span>
              </p>
              {user.balance_type === 'virtual' && user.live_balance > 0 && (
                <p className="text-xs text-navy/60 dark:text-cream/60 mt-2">
                  Live balance available: {user.live_balance.toFixed(2)} TND
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </CardClassic>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Bets */}
        <CardClassic variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-navy/60 dark:text-cream/60">Total Bets</p>
                <p className="text-3xl font-bold text-navy dark:text-cream">
                  {isLoading ? '...' : stats.totalBets}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </CardClassic>

        {/* Total Wagered */}
        <CardClassic variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-navy/60 dark:text-cream/60">Total Wagered</p>
                <p className="text-3xl font-bold text-navy dark:text-cream">
                  {isLoading ? '...' : stats.totalWagered.toFixed(0)}
                  <span className="text-sm ml-1">TND</span>
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/20">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </CardClassic>

        {/* Biggest Win */}
        <CardClassic variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-navy/60 dark:text-cream/60">Biggest Win</p>
                <p className="text-3xl font-bold text-gold">
                  {isLoading ? '...' : stats.biggestWin.toFixed(2)}
                  <span className="text-sm ml-1">TND</span>
                </p>
              </div>
              <div className="p-3 rounded-full bg-gold/20">
                <Trophy className="h-6 w-6 text-gold" />
              </div>
            </div>
          </CardContent>
        </CardClassic>
      </div>

      {/* Win Rate Progress */}
      <CardClassic variant="cream">
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-navy dark:text-cream">Win Rate</span>
              <span className="text-sm font-bold text-gold">
                {isLoading ? '...' : `${stats.winRate.toFixed(1)}%`}
              </span>
            </div>
            <div className="w-full bg-navy/10 dark:bg-cream/10 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-gold to-yellow-600 h-3 rounded-full transition-all duration-500"
                style={{ width: isLoading ? '0%' : `${stats.winRate}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-navy/10 dark:border-cream/10">
            <div>
              <p className="text-sm text-navy/60 dark:text-cream/60">Total Won</p>
              <p className="text-xl font-bold text-green-600">
                +{isLoading ? '...' : stats.totalWon.toFixed(2)} TND
              </p>
            </div>
            <div>
              <p className="text-sm text-navy/60 dark:text-cream/60">Current Streak</p>
              <p className="text-xl font-bold text-navy dark:text-cream">
                {isLoading ? '...' : stats.currentStreak} 🔥
              </p>
            </div>
          </div>
        </CardContent>
      </CardClassic>

      {/* Account Status */}
      <CardClassic variant="glass">
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
              <span className="text-sm font-medium text-navy dark:text-cream">Email Verified</span>
              <span className="text-xs font-bold text-green-600 bg-green-500/20 px-3 py-1 rounded-full">
                ✓ Verified
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-navy/5 dark:bg-cream/5">
              <span className="text-sm font-medium text-navy dark:text-cream">Account Type</span>
              <span className="text-xs font-bold text-navy dark:text-cream bg-navy/10 dark:bg-cream/10 px-3 py-1 rounded-full">
                Standard User
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-navy/5 dark:bg-cream/5">
              <span className="text-sm font-medium text-navy dark:text-cream">Current Mode</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                user.balance_type === 'virtual' 
                  ? 'text-green-600 bg-green-500/20' 
                  : 'text-gold bg-gold/20'
              }`}>
                {user.balance_type === 'virtual' ? '🎮 Demo' : '💰 Live'}
              </span>
            </div>
          </div>
        </CardContent>
      </CardClassic>
    </div>
  );
}
