'use client';

import { motion } from 'framer-motion';

interface ActiveUsersGaugeProps {
  current: number;
  max: number;
}

export default function ActiveUsersGauge({
  current,
  max,
}: ActiveUsersGaugeProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const angle = (percentage / 100) * 180 - 90; // -90 to 90 degrees

  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 80) return '#10b981'; // green
    if (percentage >= 50) return '#d4af37'; // gold
    if (percentage >= 30) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Gauge */}
      <div className="relative w-48 h-24">
        {/* Background Arc */}
        <svg
          className="w-full h-full"
          viewBox="0 0 200 100"
          style={{ overflow: 'visible' }}
        >
          {/* Background */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="#2a2a3e"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Progress */}
          <motion.path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (251.2 * percentage) / 100}
            initial={{ strokeDashoffset: 251.2 }}
            animate={{ strokeDashoffset: 251.2 - (251.2 * percentage) / 100 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          {/* Needle */}
          <motion.line
            x1="100"
            y1="90"
            x2="100"
            y2="30"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ rotate: -90 }}
            animate={{ rotate: angle }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ transformOrigin: '100px 90px' }}
          />

          {/* Center dot */}
          <circle cx="100" cy="90" r="6" fill={color} />
        </svg>

        {/* Labels */}
        <div className="absolute bottom-0 left-0 text-xs text-cream/40">0</div>
        <div className="absolute bottom-0 right-0 text-xs text-cream/40">
          {max}
        </div>
      </div>

      {/* Value Display */}
      <div className="mt-4 text-center">
        <motion.div
          className="text-4xl font-bold"
          style={{ color }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {current}
        </motion.div>
        <div className="text-sm text-cream/60 mt-1">
          {percentage.toFixed(0)}% de capacité
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 flex items-center gap-2">
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-xs text-cream/60">
          {percentage >= 80
            ? 'Très actif'
            : percentage >= 50
            ? 'Actif'
            : percentage >= 30
            ? 'Modéré'
            : 'Faible'}
        </span>
      </div>
    </div>
  );
}
