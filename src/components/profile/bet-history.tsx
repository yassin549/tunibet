'use client';

import { useState, useEffect } from 'react';
import { CardClassic, CardHeader, CardTitle, CardContent } from '@/components/ui/card-classic';
import { ButtonGold } from '@/components/ui/button-gold';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface Bet {
  id: string;
  round_id: string;
  amount: number;
  cashout_at: number | null;
  profit: number;
  status: 'active' | 'cashed_out' | 'lost';
  account_type: 'demo' | 'live';
  created_at: string;
  crash_point?: number;
}

export function BetHistory() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'won' | 'lost'>('all');
  const [accountFilter, setAccountFilter] = useState<'all' | 'demo' | 'live'>('all');
  const [expandedBet, setExpandedBet] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchBets();
  }, [filter, accountFilter, page]);

  const fetchBets = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (filter !== 'all') {
        params.append('status', filter === 'won' ? 'cashed_out' : 'lost');
      }

      if (accountFilter !== 'all') {
        params.append('account_type', accountFilter);
      }

      const response = await fetch(`/api/bets/history?${params}`);
      const data = await response.json();

      if (response.ok) {
        if (page === 1) {
          setBets(data.bets);
        } else {
          setBets((prev) => [...prev, ...data.bets]);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch bets:', error);
      toast.error('Échec du chargement de l\'historique');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    total: bets.length,
    won: bets.filter((b) => b.status === 'cashed_out').length,
    lost: bets.filter((b) => b.status === 'lost').length,
    totalWagered: bets.reduce((sum, b) => sum + b.amount, 0),
    totalProfit: bets.reduce((sum, b) => sum + b.profit, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CardClassic variant="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-navy/60 dark:text-cream/60">Total Paris</p>
            <p className="text-3xl font-bold text-navy dark:text-cream">{stats.total}</p>
          </CardContent>
        </CardClassic>

        <CardClassic variant="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-navy/60 dark:text-cream/60">Gagnés</p>
            <p className="text-3xl font-bold text-green-600">{stats.won}</p>
          </CardContent>
        </CardClassic>

        <CardClassic variant="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-navy/60 dark:text-cream/60">Perdus</p>
            <p className="text-3xl font-bold text-crash">{stats.lost}</p>
          </CardContent>
        </CardClassic>

        <CardClassic variant="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-navy/60 dark:text-cream/60">Profit Net</p>
            <p className={`text-3xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-crash'}`}>
              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)}
            </p>
          </CardContent>
        </CardClassic>
      </div>

      {/* Filters */}
      <CardClassic variant="cream">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtres</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy dark:text-cream">Statut</label>
              <div className="flex space-x-2">
                {(['all', 'won', 'lost'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === f
                        ? 'bg-gold text-white'
                        : 'bg-navy/10 dark:bg-cream/10 text-navy dark:text-cream hover:bg-gold/20'
                    }`}
                  >
                    {f === 'all' ? 'Tous' : f === 'won' ? 'Gagnés' : 'Perdus'}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy dark:text-cream">Type de Compte</label>
              <div className="flex space-x-2">
                {(['all', 'demo', 'live'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setAccountFilter(f);
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      accountFilter === f
                        ? 'bg-gold text-white'
                        : 'bg-navy/10 dark:bg-cream/10 text-navy dark:text-cream hover:bg-gold/20'
                    }`}
                  >
                    {f === 'all' ? 'Tous' : f === 'demo' ? '🎮 Démo' : '💰 Live'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </CardClassic>

      {/* Bets List */}
      <CardClassic variant="glass">
        <CardHeader>
          <CardTitle>Historique des Paris ({stats.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && page === 1 ? (
            <div className="text-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent mx-auto" />
              <p className="text-sm text-navy/60 dark:text-cream/60 mt-4">Chargement...</p>
            </div>
          ) : bets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-navy/60 dark:text-cream/60">Aucun pari trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bets.map((bet) => (
                <div
                  key={bet.id}
                  className="border border-navy/10 dark:border-cream/10 rounded-xl overflow-hidden"
                >
                  {/* Bet Summary */}
                  <button
                    onClick={() => setExpandedBet(expandedBet === bet.id ? null : bet.id)}
                    className="w-full p-4 hover:bg-navy/5 dark:hover:bg-cream/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Status Icon */}
                        <div className={`p-2 rounded-full ${
                          bet.status === 'cashed_out' 
                            ? 'bg-green-500/20' 
                            : 'bg-crash/20'
                        }`}>
                          <span className="text-lg">
                            {bet.status === 'cashed_out' ? '✓' : '✗'}
                          </span>
                        </div>

                        {/* Bet Info */}
                        <div className="text-left">
                          <div className="flex items-center space-x-2">
                            <p className="font-bold text-navy dark:text-cream">
                              {bet.amount.toFixed(2)} TND
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-navy/10 dark:bg-cream/10 text-navy dark:text-cream">
                              {bet.account_type === 'demo' ? '🎮' : '💰'}
                            </span>
                          </div>
                          <p className="text-xs text-navy/60 dark:text-cream/60">
                            {new Date(bet.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      {/* Result */}
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          {bet.status === 'cashed_out' && bet.cashout_at && (
                            <p className="text-sm font-bold text-gold">
                              {bet.cashout_at.toFixed(2)}x
                            </p>
                          )}
                          <p className={`text-lg font-bold ${
                            bet.profit >= 0 ? 'text-green-600' : 'text-crash'
                          }`}>
                            {bet.profit >= 0 ? '+' : ''}{bet.profit.toFixed(2)} TND
                          </p>
                        </div>
                        {expandedBet === bet.id ? (
                          <ChevronUp className="h-5 w-5 text-navy/60 dark:text-cream/60" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-navy/60 dark:text-cream/60" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedBet === bet.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-navy/10 dark:border-cream/10 bg-navy/5 dark:bg-cream/5">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-navy/60 dark:text-cream/60">ID du Pari</p>
                          <p className="font-mono font-bold text-navy dark:text-cream text-xs">
                            {bet.id.substring(0, 8)}...
                          </p>
                        </div>
                        <div>
                          <p className="text-navy/60 dark:text-cream/60">Round ID</p>
                          <p className="font-mono font-bold text-navy dark:text-cream text-xs">
                            {bet.round_id?.substring(0, 8) || 'N/A'}...
                          </p>
                        </div>
                        {bet.crash_point && (
                          <div>
                            <p className="text-navy/60 dark:text-cream/60">Point de Crash</p>
                            <p className="font-bold text-crash">{bet.crash_point.toFixed(2)}x</p>
                          </div>
                        )}
                        <div>
                          <p className="text-navy/60 dark:text-cream/60">Statut</p>
                          <p className="font-bold text-navy dark:text-cream">
                            {bet.status === 'cashed_out' ? 'Encaissé' : 'Perdu'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="text-center pt-4">
                  <ButtonGold
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Chargement...' : '📥 Charger plus'}
                  </ButtonGold>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </CardClassic>
    </div>
  );
}
