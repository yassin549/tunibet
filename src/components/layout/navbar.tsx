'use client';

import { useStore } from '@/stores/useStore';
import { useAuth } from '@/contexts/auth-context';
import { User as UserIcon, LogOut, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function Navbar() {
  const { user, balance } = useStore();
  const { isGuest, signOut } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Always use dark mode
    document.documentElement.classList.add('dark');
  }, []);

  // Mode badge indicator
  const getModeInfo = () => {
    if (!user) return null;
    return {
      isVirtual: user.balance_type === 'virtual',
      icon: user.balance_type === 'virtual' ? '🎮' : '💰',
      label: user.balance_type === 'virtual' ? 'Demo' : 'Live',
    };
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/signin');
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
      <div className="rounded-full border border-yellow-500/20 bg-black/60 backdrop-blur-2xl px-8 shadow-2xl shadow-yellow-500/10">
        <div className="flex h-20 items-center justify-between">
          {/* Logo - Left */}
          <Link href="/" className="font-display text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent hover:from-yellow-300 hover:to-yellow-500 transition-all">
            Tunibet
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Balance Display with Mode Indicator - Only show if user exists */}
            {user && (() => {
              const modeInfo = getModeInfo();
              if (!modeInfo) return null;
              
              return (
                <div className={`flex items-center space-x-3 rounded-full border-2 px-4 py-2 transition-all ${
                  modeInfo.isVirtual 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-gold bg-gold/10 animate-gold-glow'
                }`}>
                  <span className="text-xl">{modeInfo.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-cream/60">
                      {modeInfo.label}
                    </p>
                    <p className="text-lg font-bold text-cream">
                      {balance.toFixed(2)} <span className="text-sm">TND</span>
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* User Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 rounded-full border-2 border-gold/30 bg-gold/5 px-4 py-2 hover:bg-gold/10 transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-gold" />
                  <span className="text-sm font-medium text-cream">
                    {user.display_name || 'Guest'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border-2 border-gold/30 bg-navy shadow-lg overflow-hidden">
                    <div className="p-2 space-y-1">
                      {isGuest ? (
                        <Link
                          href="/auth/signin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-cream hover:bg-gold/10 transition-colors"
                        >
                          <UserIcon className="h-4 w-4" />
                          <span>Sign In</span>
                        </Link>
                      ) : (
                        <>
                          <Link
                            href="/profil"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-cream hover:bg-gold/10 transition-colors"
                          >
                            <UserIcon className="h-4 w-4" />
                            <span>My Profile</span>
                          </Link>
                          <Link
                            href="/wallet"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-cream hover:bg-gold/10 transition-colors"
                          >
                            <Wallet className="h-4 w-4" />
                            <span>Wallet</span>
                          </Link>
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              handleSignOut();
                            }}
                            className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-crash hover:bg-crash/10 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sign In Button - Only show if no user */}
            {!user && (
              <Link
                href="/auth/signin"
                className="rounded-full border-2 border-gold bg-gold/10 px-6 py-2.5 text-sm font-medium text-gold hover:bg-gold/20 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
