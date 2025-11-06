'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Gamepad2, User } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import toast from 'react-hot-toast';

interface DockIconProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive: boolean;
}

function DockIcon({ icon, label, onClick, isActive }: DockIconProps) {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      className={`relative w-14 h-14 rounded-2xl transition-colors duration-150 flex items-center justify-center ${
        isActive
          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/50'
          : 'bg-white/10 backdrop-blur-md hover:bg-white/20'
      }`}
      whileHover={{ 
        scale: 1.6,
        y: -20,
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.5
      }}
    >
      <div className={`${isActive ? 'text-black' : 'text-cream'}`}>
        {icon}
      </div>
      
      {/* Label tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: -10 }}
        className="absolute -top-16 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-cream whitespace-nowrap pointer-events-none z-50"
      >
        {label}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45" />
      </motion.div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-400"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

export function Dock() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleNavigation = (path: string, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      toast.error('Please sign in to continue');
      router.push('/auth/signin');
      return;
    }
    router.push(path);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const dockItems = [
    {
      icon: <Home className="w-8 h-8" />,
      label: 'Home',
      path: '/',
      requiresAuth: false,
    },
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      label: 'Play',
      path: '/game',
      requiresAuth: true,
    },
    {
      icon: <User className="w-8 h-8" />,
      label: 'Profile',
      path: '/profil',
      requiresAuth: true,
    },
  ];

  return (
    <motion.div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="relative">
        {/* Dock background */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl" />
        
        {/* Dock content */}
        <div className="relative flex items-center gap-4 px-6 py-4">
          {dockItems.map((item) => (
            <DockIcon
              key={item.path}
              icon={item.icon}
              label={item.label}
              onClick={() => handleNavigation(item.path, item.requiresAuth)}
              isActive={isActive(item.path)}
            />
          ))}
        </div>

        {/* User indicator dot */}
        {user && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-green-500 border-2 border-black shadow-lg"
            title="Connected"
          />
        )}
      </div>
    </motion.div>
  );
}
