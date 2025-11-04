'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useStore } from '@/stores/useStore';
import { FuturisticBackground } from '@/components/layout/futuristic-background';
import { CardClassic, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card-classic';
import { ButtonGold } from '@/components/ui/button-gold';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { ArrowDownCircle, ArrowUpCircle, History, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Transaction, CryptoCurrency, SUPPORTED_CRYPTOS } from '@/types/payment';
import { SUPPORTED_CRYPTOS as CRYPTOS } from '@/types/payment';

type Tab = 'deposit' | 'withdraw' | 'history';

export default function WalletPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { balance } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('deposit');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState('50');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency>('usdt');
  const [isCreatingDeposit, setIsCreatingDeposit] = useState(false);

  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCrypto, setWithdrawCrypto] = useState<CryptoCurrency>('usdt');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentAddress, setPaymentAddress] = useState('');
  const [payAmount, setPayAmount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && activeTab === 'history') {
      fetchTransactions();
    }
  }, [user, activeTab]);

  const fetchTransactions = async () => {
    setIsLoadingTx(true);
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      if (response.ok) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoadingTx(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 5) {
      toast.error('Minimum deposit is 5 USD');
      return;
    }

    setIsCreatingDeposit(true);
    try {
      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'usd',
          cryptoCurrency: selectedCrypto,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create deposit');
        return;
      }

      // Show payment modal
      setPaymentUrl(data.paymentUrl);
      setPaymentAddress(data.paymentAddress);
      setPayAmount(data.payAmount);
      setShowPaymentModal(true);

      toast.success('Deposit created! Complete payment to receive funds.');
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error('Failed to create deposit');
    } finally {
      setIsCreatingDeposit(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      toast.error('Minimum withdrawal is 10 USD');
      return;
    }

    if (!withdrawAddress) {
      toast.error('Please enter crypto address');
      return;
    }

    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsWithdrawing(true);
    try {
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          cryptoCurrency: withdrawCrypto,
          cryptoAddress: withdrawAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create withdrawal');
        return;
      }

      toast.success(data.message);
      setWithdrawAmount('');
      setWithdrawAddress('');
      setActiveTab('history');
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to create withdrawal');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen relative">
        <FuturisticBackground />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent mx-auto" />
            <p className="text-white">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen relative py-12">
      <FuturisticBackground />
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white">
              💰 Portefeuille
            </h1>
            <p className="text-lg text-gray-400">
              Gérez vos dépôts et retraits
            </p>
          </div>

          {/* Balance Card */}
          <CardClassic variant="glass">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-navy/60 dark:text-cream/60">Solde Total</p>
                <p className="text-5xl font-bold text-gold">
                  {balance.toFixed(2)} <span className="text-3xl">TND</span>
                </p>
              </div>
            </CardContent>
          </CardClassic>

          {/* Tabs */}
          <div className="flex space-x-2 border-b-2 border-gold/20">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex items-center space-x-2 px-6 py-3 font-semibold transition-colors relative ${
                activeTab === 'deposit'
                  ? 'text-gold'
                  : 'text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream'
              }`}
            >
              <ArrowDownCircle className="h-5 w-5" />
              <span>Dépôt</span>
              {activeTab === 'deposit' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex items-center space-x-2 px-6 py-3 font-semibold transition-colors relative ${
                activeTab === 'withdraw'
                  ? 'text-gold'
                  : 'text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream'
              }`}
            >
              <ArrowUpCircle className="h-5 w-5" />
              <span>Retrait</span>
              {activeTab === 'withdraw' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-6 py-3 font-semibold transition-colors relative ${
                activeTab === 'history'
                  ? 'text-gold'
                  : 'text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream'
              }`}
            >
              <History className="h-5 w-5" />
              <span>Historique</span>
              {activeTab === 'history' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                />
              )}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'deposit' && (
            <CardClassic variant="cream">
              <CardHeader>
                <CardTitle>Effectuer un Dépôt</CardTitle>
                <CardDescription>
                  Rechargez votre compte avec des cryptomonnaies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Montant (USD)</Label>
                  <Input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="50"
                    min="5"
                  />
                  <p className="text-xs text-navy/60 dark:text-cream/60">
                    Minimum: 5 USD
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Cryptomonnaie</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CRYPTOS.map((crypto) => (
                      <button
                        key={crypto.code}
                        onClick={() => setSelectedCrypto(crypto.code)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedCrypto === crypto.code
                            ? 'border-gold bg-gold/10'
                            : 'border-navy/20 dark:border-cream/20 hover:border-gold/50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{crypto.icon}</div>
                        <div className="text-sm font-bold">{crypto.symbol}</div>
                        <div className="text-xs text-navy/60 dark:text-cream/60">
                          {crypto.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <ButtonGold
                  variant="primary"
                  size="lg"
                  onClick={handleDeposit}
                  disabled={isCreatingDeposit}
                  className="w-full"
                >
                  {isCreatingDeposit ? 'Création...' : '💳 Créer le Dépôt'}
                </ButtonGold>
              </CardContent>
            </CardClassic>
          )}

          {activeTab === 'withdraw' && (
            <CardClassic variant="cream">
              <CardHeader>
                <CardTitle>Effectuer un Retrait</CardTitle>
                <CardDescription>
                  Retirez vos fonds vers votre portefeuille crypto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Montant (USD)</Label>
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="10"
                    min="10"
                    max={balance}
                  />
                  <p className="text-xs text-navy/60 dark:text-cream/60">
                    Minimum: 10 USD | Disponible: {balance.toFixed(2)} TND
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Cryptomonnaie</Label>
                  <select
                    value={withdrawCrypto}
                    onChange={(e) => setWithdrawCrypto(e.target.value as CryptoCurrency)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-navy/20 dark:border-cream/20 bg-transparent"
                  >
                    {CRYPTOS.map((crypto) => (
                      <option key={crypto.code} value={crypto.code}>
                        {crypto.symbol} - {crypto.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Adresse Crypto</Label>
                  <Input
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="Entrez votre adresse crypto"
                  />
                </div>

                <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 text-sm">
                  <p className="font-bold text-navy dark:text-cream mb-2">⚠️ Important:</p>
                  <ul className="list-disc list-inside space-y-1 text-navy/70 dark:text-cream/70">
                    <li>Frais de retrait: 2% (min 2 USD)</li>
                    <li>Traitement: 24-48 heures</li>
                    <li>Vérifiez bien l'adresse avant de confirmer</li>
                  </ul>
                </div>

                <ButtonGold
                  variant="crash"
                  size="lg"
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="w-full"
                >
                  {isWithdrawing ? 'Traitement...' : '💸 Demander le Retrait'}
                </ButtonGold>
              </CardContent>
            </CardClassic>
          )}

          {activeTab === 'history' && (
            <CardClassic variant="glass">
              <CardHeader>
                <CardTitle>Historique des Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTx ? (
                  <div className="text-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent mx-auto" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-navy/60 dark:text-cream/60">
                      Aucune transaction pour le moment
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 rounded-xl border-2 border-navy/10 dark:border-cream/10"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${
                            tx.type === 'deposit' ? 'bg-green-500/20' : 'bg-crash/20'
                          }`}>
                            {tx.type === 'deposit' ? (
                              <ArrowDownCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <ArrowUpCircle className="h-5 w-5 text-crash" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-navy dark:text-cream">
                              {tx.type === 'deposit' ? 'Dépôt' : 'Retrait'}
                            </p>
                            <p className="text-sm text-navy/60 dark:text-cream/60">
                              {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-navy dark:text-cream">
                            {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toFixed(2)} USD
                          </p>
                          <p className={`text-sm ${
                            tx.status === 'completed' ? 'text-green-600' :
                            tx.status === 'failed' ? 'text-crash' :
                            'text-gold'
                          }`}>
                            {tx.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CardClassic>
          )}
        </motion.div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-cream dark:bg-navy rounded-2xl p-6 max-w-md w-full space-y-4"
            >
              <h3 className="text-2xl font-bold text-navy dark:text-cream">
                Complétez le Paiement
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-navy/60 dark:text-cream/60 mb-1">
                    Montant à payer:
                  </p>
                  <p className="text-2xl font-bold text-gold">
                    {payAmount.toFixed(8)} {selectedCrypto.toUpperCase()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-navy/60 dark:text-cream/60 mb-1">
                    Adresse:
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs font-mono bg-navy/5 dark:bg-cream/5 p-2 rounded flex-1 break-all">
                      {paymentAddress}
                    </p>
                    <button
                      onClick={() => copyToClipboard(paymentAddress)}
                      className="p-2 rounded-lg bg-gold/20 hover:bg-gold/30 transition-colors"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <ButtonGold
                  variant="primary"
                  size="lg"
                  onClick={() => window.open(paymentUrl, '_blank')}
                  className="flex-1"
                >
                  Ouvrir le Paiement
                </ButtonGold>
                <ButtonGold
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setActiveTab('history');
                  }}
                  className="flex-1"
                >
                  Fermer
                </ButtonGold>
              </div>

              <p className="text-xs text-navy/60 dark:text-cream/60 text-center">
                Votre solde sera crédité automatiquement après confirmation
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}
