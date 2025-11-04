'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function Coin3D() {
  const coinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!coinRef.current) return;
      
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate rotation based on mouse position
      const rotateY = ((clientX / innerWidth) - 0.5) * 30; // -15 to 15 degrees
      const rotateX = ((clientY / innerHeight) - 0.5) * -30; // -15 to 15 degrees
      
      coinRef.current.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY + 360}deg)
        translateY(-20px)
      `;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center perspective-1000">
      {/* Table Surface */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute bottom-0 w-[600px] h-[400px] bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 rounded-3xl shadow-2xl transform-3d"
        style={{
          transform: 'perspective(1000px) rotateX(60deg)',
          boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Table texture lines */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-px bg-white/10"
              style={{ top: `${(i + 1) * 12.5}%` }}
            />
          ))}
        </div>
      </motion.div>

      {/* Coin */}
      <motion.div
        ref={coinRef}
        initial={{ opacity: 0, y: -100, rotateY: 0 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          rotateY: 360,
        }}
        transition={{ 
          duration: 1.5,
          rotateY: {
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }
        }}
        className="relative preserve-3d"
        style={{
          width: '200px',
          height: '200px',
          transformStyle: 'preserve-3d',
          transform: 'perspective(1000px) rotateY(0deg)',
        }}
      >
        {/* Coin Face (Front) */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-gold to-yellow-600 border-8 border-yellow-400/50 shadow-2xl flex items-center justify-center"
          style={{
            transform: 'translateZ(10px)',
            boxShadow: '0 20px 60px rgba(234, 179, 8, 0.6), inset 0 2px 10px rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* Coin Design - Tunibet Logo */}
          <div className="text-center">
            <div className="text-6xl font-display font-bold text-navy mb-1" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              T
            </div>
            <div className="text-xs font-bold text-navy/80 tracking-wider">
              TUNIBET
            </div>
          </div>
          
          {/* Shine effect */}
          <div 
            className="absolute inset-0 rounded-full opacity-40"
            style={{
              background: 'linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.6) 50%, transparent 70%)',
              animation: 'shine 3s infinite',
            }}
          />
        </div>

        {/* Coin Back */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-gold to-yellow-500 border-8 border-yellow-400/50 shadow-2xl flex items-center justify-center"
          style={{
            transform: 'translateZ(-10px) rotateY(180deg)',
            boxShadow: '0 20px 60px rgba(234, 179, 8, 0.6), inset 0 2px 10px rgba(255, 255, 255, 0.3)',
          }}
        >
          <div className="text-center">
            <div className="text-5xl mb-1">💰</div>
            <div className="text-xs font-bold text-navy/80 tracking-wider">
              CRASH
            </div>
          </div>
        </div>

        {/* Coin Edge */}
        {[...Array(36)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-full"
            style={{
              transform: `rotateY(${i * 10}deg) translateZ(100px)`,
            }}
          >
            <div className="w-1 h-full bg-gradient-to-b from-yellow-500 via-gold to-yellow-600 mx-auto" />
          </div>
        ))}

        {/* Coin shadow on table */}
        <div
          className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-32 h-16 bg-black/40 rounded-full blur-2xl"
          style={{
            transform: 'translateZ(-50px) scale(1.5)',
          }}
        />
      </motion.div>

      {/* Floating particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gold/40 rounded-full"
          initial={{ 
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200,
            opacity: 0 
          }}
          animate={{ 
            y: [null, -100, -200],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeOut"
          }}
          style={{
            left: '50%',
            top: '50%',
          }}
        />
      ))}

      <style jsx>{`
        @keyframes shine {
          0%, 100% {
            transform: translateX(-100%) rotate(135deg);
          }
          50% {
            transform: translateX(100%) rotate(135deg);
          }
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .preserve-3d {
          transform-style: preserve-3d;
        }
        
        .transform-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}
