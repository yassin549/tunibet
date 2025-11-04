'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Shield, Users, Wallet, Activity, Settings, LogOut, Menu, X, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/admin', label: 'Tableau de bord', icon: Activity },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/retraits', label: 'Retraits', icon: Wallet },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/rounds', label: 'Rounds', icon: Activity },
  { href: '/admin/logs', label: 'Logs d\'audit', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (loading) return;

      if (!user) {
        router.push('/auth/signin');
        return;
      }

      try {
        const response = await fetch('/api/admin/check');
        const data = await response.json();

        if (!data.isAdmin) {
          router.push('/game');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/game');
      } finally {
        setChecking(false);
      }
    }

    checkAdmin();
  }, [user, loading, router]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gold mx-auto mb-4 animate-pulse" />
          <p className="text-cream text-lg">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-navy">
      {/* Top Bar */}
      <header className="bg-navy/95 backdrop-blur-sm border-b border-gold/20 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-cream hover:text-gold transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-gold" />
              <div>
                <h1 className="text-xl font-display text-gold">Admin Panel</h1>
                <p className="text-xs text-cream/60">Tunibet Control Center</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-cream">{user?.display_name || user?.email}</p>
              <p className="text-xs text-gold">Administrateur</p>
            </div>
            <Link
              href="/game"
              className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Retour au jeu</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed lg:sticky top-[73px] left-0 h-[calc(100vh-73px)] w-64 bg-navy/95 backdrop-blur-sm border-r border-gold/20 z-40 overflow-y-auto"
            >
              <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-cream hover:text-gold hover:bg-gold/10 rounded-lg transition-all group"
                    >
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Admin Info */}
              <div className="p-4 mt-8 border-t border-gold/20">
                <div className="bg-gold/5 rounded-lg p-4">
                  <p className="text-xs text-cream/60 mb-2">Session Admin</p>
                  <p className="text-sm text-cream truncate">{user?.email}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Connecté</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
