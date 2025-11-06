'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PlaneCanvas2DProps {
  multiplier: number;
  isActive: boolean;
  isCrashed: boolean;
  onManualCashout?: () => void;
  canCashout: boolean;
}

export function PlaneCanvas2D({
  multiplier,
  isActive,
  isCrashed,
  onManualCashout,
  canCashout,
}: PlaneCanvas2DProps) {
  const [trail, setTrail] = useState<{x: number, y: number, opacity: number}[]>([]);

  // Calculate plane position based on multiplier
  const progress = Math.min(((multiplier - 1) / 10) * 100, 100); // 1x to 11x mapped to 0-100%
  const planeY = 80 - (progress * 0.7); // Top position (higher multiplier = higher up)
  const planeX = 10 + (progress * 0.8); // Right position

  // Add trail effect
  useEffect(() => {
    if (!isActive || isCrashed) {
      setTrail([]);
      return;
    }

    const interval = setInterval(() => {
      setTrail(prev => {
        const newTrail = [
          ...prev.map(p => ({ ...p, opacity: p.opacity - 0.05 })).filter(p => p.opacity > 0),
          { x: planeX, y: planeY, opacity: 1 }
        ];
        return newTrail.slice(-15); // Keep last 15 trail points
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isActive, isCrashed, planeX, planeY]);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Game Canvas */}
      <div className="relative bg-gradient-to-br from-navy via-navy/95 to-black rounded-3xl border-4 border-gold/30 overflow-hidden shadow-2xl shadow-gold/20 aspect-[16/10]">
        {/* Animated Background Grid */}
        <div className="absolute inset-0">
          <svg className="w-full h-full opacity-10">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gold"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Gradient Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-gold/5 via-transparent to-transparent" />

        {/* Trail Effect */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {trail.map((point, i) => (
            <motion.circle
              key={i}
              cx={`${point.x}%`}
              cy={`${point.y}%`}
              r="4"
              fill={`rgba(212, 175, 55, ${point.opacity * 0.3})`}
              initial={{ scale: 1 }}
              animate={{ scale: 0 }}
              transition={{ duration: 1 }}
            />
          ))}
          
          {/* Curved trajectory line */}
          {isActive && !isCrashed && (
            <motion.path
              d={`M 10 80 Q ${planeX / 2} ${planeY + 20}, ${planeX} ${planeY}`}
              stroke="url(#trajectory-gradient)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="8 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
          
          <defs>
            <linearGradient id="trajectory-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Multiplier Display - Center Top */}
        <motion.div
          className="absolute top-8 left-1/2 -translate-x-1/2 z-10"
          animate={{
            scale: isActive ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
        >
          <div className={`px-12 py-6 rounded-2xl border-4 backdrop-blur-xl ${
            isCrashed
              ? 'bg-crash/90 border-crash shadow-crash/50'
              : 'bg-gold/90 border-gold shadow-gold/50'
          } shadow-2xl`}>
            <div className="text-center">
              <div className={`text-6xl font-black font-mono ${
                isCrashed ? 'text-white' : 'text-navy'
              }`}>
                {multiplier.toFixed(2)}x
              </div>
              {isActive && !isCrashed && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-xs font-bold text-navy/80 mt-1"
                >
                  🚀 FLYING
                </motion.div>
              )}
              {isCrashed && (
                <div className="text-xs font-bold text-white/90 mt-1">
                  💥 CRASHED
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Rocket/Plane */}
        <AnimatePresence>
          {isActive && !isCrashed && (
            <motion.div
              className="absolute z-20"
              style={{
                left: `${planeX}%`,
                top: `${planeY}%`,
              }}
              initial={{ scale: 0, rotate: -45 }}
              animate={{
                scale: 1,
                rotate: -45 + (progress / 10),
                x: [-2, 2, -2],
                y: [-1, 1, -1],
              }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{
                scale: { duration: 0.3 },
                rotate: { duration: 0.2 },
                x: { duration: 1, repeat: Infinity },
                y: { duration: 0.8, repeat: Infinity },
              }}
            >
              <div className="relative">
                {/* Engine Flames - Behind plane */}
                <motion.div
                  className="absolute -left-20 top-1/2 -translate-y-1/2 z-0"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{ duration: 0.2, repeat: Infinity }}
                >
                  <svg width="80" height="60" viewBox="0 0 80 60" className="drop-shadow-2xl">
                    {/* Main flame */}
                    <ellipse cx="40" cy="30" rx="35" ry="25" fill="url(#flameGradient)" opacity="0.9" />
                    {/* Inner flame */}
                    <ellipse cx="45" cy="30" rx="25" ry="18" fill="url(#innerFlame)" opacity="0.8" />
                    {/* Core flame */}
                    <ellipse cx="50" cy="30" rx="15" ry="12" fill="url(#coreFlame)" />
                    <defs>
                      <radialGradient id="flameGradient">
                        <stop offset="0%" stopColor="#FF4500" />
                        <stop offset="50%" stopColor="#FF8C00" />
                        <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="innerFlame">
                        <stop offset="0%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#FFA500" stopOpacity="0.3" />
                      </radialGradient>
                      <radialGradient id="coreFlame">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#FFD700" />
                      </radialGradient>
                    </defs>
                  </svg>
                </motion.div>

                {/* 2D Plane SVG */}
                <div className="relative z-10">
                  <svg width="120" height="80" viewBox="0 0 120 80" className="drop-shadow-2xl">
                    {/* Plane Body Shadow */}
                    <ellipse cx="60" cy="45" rx="30" ry="8" fill="rgba(0,0,0,0.3)" opacity="0.5" />
                    
                    {/* Main Fuselage */}
                    <path
                      d="M 20 40 Q 30 35, 50 35 L 85 35 Q 95 35, 100 40 Q 95 45, 85 45 L 50 45 Q 30 45, 20 40 Z"
                      fill="url(#bodyGradient)"
                      stroke="#D4AF37"
                      strokeWidth="2"
                    />
                    
                    {/* Top Wing */}
                    <path
                      d="M 45 35 Q 45 20, 50 15 L 70 15 Q 75 20, 75 35 Z"
                      fill="url(#wingGradient)"
                      stroke="#D4AF37"
                      strokeWidth="1.5"
                    />
                    
                    {/* Bottom Wing */}
                    <path
                      d="M 45 45 Q 45 60, 50 65 L 70 65 Q 75 60, 75 45 Z"
                      fill="url(#wingGradient)"
                      stroke="#D4AF37"
                      strokeWidth="1.5"
                    />
                    
                    {/* Tail Wing */}
                    <path
                      d="M 20 35 L 15 25 L 25 35 Z"
                      fill="url(#tailGradient)"
                      stroke="#D4AF37"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 20 45 L 15 55 L 25 45 Z"
                      fill="url(#tailGradient)"
                      stroke="#D4AF37"
                      strokeWidth="1.5"
                    />
                    
                    {/* Cockpit Window */}
                    <ellipse cx="80" cy="40" rx="10" ry="6" fill="url(#windowGradient)" opacity="0.9" />
                    
                    {/* Engine Intake */}
                    <circle cx="25" cy="40" r="5" fill="#1a1a2e" stroke="#D4AF37" strokeWidth="1" />
                    
                    {/* Decorative Lines */}
                    <line x1="45" y1="40" x2="75" y2="40" stroke="#FFD700" strokeWidth="1" opacity="0.6" />
                    <line x1="50" y1="37" x2="70" y2="37" stroke="#FFD700" strokeWidth="0.5" opacity="0.4" />
                    <line x1="50" y1="43" x2="70" y2="43" stroke="#FFD700" strokeWidth="0.5" opacity="0.4" />
                    
                    <defs>
                      <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1a1a2e" />
                        <stop offset="50%" stopColor="#16213e" />
                        <stop offset="100%" stopColor="#0f172a" />
                      </linearGradient>
                      <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D4AF37" />
                        <stop offset="50%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#D4AF37" />
                      </linearGradient>
                      <linearGradient id="tailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF4500" />
                        <stop offset="100%" stopColor="#FFD700" />
                      </linearGradient>
                      <radialGradient id="windowGradient">
                        <stop offset="0%" stopColor="#87CEEB" />
                        <stop offset="100%" stopColor="#4682B4" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>

                {/* Sparkle Trail Effect */}
                <motion.div
                  className="absolute -right-4 top-0 z-20"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <path d="M10 0 L11 9 L20 10 L11 11 L10 20 L9 11 L0 10 L9 9 Z" fill="#FFD700" opacity="0.9" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crash Explosion Effect */}
        {isCrashed && (
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: [1, 0.8, 0] }}
            transition={{ duration: 1 }}
          >
            <div className="text-9xl">💥</div>
          </motion.div>
        )}

        {/* Cash Out Button - Bottom Center */}
        {onManualCashout && canCashout && !isCrashed && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onManualCashout}
              className="px-12 py-6 bg-gradient-to-r from-green-500 via-green-600 to-green-500 text-white text-2xl font-black rounded-2xl shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 transition-all border-4 border-green-400"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(34, 197, 94, 0.5)',
                  '0 0 40px rgba(34, 197, 94, 0.8)',
                  '0 0 20px rgba(34, 197, 94, 0.5)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8" />
                <span>CASH OUT</span>
                <TrendingUp className="w-8 h-8" />
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* Ambient Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gold/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Info Bar Below Canvas */}
      <div className="mt-4 flex items-center justify-between px-6 py-4 bg-navy/50 rounded-xl border-2 border-gold/20">
        <div className="flex items-center gap-6 text-cream">
          <div>
            <p className="text-xs text-cream/60">STATUS</p>
            <p className="text-lg font-bold">
              {isCrashed ? '💥 Crashed' : isActive ? '🚀 Active' : '⏸️ Waiting'}
            </p>
          </div>
          <div>
            <p className="text-xs text-cream/60">ALTITUDE</p>
            <p className="text-lg font-bold">{progress.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-xs text-cream/60">MULTIPLIER</p>
            <p className="text-lg font-bold text-gold">{multiplier.toFixed(2)}x</p>
          </div>
        </div>
      </div>
    </div>
  );
}
