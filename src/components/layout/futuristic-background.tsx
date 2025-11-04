'use client';

import { motion } from 'framer-motion';

export function FuturisticBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-black">
      {/* Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />
      
      {/* Animated 3D Grid */}
      <motion.div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(212, 175, 55, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(212, 175, 55, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          transform: 'perspective(1000px) rotateX(60deg) scale(2)',
          transformOrigin: 'center center',
        }}
        animate={{
          backgroundPositionY: ['0px', '80px'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Horizon Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
    </div>
  );
}
