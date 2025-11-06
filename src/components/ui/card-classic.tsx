'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardClassicProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  variant?: 'glass' | 'cream' | 'navy';
  hover?: boolean;
}

const CardClassic = forwardRef<HTMLDivElement, CardClassicProps>(
  ({ className, variant = 'glass', hover = true, children, ...props }, ref) => {
    const variants = {
      glass: 'bg-cream/50 dark:bg-navy/50 backdrop-blur-xl border-gold/30',
      cream: 'bg-cream dark:bg-navy/80 border-gold/50',
      navy: 'bg-navy dark:bg-navy border-gold',
    };

    const classNames = cn(
      'rounded-2xl border-2 p-6 shadow-lg transition-shadow duration-300',
      'hover:shadow-xl hover:shadow-gold/20',
      variants[variant],
      className
    );

    if (hover) {
      return (
        <motion.div
          ref={ref}
          className={classNames}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          {...(props as HTMLMotionProps<'div'>)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={classNames} {...props}>
        {children}
      </div>
    );
  }
);

CardClassic.displayName = 'CardClassic';

// Card sub-components for better composition
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4 space-y-1.5', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-display text-2xl font-bold text-navy dark:text-cream', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-navy/70 dark:text-cream/70', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 flex items-center justify-between border-t border-gold/20 pt-4', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { CardClassic, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
