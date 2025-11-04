'use client';

import { useEffect, useState } from 'react';
import { Activity, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Round {
  id: string;
  round_number: number;
  crash_point: number;
  status: string;
  started_at: string;
  ended_at: string | null;
  server_seed_hash: string;
  _count: {
    bets: number;
  };
}

export default function RoundsPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchRounds();

    if (autoRefresh) {
      const interval = setInterval(fetchRounds, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  async function fetchRounds() {
    try {
      const response = await fetch('/api/admin/rounds');
      if (response.ok) {
        const data = await response.json();
        setRounds(data.rounds || []);
      }
    } catch (error) {
      console.error('Error fetching rounds:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
            <Activity className="w-3 h-3 animate-pulse" />
            Actif
          </span>
        );
      case 'crashed':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
            <CheckCircle className="w-3 h-3" />
            Terminé
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
      default:
        return (
          <span className="text-xs text-cream/60 px-2 py-1">
            {status}
          </span>
        );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
          <p className="text-cream">Chargement des rounds...</p>
        </div>
      </div>
    );
  }

  const activeRounds = rounds.filter((r) => r.status === 'active');
  const recentRounds = rounds.filter((r) => r.status === 'crashed').slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-gold mb-2">
            Surveillance des Rounds
          </h1>
          <p className="text-cream/60">
            {activeRounds.length} round(s) actif(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-cream">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gold/30 bg-navy/50 text-gold focus:ring-gold"
            />
            Actualisation auto (5s)
          </label>
          <button
            onClick={fetchRounds}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Active Rounds */}
      {activeRounds.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
          <h2 className="text-xl font-display text-green-400 mb-4">
            Rounds Actifs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRounds.map((round) => (
              <motion.div
                key={round.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-navy/50 border border-green-500/30 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-cream/60">
                    Round #{round.round_number}
                  </span>
                  {getStatusBadge(round.status)}
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-cream/60">Multiplicateur</p>
                    <p className="text-2xl font-bold text-green-400">
                      {round.crash_point}x
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-cream/60">Paris actifs</p>
                    <p className="text-cream">{round._count.bets}</p>
                  </div>
                  <div>
                    <p className="text-xs text-cream/60">Démarré</p>
                    <p className="text-xs text-cream/80">
                      {new Date(round.started_at).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Rounds */}
      <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gold/20">
          <h2 className="text-xl font-display text-gold">Rounds Récents</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gold/5 border-b border-gold/20">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                  Round #
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                  Crash Point
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                  Paris
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                  Démarré
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                  Terminé
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                  Hash
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {recentRounds.map((round) => (
                <tr key={round.id} className="hover:bg-gold/5 transition-colors">
                  <td className="px-4 py-4">
                    <p className="text-cream font-medium">#{round.round_number}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p
                      className={`text-lg font-bold ${
                        round.crash_point >= 2
                          ? 'text-green-400'
                          : round.crash_point >= 1.5
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {round.crash_point}x
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-cream">{round._count.bets}</p>
                  </td>
                  <td className="px-4 py-4">{getStatusBadge(round.status)}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-cream/80">
                      {new Date(round.started_at).toLocaleTimeString('fr-FR')}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-cream/80">
                      {round.ended_at
                        ? new Date(round.ended_at).toLocaleTimeString('fr-FR')
                        : '-'}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <code className="text-xs text-cream/60 bg-navy/50 px-2 py-1 rounded">
                      {round.server_seed_hash.slice(0, 8)}...
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-cream/80">
          <p className="font-semibold text-blue-400 mb-1">Surveillance en Temps Réel</p>
          <p>
            Cette page se rafraîchit automatiquement toutes les 5 secondes pour afficher
            les rounds actifs et récents. Les fonctionnalités de pause/force round seront
            ajoutées dans une future mise à jour.
          </p>
        </div>
      </div>
    </div>
  );
}
