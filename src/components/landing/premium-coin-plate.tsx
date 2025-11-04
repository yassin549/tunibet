'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

export function PremiumCoinPlate() {
  const coinRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [activePlateSegment, setActivePlateSegment] = useState(0);
  const plateControls = useAnimation();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Normalize to 0-1 range
      const x = clientX / innerWidth;
      const y = clientY / innerHeight;
      
      setMousePosition({ x, y });

      // Determine which plate segment should be active (0-3)
      const angle = Math.atan2(y - 0.5, x - 0.5);
      const degrees = (angle * 180 / Math.PI + 360 + 45) % 360;
      const segment = Math.floor(degrees / 90);
      setActivePlateSegment(segment);

      if (!coinRef.current) return;
      
      // Calculate coin roll position based on mouse
      const rollX = (y - 0.5) * 40; // Tilt forward/backward
      const rollY = (x - 0.5) * 40; // Tilt left/right
      
      // Position coin on the plate based on mouse
      const posX = (x - 0.5) * 100; // -50 to 50
      const posY = (y - 0.5) * 100; // -50 to 50
      
      coinRef.current.style.transform = `
        perspective(1200px)
        translate3d(${posX}px, ${posY}px, 60px)
        rotateX(${rollX}deg)
        rotateY(${rollY}deg)
      `;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Rotate plate based on active segment
  useEffect(() => {
    plateControls.start({
      rotateZ: activePlateSegment * 90,
      transition: { duration: 0.8, ease: 'easeInOut' }
    });
  }, [activePlateSegment, plateControls]);

  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1200px' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-[500px] h-[500px] rounded-full bg-gold/20 blur-3xl"
        />
      </div>

      {/* Plate with 4 segments */}
      <motion.div
        ref={plateRef}
        animate={plateControls}
        className="relative"
        style={{
          width: '400px',
          height: '400px',
          transformStyle: 'preserve-3d',
          transform: 'perspective(1200px) rotateX(60deg)',
        }}
      >
        {/* Plate base */}
        <div className="absolute inset-0 rounded-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* 4 Segments */}
          {[0, 1, 2, 3].map((segment) => {
            const isActive = segment === activePlateSegment;
            const rotation = segment * 90;
            
            return (
              <motion.div
                key={segment}
                className="absolute inset-0"
                style={{
                  clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)',
                  transformOrigin: 'center',
                  transform: `rotateZ(${rotation}deg)`,
                }}
                animate={{
                  translateZ: isActive ? 20 : 0,
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{ duration: 0.4 }}
              >
                <div 
                  className={`w-full h-full rounded-full transition-all duration-500 ${
                    isActive 
                      ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 shadow-2xl' 
                      : 'bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950'
                  }`}
                  style={{
                    boxShadow: isActive 
                      ? '0 20px 60px rgba(16, 185, 129, 0.4), inset 0 5px 20px rgba(255, 255, 255, 0.1)'
                      : '0 10px 30px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Segment decoration */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-gold scale-150' : 'bg-emerald-600/50'
                      }`}
                      style={{
                        transform: `rotateZ(-${rotation}deg) translate(0, -80px)`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Center hub */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotateZ: [0, 360],
              }}
              transition={{
                scale: { duration: 2, repeat: Infinity },
                rotateZ: { duration: 8, repeat: Infinity, ease: 'linear' }
              }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-gold via-yellow-600 to-yellow-700 shadow-2xl"
              style={{
                boxShadow: '0 0 40px rgba(234, 179, 8, 0.6), inset 0 2px 15px rgba(255, 255, 255, 0.3)',
              }}
            >
              <div className="absolute inset-0 rounded-full flex items-center justify-center text-navy font-bold text-lg">
                T
              </div>
            </motion.div>
          </div>

          {/* Plate edge highlight */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              border: '4px solid rgba(234, 179, 8, 0.3)',
              boxShadow: 'inset 0 0 30px rgba(234, 179, 8, 0.2)',
            }}
          />
        </div>

        {/* Plate shadow */}
        <div
          className="absolute inset-0 rounded-full bg-black/60 blur-2xl"
          style={{
            transform: 'translateZ(-50px) scale(1.1)',
          }}
        />
      </motion.div>

      {/* Rolling Coin */}
      <motion.div
        ref={coinRef}
        initial={{ opacity: 0, scale: 0, translateZ: 200 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          translateZ: 60,
        }}
        transition={{ 
          duration: 1.2,
          ease: "easeOut"
        }}
        className="absolute"
        style={{
          width: '120px',
          height: '120px',
          transformStyle: 'preserve-3d',
          pointerEvents: 'none',
        }}
      >
        {/* Coin face */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-gold to-yellow-600 flex items-center justify-center"
          style={{
            transform: 'translateZ(8px)',
            boxShadow: `
              0 20px 60px rgba(234, 179, 8, 0.8),
              0 0 80px rgba(234, 179, 8, 0.5),
              inset 0 2px 10px rgba(255, 255, 255, 0.4),
              inset 0 -2px 10px rgba(0, 0, 0, 0.2)
            `,
            border: '6px solid rgba(255, 215, 0, 0.6)',
          }}
        >
          {/* Coin design */}
          <div className="text-center">
            <div 
              className="text-5xl font-display font-bold text-navy mb-1" 
              style={{ 
                textShadow: '0 2px 4px rgba(0,0,0,0.2), 0 0 10px rgba(255,255,255,0.5)' 
              }}
            >
              T
            </div>
            <div className="text-[10px] font-bold text-navy/80 tracking-wider">
              TUNIBET
            </div>
          </div>

          {/* Animated shine */}
          <motion.div
            animate={{
              x: ['-200%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 rounded-full overflow-hidden"
          >
            <div 
              className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{ transform: 'skewX(-20deg)' }}
            />
          </motion.div>

          {/* Edge glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-yellow-500/30" />
        </div>

        {/* Coin back */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-gold to-yellow-500 flex items-center justify-center"
          style={{
            transform: 'translateZ(-8px) rotateY(180deg)',
            boxShadow: '0 20px 60px rgba(234, 179, 8, 0.8), inset 0 2px 10px rgba(255, 255, 255, 0.4)',
            border: '6px solid rgba(255, 215, 0, 0.6)',
          }}
        >
          <div className="text-center" style={{ transform: 'rotateY(180deg)' }}>
            <div className="text-4xl mb-1">💰</div>
            <div className="text-[10px] font-bold text-navy/80 tracking-wider">
              CRASH
            </div>
          </div>
        </div>

        {/* Coin edge (cylinder) */}
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-full"
            style={{
              transform: `rotateY(${i * 15}deg) translateZ(60px)`,
            }}
          >
            <div className="w-1 h-full bg-gradient-to-b from-yellow-500 via-gold to-yellow-600 mx-auto" />
          </div>
        ))}
      </motion.div>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-gold"
          initial={{ 
            x: Math.cos(i * Math.PI / 4) * 150,
            y: Math.sin(i * Math.PI / 4) * 150,
            opacity: 0,
            scale: 0,
          }}
          animate={{ 
            x: Math.cos(i * Math.PI / 4) * 250,
            y: Math.sin(i * Math.PI / 4) * 250,
            opacity: [0, 1, 0],
            scale: [0, 2, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut"
          }}
          style={{
            left: '50%',
            top: '50%',
          }}
        />
      ))}

      {/* Instruction text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center"
      >
        <p className="text-sm text-navy/60 dark:text-cream/60 font-medium">
          Déplacez votre souris pour faire rouler la pièce
        </p>
      </motion.div>
    </div>
  );
}
