'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/stores/useStore';
import { MultiplierLux } from '@/components/ui/multiplier-lux';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { multiplier, gameStatus } = useStore();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Handle canvas resize
  useEffect(() => {
    const updateSize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const width = container.clientWidth;
        const height = Math.min(600, width * 0.6); // 5:3 aspect ratio
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Draw game visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0F172A');
    gradient.addColorStop(1, '#1E293B');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw curve if game is active
    if (gameStatus === 'active' || gameStatus === 'crashed') {
      const points: [number, number][] = [];
      const numPoints = 100;
      
      for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * canvas.width;
        const progress = i / numPoints;
        
        // Exponential curve based on multiplier
        const y = canvas.height - (Math.log(1 + progress * (multiplier - 1)) / Math.log(multiplier)) * canvas.height * 0.8;
        
        points.push([x, y]);
      }

      // Draw curve
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }

      // Gradient stroke
      const curveGradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      if (gameStatus === 'crashed') {
        curveGradient.addColorStop(0, '#B91C1C');
        curveGradient.addColorStop(1, '#DC2626');
      } else {
        curveGradient.addColorStop(0, '#D4AF37');
        curveGradient.addColorStop(1, '#F59E0B');
      }
      
      ctx.strokeStyle = curveGradient;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Fill area under curve
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      
      const fillGradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      if (gameStatus === 'crashed') {
        fillGradient.addColorStop(0, 'rgba(185, 28, 28, 0.2)');
        fillGradient.addColorStop(1, 'rgba(185, 28, 28, 0)');
      } else {
        fillGradient.addColorStop(0, 'rgba(212, 175, 55, 0.2)');
        fillGradient.addColorStop(1, 'rgba(212, 175, 55, 0)');
      }
      ctx.fillStyle = fillGradient;
      ctx.fill();
    }

    // Draw waiting message
    if (gameStatus === 'waiting' || gameStatus === 'betting') {
      ctx.fillStyle = 'rgba(245, 245, 240, 0.5)';
      ctx.font = 'bold 24px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        gameStatus === 'waiting' ? 'En attente du prochain round...' : 'Placez vos mises!',
        canvas.width / 2,
        canvas.height / 2
      );
    }

    // Draw crashed message
    if (gameStatus === 'crashed') {
      ctx.fillStyle = '#B91C1C';
      ctx.font = 'bold 48px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CRASHED!', canvas.width / 2, canvas.height / 2);
    }

  }, [multiplier, gameStatus, canvasSize]);

  return (
    <div className="relative w-full">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="w-full rounded-2xl border-2 border-gold/30 shadow-lg"
      />

      {/* Multiplier Overlay */}
      {(gameStatus === 'active' || gameStatus === 'crashed') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <MultiplierLux 
            value={multiplier} 
            size="xl" 
            animate={gameStatus === 'active'}
          />
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <div className={`
          rounded-full px-4 py-2 text-sm font-bold backdrop-blur-sm
          ${gameStatus === 'waiting' ? 'bg-navy/80 text-cream' : ''}
          ${gameStatus === 'betting' ? 'bg-gold/80 text-navy' : ''}
          ${gameStatus === 'active' ? 'bg-green-500/80 text-white' : ''}
          ${gameStatus === 'crashed' ? 'bg-crash/80 text-white' : ''}
        `}>
          {gameStatus === 'waiting' && '⏳ En attente'}
          {gameStatus === 'betting' && '💰 Paris ouverts'}
          {gameStatus === 'active' && '🚀 En cours'}
          {gameStatus === 'crashed' && '💥 Crash!'}
        </div>
      </div>
    </div>
  );
}
