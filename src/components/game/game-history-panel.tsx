'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, BarChart3, X, History } from 'lucide-react';

interface Bet {
  id: string;
  amount: number;
  cashout_at: number | null;
  profit: number;
  status: 'active' | 'cashed_out' | 'lost';
  created_at: string;
  crash_point?: number;
}

interface GameHistoryPanelProps {
  userId?: string;
}

export function GameHistoryPanel({ userId }: GameHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    won: 0,
    lost: 0,
    winRate: 0,
    totalProfit: 0,
    avgMultiplier: 0,
    bestWin: 0,
  });

  useEffect(() => {
    if (isOpen && userId) {
      fetchRecentBets();
    }
  }, [isOpen, userId]);

  const fetchRecentBets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bets/history?limit=10');
      const data = await response.json();

      if (response.ok) {
        setBets(data.bets);
        calculateStats(data.bets);
      }
    } catch (error) {
      console.error('Failed to fetch bets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (betsData: Bet[]) => {
    const won = betsData.filter((b) => b.status === 'cashed_out').length;
    const lost = betsData.filter((b) => b.status === 'lost').length;
    const total = won + lost;
    const winRate = total > 0 ? (won / total) * 100 : 0;
    const totalProfit = betsData.reduce((sum, b) => sum + (b.profit || 0), 0);
    const avgMultiplier = won > 0 
      ? betsData.filter(b => b.cashout_at).reduce((sum, b) => sum + (b.cashout_at || 0), 0) / won
      : 0;
    const bestWin = Math.max(...betsData.map(b => b.profit || 0), 0);

    setStats({
      total,
      won,
      lost,
      winRate,
      totalProfit,
      avgMultiplier,
      bestWin,
    });
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 p-4 bg-gradient-to-br from-gold via-yellow-500 to-gold text-navy rounded-full shadow-2xl hover:shadow-gold/50 flex items-center gap-2 font-bold"
      >
        <History className="w-6 h-6" />
        <span className="hidden md:inline">History & Stats</span>
      </motion.button>

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-navy/95 backdrop-blur-xl shadow-2xl z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-navy/95 backdrop-blur-xl border-b border-gold/20 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-gold" />
                  <h2 className="text-2xl font-bold text-cream">Game Statistics</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gold/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-cream" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Win Rate */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-gold" />
                      <p className="text-xs text-cream/60 font-medium">Win Rate</p>
                    </div>
                    <p className="text-3xl font-black text-gold">{stats.winRate.toFixed(1)}%</p>
                    <div className="mt-2 h-2 bg-navy/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.winRate}%` }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="h-full bg-gradient-to-r from-gold to-yellow-500"
                      />
                    </div>
                  </motion.div>

                  {/* Total Profit */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`p-4 bg-gradient-to-br ${
                      stats.totalProfit >= 0
                        ? 'from-green-500/20 to-green-500/5 border-green-500/30'
                        : 'from-red-500/20 to-red-500/5 border-red-500/30'
                    } border rounded-xl`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {stats.totalProfit >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <p className="text-xs text-cream/60 font-medium">Net Profit</p>
                    </div>
                    <p className={`text-2xl font-black ${
                      stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(0)} TND
                    </p>
                  </motion.div>

                  {/* Games Played */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-xl"
                  >
                    <p className="text-xs text-cream/60 font-medium mb-2">Games Played</p>
                    <p className="text-3xl font-black text-blue-400">{stats.total}</p>
                    <p className="text-xs text-cream/60 mt-1">
                      {stats.won}W / {stats.lost}L
                    </p>
                  </motion.div>

                  {/* Best Win */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-xl"
                  >
                    <p className="text-xs text-cream/60 font-medium mb-2">Best Win</p>
                    <p className="text-2xl font-black text-purple-400">+{stats.bestWin.toFixed(0)}</p>
                    <p className="text-xs text-cream/60 mt-1">TND</p>
                  </motion.div>

                  {/* Avg Multiplier */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="col-span-2 p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 rounded-xl"
                  >
                    <p className="text-xs text-cream/60 font-medium mb-2">Average Cash Out</p>
                    <p className="text-4xl font-black text-yellow-400">
                      {stats.avgMultiplier.toFixed(2)}x
                    </p>
                  </motion.div>
                </div>

                {/* Recent Bets */}
                <div>
                  <h3 className="text-lg font-bold text-cream mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-gold" />
                    Recent Bets
                  </h3>

                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent mx-auto" />
                      <p className="text-sm text-cream/60 mt-4">Loading...</p>
                    </div>
                  ) : bets.length === 0 ? (
                    <div className="text-center py-12 bg-cream/5 rounded-xl">
                      <p className="text-cream/60">No bets yet. Start playing!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bets.map((bet, index) => (
                        <motion.div
                          key={bet.id}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-xl border-2 ${
                            bet.status === 'cashed_out'
                              ? 'bg-green-500/10 border-green-500/30'
                              : 'bg-red-500/10 border-red-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded-full ${
                                bet.status === 'cashed_out' ? 'bg-green-500' : 'bg-red-500'
                              }`}>
                                <span className="text-white text-xs font-bold">
                                  {bet.status === 'cashed_out' ? '✓' : '✗'}
                                </span>
                              </div>
                              <span className="font-bold text-cream">
                                {(bet.amount || 0).toFixed(0)} TND
                              </span>
                            </div>
                            <div className="text-right">
                              {bet.status === 'cashed_out' && bet.cashout_at && (
                                <p className="text-xs font-bold text-gold">
                                  @ {bet.cashout_at.toFixed(2)}x
                                </p>
                              )}
                              <p className={`text-lg font-black ${
                                (bet.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {(bet.profit || 0) >= 0 ? '+' : ''}{(bet.profit || 0).toFixed(0)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-cream/60">
                            <span>
                              {new Date(bet.created_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {bet.crash_point && (
                              <span>Crashed @ {bet.crash_point.toFixed(2)}x</span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Visual Chart */}
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-cream mb-4">Performance Chart</h3>
                  <div className="bg-cream/5 border border-cream/10 rounded-xl p-4">
                    <div className="flex items-end justify-between h-32 gap-2">
                      {bets.slice(0, 10).reverse().map((bet, index) => {
                        const profit = bet.profit || 0;
                        const height = Math.abs(profit) / Math.max(...bets.map(b => Math.abs(b.profit || 0)), 1) * 100;
                        const isWin = profit >= 0;
                        
                        return (
                          <motion.div
                            key={bet.id}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className={`flex-1 rounded-t ${
                              isWin 
                                ? 'bg-gradient-to-t from-green-500 to-green-400' 
                                : 'bg-gradient-to-t from-red-500 to-red-400'
                            } min-h-[10%] relative group`}
                            title={`${isWin ? '+' : ''}${profit.toFixed(0)} TND`}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-navy px-2 py-1 rounded text-xs whitespace-nowrap">
                              {isWin ? '+' : ''}{profit.toFixed(0)}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs text-cream/60">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded" />
                        <span>Wins</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded" />
                        <span>Losses</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
