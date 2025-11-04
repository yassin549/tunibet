'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonGold } from '@/components/ui/button-gold';
import { CardClassic, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card-classic';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface ModeSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: 'virtual' | 'real';
  onSuccess?: () => void;
}

export function ModeSwitchModal({ isOpen, onClose, currentMode, onSuccess }: ModeSwitchModalProps) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  const switchingToReal = currentMode === 'virtual';

  const handleSwitch = async () => {
    if (switchingToReal) {
      // Switching to real mode requires deposit
      router.push('/wallet');
      onClose();
    } else {
      // Switching back to virtual mode
      setIsSwitching(true);
      try {
        const response = await fetch('/api/user/switch-mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'virtual' }),
        });

        if (response.ok) {
          toast.success('Basculé en mode virtuel');
          onSuccess?.();
          onClose();
        } else {
          toast.error('Échec du changement de mode');
        }
      } catch (error) {
        toast.error('Erreur lors du changement de mode');
      } finally {
        setIsSwitching(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
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
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-navy/10 dark:hover:bg-cream/10 transition-colors"
              >
                <X className="h-5 w-5 text-navy dark:text-cream" />
              </button>

              {switchingToReal ? (
                <>
                  <div className="text-center mb-4">
                    <span className="text-6xl">💰</span>
                  </div>
                  <CardTitle className="text-2xl text-center">
                    Passer en Mode Réel
                  </CardTitle>
                  <CardDescription className="text-center text-lg">
                    Jouez avec de l'argent réel
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <span className="text-6xl">🎮</span>
                  </div>
                  <CardTitle className="text-2xl text-center">
                    Retour au Mode Virtuel
                  </CardTitle>
                  <CardDescription className="text-center text-lg">
                    Jouez sans risque
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {switchingToReal ? (
                <>
                  {/* Warning for Real Mode */}
                  <div className="rounded-xl bg-yellow-500/10 border-2 border-yellow-500/30 p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="font-bold text-navy dark:text-cream">
                          Attention: Argent Réel
                        </p>
                        <ul className="text-sm text-navy/80 dark:text-cream/80 space-y-1">
                          <li>• Vous jouerez avec de l'argent réel</li>
                          <li>• Les pertes sont définitives</li>
                          <li>• Dépôt minimum: 10 TND</li>
                          <li>• Retraits en crypto uniquement</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-3">
                    <p className="font-semibold text-navy dark:text-cream">
                      Avantages du mode réel:
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-gold/10">
                        <DollarSign className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-navy dark:text-cream text-sm">
                            Gains réels
                          </p>
                          <p className="text-xs text-navy/70 dark:text-cream/70">
                            Retirez vos gains en crypto
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-500/10">
                        <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-navy dark:text-cream text-sm">
                            Frisson authentique
                          </p>
                          <p className="text-xs text-navy/70 dark:text-cream/70">
                            L'adrénaline du jeu réel
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="space-y-3">
                    <ButtonGold
                      variant="primary"
                      size="lg"
                      onClick={handleSwitch}
                      className="w-full"
                    >
                      💳 Déposer et Activer
                    </ButtonGold>

                    <p className="text-xs text-center text-navy/60 dark:text-cream/60">
                      Vous serez redirigé vers le portefeuille pour déposer
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Info for Virtual Mode */}
                  <div className="rounded-xl bg-green-500/10 border-2 border-green-500/30 p-4">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">✓</span>
                      <div className="space-y-2">
                        <p className="font-bold text-navy dark:text-cream">
                          Mode Sans Risque
                        </p>
                        <ul className="text-sm text-navy/80 dark:text-cream/80 space-y-1">
                          <li>• Votre solde virtuel sera restauré</li>
                          <li>• Aucun argent réel en jeu</li>
                          <li>• Parfait pour s'entraîner</li>
                          <li>• Repassez en mode réel quand vous voulez</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="space-y-3">
                    <ButtonGold
                      variant="primary"
                      size="lg"
                      onClick={handleSwitch}
                      disabled={isSwitching}
                      className="w-full"
                    >
                      {isSwitching ? 'Changement...' : '🎮 Activer le Mode Virtuel'}
                    </ButtonGold>

                    <ButtonGold
                      variant="outline"
                      size="lg"
                      onClick={onClose}
                      disabled={isSwitching}
                      className="w-full"
                    >
                      Annuler
                    </ButtonGold>
                  </div>
                </>
              )}
            </CardContent>
          </CardClassic>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
