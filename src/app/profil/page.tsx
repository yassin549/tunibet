'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { FuturisticBackground } from '@/components/layout/futuristic-background';
import { motion } from 'framer-motion';
import { User, Settings, History, Receipt } from 'lucide-react';
import { ProfileOverviewModern } from '@/components/profile/profile-overview-modern';
import { AccountSettings } from '@/components/profile/account-settings';
import { BetHistory } from '@/components/profile/bet-history';
import { TransactionExport } from '@/components/profile/transaction-export';

type Tab = 'overview' | 'settings' | 'history' | 'export';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <FuturisticBackground />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent mx-auto" />
            <p className="text-white">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: User },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
    { id: 'history' as Tab, label: 'History', icon: History },
    { id: 'export' as Tab, label: 'Export', icon: Receipt },
  ];

  return (
    <main className="min-h-screen relative py-12">
      <FuturisticBackground />
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white">
              👤 My Profile
            </h1>
            <p className="text-lg text-gray-400">
              Manage your account and preferences
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="flex flex-wrap justify-center gap-2 border-b-2 border-yellow-500/20 pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-t-xl font-semibold transition-all relative ${
                    activeTab === tab.id
                      ? 'bg-yellow-500/10 text-yellow-400 border-2 border-yellow-500 border-b-0'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute -bottom-0.5 left-0 right-0 h-1 bg-gold"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && <ProfileOverviewModern />}
            {activeTab === 'settings' && <AccountSettings />}
            {activeTab === 'history' && <BetHistory />}
            {activeTab === 'export' && <TransactionExport />}
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
