'use client';

import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { forwardRef, useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export interface CopyGoldProps {
  value: string;
  label?: string;
  message?: string;
  className?: string;
}

const CopyGold = forwardRef<HTMLButtonElement, CopyGoldProps>(
  ({ value, label, message = 'ID copié pour @tunibetbot', className }, ref) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isGlowing, setIsGlowing] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(value);
        setIsCopied(true);
        setIsGlowing(true);

        // Show toast notification
        toast.success(message, {
          icon: '✨',
          duration: 2000,
        });

        // Reset after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
          setIsGlowing(false);
        }, 2000);
      } catch (err) {
        toast.error('Échec de la copie');
      }
    };

    return (
      <div className={cn('inline-flex items-center space-x-2', className)}>
        {/* Label */}
        {label && (
          <span className="text-sm font-medium text-navy/70 dark:text-cream/70">
            {label}
          </span>
        )}

        {/* Value display */}
        <div className="flex items-center space-x-2 rounded-lg border border-gold/30 bg-gold/5 px-3 py-2">
          <code className="text-sm font-mono text-navy dark:text-cream">
            {value.length > 20 ? `${value.slice(0, 20)}...` : value}
          </code>

          {/* Copy button */}
          <motion.button
            ref={ref}
            type="button"
            onClick={handleCopy}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              'hover:bg-gold/20 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2',
              isGlowing && 'animate-gold-glow'
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isCopied ? 'Copié' : 'Copier'}
          >
            {isCopied ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              </motion.div>
            ) : (
              <Copy className="h-4 w-4 text-gold" />
            )}
          </motion.button>
        </div>

        {/* Copied indicator */}
        {isCopied && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs font-medium text-green-600 dark:text-green-400"
          >
            Copié!
          </motion.span>
        )}
      </div>
    );
  }
);

CopyGold.displayName = 'CopyGold';

export { CopyGold };
