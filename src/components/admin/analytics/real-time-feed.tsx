'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useMetricsEngine, MetricsUpdate } from '@/lib/analytics/metrics-engine';
import { formatCurrency } from '@/lib/analytics/calculations';

interface FeedItem {
  id: string;
  type: 'bet' | 'round' | 'win';
  message: string;
  amount?: number;
  timestamp: Date;
  icon: any;
  color: string;
}

export default function RealTimeFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const metricsEngine = useMetricsEngine();

  useEffect(() => {
    // Subscribe to all metrics updates
    const unsubscribe = metricsEngine.subscribe('all', handleMetricsUpdate);

    return () => {
      unsubscribe();
    };
  }, [metricsEngine]);

  const handleMetricsUpdate = (update: MetricsUpdate) => {
    const newItem = createFeedItem(update);
    if (newItem) {
      setFeed((prev) => {
        const updated = [newItem, ...prev];
        return updated.slice(0, 20); // Keep last 20 items
      });
    }
  };

  const createFeedItem = (update: MetricsUpdate): FeedItem | null => {
    const id = `${update.type}-${Date.now()}-${Math.random()}`;
    const timestamp = new Date(update.timestamp);

    switch (update.type) {
      case 'bet':
        const bet = update.data;
        return {
          id,
          type: 'bet',
          message: `Nouveau pari de ${formatCurrency(bet.amount)}`,
          amount: parseFloat(bet.amount),
          timestamp,
          icon: DollarSign,
          color: '#60a5fa',
        };

      case 'round':
        const round = update.data;
        if (round.status === 'completed') {
          return {
            id,
            type: 'round',
            message: `Round #${round.round_number} terminé à ${parseFloat(
              round.crash_point
            ).toFixed(2)}x`,
            timestamp,
            icon: Activity,
            color: '#d4af37',
          };
        }
        return null;

      case 'transaction':
        const tx = update.data;
        if (tx.type === 'deposit') {
          return {
            id,
            type: 'win',
            message: `Dépôt de ${formatCurrency(tx.amount)}`,
            amount: parseFloat(tx.amount),
            timestamp,
            icon: TrendingUp,
            color: '#10b981',
          };
        }
        return null;

      default:
        return null;
    }
  };

  if (feed.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-cream/40">
        <Zap className="w-12 h-12 mb-2 opacity-50" />
        <p>En attente d'activité...</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
      <AnimatePresence mode="popLayout">
        {feed.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 p-3 bg-navy/30 rounded-lg hover:bg-navy/50 transition-colors"
            >
              {/* Icon */}
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${item.color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: item.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-cream text-sm">{item.message}</p>
                <p className="text-xs text-cream/40">
                  {item.timestamp.toLocaleTimeString('fr-FR')}
                </p>
              </div>

              {/* Amount Badge */}
              {item.amount && (
                <div className="flex-shrink-0">
                  <div
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: `${item.color}20`,
                      color: item.color,
                    }}
                  >
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              )}

              {/* Arrow */}
              <ArrowRight className="w-4 h-4 text-cream/20 flex-shrink-0" />
            </motion.div>
          );
        })}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(42, 42, 62, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.5);
        }
      `}</style>
    </div>
  );
}
