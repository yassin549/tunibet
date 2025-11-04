'use client';

import { useRouter } from 'next/navigation';
import { ButtonGold } from '@/components/ui/button-gold';
import { CardClassic, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card-classic';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Save, DollarSign } from 'lucide-react';

interface SignUpPromptProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'soft' | 'hard';
  gamesPlayed: number;
  canDismiss?: boolean;
}

export function SignUpPrompt({ isOpen, onClose, type, gamesPlayed, canDismiss = true }: SignUpPromptProps) {
  const router = useRouter();

  const handleSignUp = () => {
    router.push('/auth/signup');
  };

  const handleSignIn = () => {
    router.push('/auth/signin');
  };

  if (!isOpen) return null;

  const isSoftPrompt = type === 'soft';
  const isHardBlock = type === 'hard';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={canDismiss ? onClose : undefined}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <CardClassic variant="glass">
            <CardHeader className="relative">
              {canDismiss && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-navy/10 dark:hover:bg-cream/10 transition-colors"
                >
                  <X className="h-5 w-5 text-navy dark:text-cream" />
                </button>
              )}

              {isSoftPrompt ? (
                <>
                  <div className="text-center mb-4">
                    <span className="text-6xl">🎉</span>
                  </div>
                  <CardTitle className="text-2xl text-center">
                    You're on a roll!
                  </CardTitle>
                  <CardDescription className="text-center text-lg">
                    {gamesPlayed} games played
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <span className="text-6xl">⏸️</span>
                  </div>
                  <CardTitle className="text-2xl text-center">
                    Free trial ended
                  </CardTitle>
                  <CardDescription className="text-center text-lg">
                    You've played your 5 free games
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Benefits */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-navy dark:text-cream text-center">
                  Create an account to:
                </p>

                <div className="space-y-2">
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <Save className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-navy dark:text-cream text-sm">
                        Save your progress
                      </p>
                      <p className="text-xs text-navy/70 dark:text-cream/70">
                        Your stats and history are saved
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-navy dark:text-cream text-sm">
                        Keep playing
                      </p>
                      <p className="text-xs text-navy/70 dark:text-cream/70">
                        Unlimited games in demo mode
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-gold/10 border border-gold/30">
                    <DollarSign className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-navy dark:text-cream text-sm">
                        Play with real money
                      </p>
                      <p className="text-xs text-navy/70 dark:text-cream/70">
                        Deposit and withdraw your winnings in crypto
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <ButtonGold
                  variant="primary"
                  size="lg"
                  onClick={handleSignUp}
                  className="w-full"
                >
                  ✨ Create Free Account
                </ButtonGold>

                <ButtonGold
                  variant="outline"
                  size="lg"
                  onClick={handleSignIn}
                  className="w-full"
                >
                  Already registered? Sign In
                </ButtonGold>

                {isSoftPrompt && canDismiss && (
                  <button
                    onClick={onClose}
                    className="w-full text-sm text-navy/60 dark:text-cream/60 hover:text-navy dark:hover:text-cream transition-colors py-2"
                  >
                    Continue without account
                  </button>
                )}
              </div>

              {/* Info */}
              {isHardBlock && (
                <div className="text-center">
                  <p className="text-xs text-navy/60 dark:text-cream/60">
                    Free signup • No card required
                  </p>
                </div>
              )}
            </CardContent>
          </CardClassic>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
