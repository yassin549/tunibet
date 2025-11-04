'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function FloatingCoinHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      const moveX = (clientX / innerWidth - 0.5) * 20;
      const moveY = (clientY / innerHeight - 0.5) * 20;
      
      containerRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Particle stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
            initial={{
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.2,
              scale: Math.random() * 1.5,
            }}
            animate={{
              opacity: [null, Math.random() * 0.8, Math.random() * 0.3],
              scale: [null, Math.random() * 2, Math.random()],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main coin container with parallax */}
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="relative transition-transform duration-200 ease-out"
        style={{ perspective: '1000px' }}
      >
        {/* Glow effect behind coin */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-[400px] h-[400px] rounded-full bg-gradient-to-r from-yellow-500/40 via-yellow-600/30 to-amber-500/40 blur-3xl" />
        </motion.div>

        {/* Orbital rings */}
        {[0, 1, 2].map((ringIndex) => (
          <motion.div
            key={ringIndex}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              rotateX: 75,
              rotateZ: 360,
            }}
            transition={{
              opacity: {
                duration: 2,
                repeat: Infinity,
                delay: ringIndex * 0.3,
              },
              rotateZ: {
                duration: 20 + ringIndex * 5,
                repeat: Infinity,
                ease: 'linear',
              },
            }}
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="rounded-full border-2"
              style={{
                width: `${350 + ringIndex * 80}px`,
                height: `${350 + ringIndex * 80}px`,
                borderColor: `rgba(${255 - ringIndex * 20}, ${215 - ringIndex * 30}, ${0 + ringIndex * 20}, ${0.4 - ringIndex * 0.05})`,
                boxShadow: `0 0 30px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.15)`,
              }}
            />
          </motion.div>
        ))}

        {/* Floating particles around coin */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const radius = 180;
          return (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
              initial={{
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
              }}
              animate={{
                x: Math.cos(angle + Date.now() * 0.001) * radius,
                y: Math.sin(angle + Date.now() * 0.001) * radius,
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.5, 1],
              }}
              transition={{
                x: { duration: 10, repeat: Infinity, ease: 'linear' },
                y: { duration: 10, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 2, repeat: Infinity },
                scale: { duration: 2, repeat: Infinity },
              }}
              style={{
                left: '50%',
                top: '50%',
                filter: 'blur(1px)',
              }}
            />
          );
        })}

        {/* Main 3D Coin */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotateY: [0, 360],
          }}
          transition={{
            y: {
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            rotateY: {
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
          className="relative w-64 h-64"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Coin front face */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
              boxShadow: `
                0 0 60px rgba(255, 215, 0, 0.8),
                0 0 100px rgba(255, 165, 0, 0.6),
                inset 0 0 60px rgba(255, 255, 255, 0.3),
                inset 0 -20px 40px rgba(0, 0, 0, 0.2)
              `,
              transform: 'translateZ(20px)',
              border: '8px solid rgba(255, 215, 0, 0.5)',
            }}
          >
            {/* Coin design */}
            <div className="text-center relative z-10">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl font-display font-bold bg-gradient-to-b from-navy via-navy/90 to-navy/70 bg-clip-text text-transparent"
                style={{
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}
              >
                T
              </motion.div>
              <div className="text-sm font-bold text-navy/80 tracking-widest mt-2">
                TUNIBET
              </div>
            </div>

            {/* Animated shine sweep */}
            <motion.div
              animate={{
                x: ['-200%', '200%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-0 rounded-full overflow-hidden"
            >
              <div
                className="absolute inset-0 w-1/2 h-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                  transform: 'skewX(-20deg)',
                }}
              />
            </motion.div>

            {/* Radial glow rings on coin */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`glow-${i}`}
                className="absolute inset-0 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                }}
                style={{
                  border: '2px solid rgba(255, 215, 0, 0.6)',
                }}
              />
            ))}
          </div>

          {/* Coin back face */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 50%, #FFD700 100%)',
              boxShadow: '0 0 60px rgba(255, 215, 0, 0.8), inset 0 0 40px rgba(255, 255, 255, 0.2)',
              transform: 'translateZ(-20px) rotateY(180deg)',
              border: '8px solid rgba(255, 215, 0, 0.5)',
            }}
          >
            <div className="text-center" style={{ transform: 'rotateY(180deg)' }}>
              <div className="text-7xl">💰</div>
              <div className="text-sm font-bold text-navy/80 tracking-widest mt-2">
                CRASH
              </div>
            </div>
          </div>

          {/* Coin edge (sides) */}
          {[...Array(36)].map((_, i) => (
            <div
              key={`edge-${i}`}
              className="absolute w-full h-full"
              style={{
                transform: `rotateY(${i * 10}deg) translateZ(128px)`,
              }}
            >
              <div className="w-2 h-full bg-gradient-to-r from-yellow-600 via-gold to-yellow-500 mx-auto" />
            </div>
          ))}
        </motion.div>

        {/* Light beams from coin */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`beam-${i}`}
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              rotate: 360,
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              rotate: {
                duration: 15 + i * 5,
                repeat: Infinity,
                ease: 'linear',
              },
              opacity: {
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
              },
            }}
          >
            <div
              className="w-1 bg-gradient-to-t from-transparent via-yellow-500/30 to-transparent"
              style={{
                height: '600px',
                transform: `rotate(${i * 45}deg)`,
                filter: 'blur(2px)',
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-32 bg-gradient-to-t from-yellow-500/20 via-amber-500/10 to-transparent blur-2xl" />
    </div>
  );
}
