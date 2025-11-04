'use client';

import { useStore } from '@/stores/useStore';
import { CardClassic, CardHeader, CardTitle, CardContent } from '@/components/ui/card-classic';
import { motion } from 'framer-motion';

export function RoundsHistory() {
  const { liveRounds } = useStore();

  // Mock data for demonstration (will be replaced with real data in Prompt 5)
  const mockRounds = liveRounds.length > 0 ? liveRounds : [
    { id: '1', crash_point: 2.45, status: 'crashed' },
    { id: '2', crash_point: 1.23, status: 'crashed' },
    { id: '3', crash_point: 5.67, status: 'crashed' },
    { id: '4', crash_point: 1.05, status: 'crashed' },
    { id: '5', crash_point: 3.89, status: 'crashed' },
    { id: '6', crash_point: 10.24, status: 'crashed' },
    { id: '7', crash_point: 1.67, status: 'crashed' },
    { id: '8', crash_point: 2.11, status: 'crashed' },
    { id: '9', crash_point: 4.56, status: 'crashed' },
    { id: '10', crash_point: 1.89, status: 'crashed' },
  ];

  const getColorClass = (crashPoint: number) => {
    if (crashPoint >= 10) return 'bg-purple-500 text-white';
    if (crashPoint >= 5) return 'bg-green-500 text-white';
    if (crashPoint >= 2) return 'bg-gold text-navy';
    return 'bg-crash text-white';
  };

  return (
    <CardClassic variant="glass">
      <CardHeader>
        <CardTitle>Historique des Rounds</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {mockRounds.slice(0, 20).map((round, index) => (
            <motion.div
              key={round.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`
                rounded-lg px-3 py-2 text-sm font-bold
                ${getColorClass(round.crash_point)}
                shadow-md hover:scale-105 transition-transform cursor-pointer
              `}
              title={`Round crash à ${round.crash_point.toFixed(2)}x`}
            >
              {round.crash_point.toFixed(2)}x
            </motion.div>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-navy/60 dark:text-cream/60">Moyenne</p>
            <p className="text-lg font-bold text-navy dark:text-cream">
              {(mockRounds.reduce((sum, r) => sum + r.crash_point, 0) / mockRounds.length).toFixed(2)}x
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-navy/60 dark:text-cream/60">Plus haut</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {Math.max(...mockRounds.map(r => r.crash_point)).toFixed(2)}x
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-navy/60 dark:text-cream/60">Plus bas</p>
            <p className="text-lg font-bold text-crash">
              {Math.min(...mockRounds.map(r => r.crash_point)).toFixed(2)}x
            </p>
          </div>
        </div>
      </CardContent>
    </CardClassic>
  );
}
