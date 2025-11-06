'use client';

import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { User } from '@/stores/useStore';
import toast from 'react-hot-toast';

interface ModeBadgeProps {
  user: User | null;
  balance: number;
}

export function ModeBadge({ user, balance }: ModeBadgeProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  if (!user) return null;

  const isVirtual = user.balance_type === 'virtual';

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Déconnecté avec succès');
      router.push('/auth/signin');
    } catch (error) {
      toast.error('Erreur de déconnexion');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-6 left-6 z-40"
    >
      <div
        className={`rounded-2xl border-2 p-4 backdrop-blur-sm shadow-xl ${
          isVirtual
            ? 'bg-green-500/90 border-green-400'
            : 'bg-gold/90 border-yellow-400'
        }`}
      >
        <div className="flex items-center justify-between space-x-3">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">
              {isVirtual ? '🎮' : '💰'}
            </span>
            <div>
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                {isVirtual ? 'Demo Mode' : 'Live Mode'}
              </p>
              <p className="text-2xl font-bold text-white">
                {balance.toFixed(2)} <span className="text-sm">TND</span>
              </p>
            </div>
          </div>
          
          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4 text-white" />
          </motion.button>
        </div>
        
        {isVirtual && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-2"
          >
            <p className="text-xs text-white/90 text-center">
              Practice with virtual money
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
