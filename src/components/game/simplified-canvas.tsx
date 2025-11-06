'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimplifiedCanvasProps {
  multiplier: number;
  isActive: boolean;
  isCrashed: boolean;
  onManualCashout?: () => void;
  canCashout?: boolean;
}

export function SimplifiedCanvas({ 
  multiplier, 
  isActive, 
  isCrashed,
  onManualCashout,
  canCashout 
}: SimplifiedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });

  // Handle canvas resize
  useEffect(() => {
    const updateSize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const width = container.clientWidth;
        const height = Math.min(500, width * 0.625);
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Draw clean visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Minimal grid
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
    ctx.lineWidth = 1;

    // Only draw a few grid lines
    for (let x = 0; x < canvas.width; x += canvas.width / 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += canvas.height / 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw curve if active
    if (isActive || isCrashed) {
      const points: [number, number][] = [];
      const numPoints = 100;
      
      for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * canvas.width;
        const progress = i / numPoints;
        
        // Smoother exponential curve
        const y = canvas.height - (Math.log(1 + progress * (multiplier - 1)) / Math.log(multiplier)) * canvas.height * 0.85;
        
        points.push([x, y]);
      }

      // Draw clean line
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }

      // Gradient stroke
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      if (isCrashed) {
        gradient.addColorStop(0, '#EF4444');
        gradient.addColorStop(1, '#DC2626');
      } else {
        gradient.addColorStop(0, '#D4AF37');
        gradient.addColorStop(1, '#FBBF24');
      }
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Subtle glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = isCrashed ? '#EF4444' : '#D4AF37';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

  }, [multiplier, isActive, isCrashed, canvasSize]);

  return (
    <div className="relative w-full">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="w-full rounded-2xl"
      />

      {/* Multiplier Display */}
      <AnimatePresence>
        {(isActive || isCrashed) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={isActive ? {
                scale: [1, 1.05, 1],
              } : {}}
              transition={{
                duration: 0.5,
                repeat: isActive ? Infinity : 0,
              }}
              className={`text-8xl md:text-9xl font-black ${
                isCrashed 
                  ? 'text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]' 
                  : 'text-gold drop-shadow-[0_0_30px_rgba(212,175,55,0.8)]'
              }`}
            >
              {multiplier.toFixed(2)}x
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Cash-out Button */}
      <AnimatePresence>
        {isActive && canCashout && onManualCashout && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onManualCashout}
              className="px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold rounded-full shadow-2xl hover:shadow-green-500/50 pointer-events-auto"
            >
              CASH OUT
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crashed Overlay */}
      <AnimatePresence>
        {isCrashed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-2xl pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="text-6xl font-black text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,1)]"
            >
              CRASHED!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
