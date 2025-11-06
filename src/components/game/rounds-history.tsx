'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/stores/useStore';
import { CardClassic, CardHeader, CardTitle, CardContent } from '@/components/ui/card-classic';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export function RoundsHistory() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Fetch real rounds data from database
  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const { data, error } = await supabase
          .from('rounds')
          .select('id, crash_point, status, ended_at')
          .eq('status', 'crashed')
          .order('ended_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching rounds:', error);
        } else if (data) {
          setRounds(data);
        }
      } catch (err) {
        console.error('Error fetching rounds:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRounds();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('rounds-history')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rounds',
          filter: 'status=eq.crashed',
        },
        (payload) => {
          setRounds((prev) => [payload.new, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getColorClass = (crashPoint: number) => {
    if (crashPoint >= 10) return 'bg-purple-500 text-white';
    if (crashPoint >= 5) return 'bg-green-500 text-white';
    if (crashPoint >= 2) return 'bg-gold text-navy';
    return 'bg-crash text-white';
  };

  return (
    <CardClassic variant="glass">
      <CardHeader>
        <CardTitle>Rounds History</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-cream/60">Loading rounds...</div>
        ) : rounds.length === 0 ? (
          <div className="text-center py-8 text-cream/60">No rounds yet</div>
        ) : (
          <>
        <div className="flex flex-wrap gap-2">
          {rounds.map((round, index) => (
            <motion.div
              key={`${round.id}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`
                rounded-lg px-3 py-2 text-sm font-bold
                ${getColorClass(round.crash_point)}
                shadow-md hover:scale-105 transition-transform cursor-pointer
              `}
              title={`Round crashed at ${round.crash_point.toFixed(2)}x`}
            >
              {round.crash_point.toFixed(2)}x
            </motion.div>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-navy/60 dark:text-cream/60">Average</p>
            <p className="text-lg font-bold text-navy dark:text-cream">
              {(rounds.reduce((sum, r) => sum + r.crash_point, 0) / rounds.length).toFixed(2)}x
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-navy/60 dark:text-cream/60">Highest</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {Math.max(...rounds.map(r => r.crash_point)).toFixed(2)}x
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-navy/60 dark:text-cream/60">Lowest</p>
            <p className="text-lg font-bold text-crash">
              {Math.min(...rounds.map(r => r.crash_point)).toFixed(2)}x
            </p>
          </div>
        </div>
        </>
        )}
      </CardContent>
    </CardClassic>
  );
}
