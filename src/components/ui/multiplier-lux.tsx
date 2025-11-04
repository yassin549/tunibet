'use client';

import { motion } from 'framer-motion';
import { HTMLAttributes, forwardRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface MultiplierLuxProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}

const MultiplierLux = forwardRef<HTMLDivElement, MultiplierLuxProps>(
  ({ className, value, size = 'lg', animate = true, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
      setDisplayValue(value);
    }, [value]);

    const sizes = {
      sm: 'text-4xl md:text-5xl',
      md: 'text-6xl md:text-7xl',
      lg: 'text-7xl md:text-8xl lg:text-9xl',
      xl: 'text-8xl md:text-9xl lg:text-[12rem]',
    };

    const formattedValue = displayValue.toFixed(2);

    return (
      <div
        ref={ref}
        className={cn('relative inline-block', className)}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        {...props}
      >
        {/* Screen reader announcement */}
        <span className="sr-only">
          Multiplicateur actuel: {formattedValue}x
        </span>

        {/* Visual multiplier */}
        <motion.div
          className={cn(
            'font-bold text-gold',
            'drop-shadow-[0_0_30px_rgba(212,175,55,0.5)]',
            sizes[size]
          )}
          animate={
            animate
              ? {
                  scale: [1, 1.02, 1],
                }
              : {}
          }
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          aria-hidden="true"
        >
          <span className="tabular-nums tracking-tight">
            {formattedValue}
          </span>
          <span className="text-gold/80">x</span>
        </motion.div>

        {/* Glow effect */}
        <div
          className="absolute inset-0 -z-10 blur-3xl opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)',
          }}
        />
      </div>
    );
  }
);

MultiplierLux.displayName = 'MultiplierLux';

export { MultiplierLux };
