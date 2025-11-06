'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlaneCanvas3DProps {
  multiplier: number;
  isActive: boolean;
  isCrashed: boolean;
  onManualCashout?: () => void;
  canCashout?: boolean;
}

export function PlaneCanvas3D({ 
  multiplier, 
  isActive, 
  isCrashed,
  onManualCashout,
  canCashout 
}: PlaneCanvas3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  const [phase, setPhase] = useState<'3d' | '2d'>('3d');
  const pointsRef = useRef<[number, number][]>([]);
  const plane3DPosRef = useRef({ x: 50, y: 250, z: 0 });

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

  // Reset when game starts
  useEffect(() => {
    if (isActive && !isCrashed) {
      setPhase('3d');
      pointsRef.current = [];
      plane3DPosRef.current = { x: 50, y: canvasSize.height - 100, z: 0 };
    }
  }, [isActive, isCrashed, canvasSize.height]);

  // Draw visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark background with gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#0F172A');
      bgGradient.addColorStop(1, '#1E293B');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Minimal grid
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
      ctx.lineWidth = 1;

      for (let x = 0; x < canvas.width; x += canvas.width / 6) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += canvas.height / 5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      if (isActive || isCrashed) {
        const progress = Math.min((multiplier - 1) / 5, 1); // 0 to 1 over first 5x
        
        // Transition from 3D to 2D at 1.5x
        if (multiplier >= 1.5 && phase === '3d') {
          setPhase('2d');
        }

        if (phase === '3d') {
          // 3D Phase - Plane flying in perspective
          const zProgress = (multiplier - 1) / 0.5; // 0 to 1 during 1.0x to 1.5x
          
          // 3D perspective: plane starts far and comes closer
          const perspectiveScale = 0.3 + zProgress * 0.7; // 0.3 to 1.0
          const planeX = canvas.width * 0.3 + (canvas.width * 0.4 * zProgress);
          const planeY = canvas.height * 0.7 - (canvas.height * 0.3 * zProgress);
          
          // Draw 3D plane (simplified)
          ctx.save();
          ctx.translate(planeX, planeY);
          ctx.scale(perspectiveScale, perspectiveScale);
          
          // Plane body (golden)
          const planeGradient = ctx.createLinearGradient(-30, -10, 30, 10);
          planeGradient.addColorStop(0, '#FBBF24');
          planeGradient.addColorStop(0.5, '#D4AF37');
          planeGradient.addColorStop(1, '#B8860B');
          
          ctx.fillStyle = planeGradient;
          ctx.beginPath();
          ctx.moveTo(-30, 0);
          ctx.lineTo(30, 0);
          ctx.lineTo(40, -5);
          ctx.lineTo(30, -10);
          ctx.lineTo(-30, -10);
          ctx.closePath();
          ctx.fill();
          
          // Wings
          ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(-30, 20);
          ctx.lineTo(-30, 15);
          ctx.lineTo(-10, -5);
          ctx.closePath();
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(-30, -25);
          ctx.lineTo(-30, -20);
          ctx.lineTo(-10, -5);
          ctx.closePath();
          ctx.fill();
          
          // Tail
          ctx.beginPath();
          ctx.moveTo(-28, -5);
          ctx.lineTo(-35, -20);
          ctx.lineTo(-30, -20);
          ctx.lineTo(-28, -8);
          ctx.closePath();
          ctx.fill();
          
          // Glow effect
          ctx.shadowBlur = 25;
          ctx.shadowColor = '#D4AF37';
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.restore();
          
          // Add light trail
          if (zProgress > 0.3) {
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(canvas.width * 0.1, canvas.height * 0.8);
            ctx.lineTo(planeX, planeY);
            ctx.stroke();
          }
          
        } else {
          // 2D Phase - Line trail growing
          const currentX = Math.min((multiplier - 1.5) / 4.5 * canvas.width * 0.8 + canvas.width * 0.1, canvas.width - 50);
          const currentY = canvas.height - (Math.log(multiplier - 0.5) / Math.log(6)) * canvas.height * 0.85;
          
          // Add point to trail
          pointsRef.current.push([currentX, currentY]);
          
          // Limit points to keep performance
          if (pointsRef.current.length > 200) {
            pointsRef.current.shift();
          }
          
          // Draw the line trail
          if (pointsRef.current.length > 1) {
            ctx.beginPath();
            ctx.moveTo(pointsRef.current[0][0], pointsRef.current[0][1]);
            
            for (let i = 1; i < pointsRef.current.length; i++) {
              ctx.lineTo(pointsRef.current[i][0], pointsRef.current[i][1]);
            }
            
            // Gradient stroke
            const lineGradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
            if (isCrashed) {
              lineGradient.addColorStop(0, '#EF4444');
              lineGradient.addColorStop(1, '#DC2626');
            } else {
              lineGradient.addColorStop(0, '#D4AF37');
              lineGradient.addColorStop(0.5, '#FBBF24');
              lineGradient.addColorStop(1, '#FCD34D');
            }
            
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 15;
            ctx.shadowColor = isCrashed ? '#EF4444' : '#D4AF37';
            ctx.stroke();
            
            // Fill area under line
            ctx.lineTo(currentX, canvas.height);
            ctx.lineTo(pointsRef.current[0][0], canvas.height);
            ctx.closePath();
            
            const fillGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            if (isCrashed) {
              fillGradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
              fillGradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
            } else {
              fillGradient.addColorStop(0, 'rgba(212, 175, 55, 0.3)');
              fillGradient.addColorStop(1, 'rgba(212, 175, 55, 0.05)');
            }
            
            ctx.fillStyle = fillGradient;
            ctx.shadowBlur = 0;
            ctx.fill();
          }
          
          // Draw 2D plane at the end of trail
          if (!isCrashed) {
            ctx.save();
            ctx.translate(currentX, currentY);
            
            // Calculate angle based on recent points
            let angle = 0;
            if (pointsRef.current.length > 5) {
              const lastPoints = pointsRef.current.slice(-5);
              const dy = lastPoints[lastPoints.length - 1][1] - lastPoints[0][1];
              const dx = lastPoints[lastPoints.length - 1][0] - lastPoints[0][0];
              angle = Math.atan2(-dy, dx);
            }
            
            ctx.rotate(angle);
            
            // 2D plane silhouette
            ctx.fillStyle = '#FBBF24';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#D4AF37';
            
            ctx.beginPath();
            ctx.moveTo(20, 0);
            ctx.lineTo(-10, 5);
            ctx.lineTo(-10, -5);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
          }
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [multiplier, isActive, isCrashed, canvasSize, phase]);

  return (
    <div className="relative w-full">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="w-full rounded-2xl shadow-2xl"
      />

      {/* Multiplier Display */}
      <AnimatePresence>
        {(isActive || isCrashed) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute top-8 left-8 pointer-events-none"
          >
            <motion.div
              animate={isActive ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{
                duration: 0.8,
                repeat: isActive ? Infinity : 0,
              }}
              className={`text-7xl md:text-8xl font-black ${
                isCrashed 
                  ? 'text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.9)]' 
                  : 'text-gold drop-shadow-[0_0_30px_rgba(212,175,55,0.9)]'
              }`}
            >
              {multiplier.toFixed(2)}x
            </motion.div>
            {isActive && !isCrashed && (
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-gold/80 font-bold text-xl mt-2 text-center"
              >
                {phase === '3d' ? '🛫 Taking off...' : '🚀 Flying!'}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Cash-out Button - PROMINENT */}
      <AnimatePresence>
        {isActive && canCashout && onManualCashout && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(34, 197, 94, 0.5)',
                  '0 0 40px rgba(34, 197, 94, 0.8)',
                  '0 0 20px rgba(34, 197, 94, 0.5)',
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              onClick={onManualCashout}
              className="group relative px-16 py-6 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white text-3xl font-black rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Animated background */}
              <motion.div
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
              
              <span className="relative flex items-center gap-3">
                💰 CASH OUT
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-4xl"
                >
                  ✓
                </motion.span>
              </span>
              
              {/* Current win amount */}
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-900/90 px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap"
              >
                Win: {(multiplier * 100).toFixed(0)} TND
              </motion.div>
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
            className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-2xl backdrop-blur-sm pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
                className="text-8xl font-black text-red-500 drop-shadow-[0_0_50px_rgba(239,68,68,1)] mb-4"
              >
                💥 CRASHED!
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-red-400"
              >
                at {multiplier.toFixed(2)}x
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
