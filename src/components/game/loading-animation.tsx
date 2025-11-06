'use client';

import { motion } from 'framer-motion';

export function LoadingAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col items-center justify-center space-y-8"
    >
      {/* Engine Loading Animation */}
      <div className="relative">
        {/* Rotating outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-32 h-32 border-4 border-gold/30 border-t-gold rounded-full"
        />
        
        {/* Pulsing inner circle */}
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 m-auto w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center"
        >
          <div className="w-8 h-8 bg-gold rounded-full" />
        </motion.div>
      </div>

      {/* Loading Text */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="text-center space-y-2"
      >
        <p className="text-xl font-bold text-gold">Loading Game Engine</p>
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 bg-gold rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
