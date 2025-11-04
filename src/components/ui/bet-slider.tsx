'use client';

import { motion } from 'framer-motion';
import { forwardRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface BetSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  multiplier?: number;
  disabled?: boolean;
  className?: string;
}

const BetSlider = forwardRef<HTMLDivElement, BetSliderProps>(
  (
    {
      value,
      onChange,
      min = 1,
      max = 1000,
      step = 1,
      multiplier = 1.5,
      disabled = false,
      className,
    },
    ref
  ) => {
    const [localValue, setLocalValue] = useState(value);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = (newValue: number) => {
      setLocalValue(newValue);
      onChange(newValue);
    };

    const potentialGain = (localValue * multiplier).toFixed(2);
    const percentage = ((localValue - min) / (max - min)) * 100;

    return (
      <div ref={ref} className={cn('w-full space-y-4', className)}>
        {/* Value and Gain Display */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium text-navy/70 dark:text-cream/70">
              Mise
            </label>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-navy dark:text-cream">
                {localValue.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-gold">TND</span>
            </div>
          </div>

          <motion.div
            className="rounded-xl bg-gold/10 px-4 py-2 border border-gold/30"
            animate={{
              scale: isDragging ? 1.05 : 1,
            }}
          >
            <p className="text-xs font-medium text-navy/60 dark:text-cream/60">
              Gain potentiel
            </p>
            <p className="text-lg font-bold text-gold">
              {potentialGain} TND
            </p>
          </motion.div>
        </div>

        {/* Slider */}
        <div className="relative pt-2">
          {/* Track */}
          <div className="relative h-3 w-full rounded-full bg-navy/20 dark:bg-cream/20">
            {/* Progress fill */}
            <motion.div
              className="absolute h-full rounded-full bg-gradient-to-r from-gold to-gold/80"
              style={{ width: `${percentage}%` }}
              initial={false}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Input (invisible but functional) */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={(e) => handleChange(Number(e.target.value))}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            disabled={disabled}
            className={cn(
              'absolute inset-0 w-full cursor-pointer opacity-0',
              'disabled:cursor-not-allowed'
            )}
            aria-label="Montant de la mise"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={localValue}
            aria-valuetext={`${localValue} TND`}
          />

          {/* Custom thumb */}
          <motion.div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
              'h-6 w-6 rounded-full bg-gold border-4 border-white dark:border-navy',
              'shadow-lg pointer-events-none',
              isDragging && 'scale-125'
            )}
            style={{ left: `${percentage}%` }}
            animate={{
              scale: isDragging ? 1.25 : 1,
            }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Min/Max labels */}
        <div className="flex justify-between text-xs text-navy/50 dark:text-cream/50">
          <span>{min} TND</span>
          <span>{max} TND</span>
        </div>

        {/* Quick amount buttons */}
        <div className="flex gap-2">
          {[10, 50, 100, 500].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleChange(Math.min(amount, max))}
              disabled={disabled}
              className={cn(
                'flex-1 rounded-lg border-2 border-gold/30 bg-transparent px-3 py-2',
                'text-sm font-medium text-gold transition-all',
                'hover:bg-gold/10 hover:border-gold',
                'focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                localValue === amount && 'bg-gold/20 border-gold'
              )}
            >
              {amount}
            </button>
          ))}
        </div>
      </div>
    );
  }
);

BetSlider.displayName = 'BetSlider';

export { BetSlider };
