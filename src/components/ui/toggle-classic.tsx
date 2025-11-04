'use client';

import { motion } from 'framer-motion';
import { forwardRef, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export interface ToggleClassicProps {
  value: boolean;
  onChange: (value: boolean) => void;
  labelLeft: string;
  labelRight: string;
  disabled?: boolean;
  className?: string;
}

const ToggleClassic = forwardRef<HTMLButtonElement, ToggleClassicProps>(
  ({ value, onChange, labelLeft, labelRight, disabled = false, className }, ref) => {
    const handleToggle = () => {
      if (!disabled) {
        onChange(!value);
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
      // Arrow keys for accessibility
      if (e.key === 'ArrowLeft' && value) {
        onChange(false);
      }
      if (e.key === 'ArrowRight' && !value) {
        onChange(true);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={`Basculer entre ${labelLeft} et ${labelRight}`}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative inline-flex h-12 w-40 items-center rounded-full transition-colors',
          'bg-navy/20 dark:bg-cream/20',
          'focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        {/* Sliding pill */}
        <motion.span
          className="absolute h-10 w-[4.5rem] rounded-full bg-gold shadow-lg"
          initial={false}
          animate={{
            x: value ? 'calc(100% + 0.25rem)' : '0.25rem',
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        />

        {/* Left label */}
        <span
          className={cn(
            'relative z-10 w-20 text-center text-sm font-bold transition-colors',
            !value ? 'text-navy dark:text-navy' : 'text-navy/50 dark:text-cream/50'
          )}
        >
          {labelLeft}
        </span>

        {/* Right label */}
        <span
          className={cn(
            'relative z-10 w-20 text-center text-sm font-bold transition-colors',
            value ? 'text-navy dark:text-navy' : 'text-navy/50 dark:text-cream/50'
          )}
        >
          {labelRight}
        </span>
      </button>
    );
  }
);

ToggleClassic.displayName = 'ToggleClassic';

export { ToggleClassic };
