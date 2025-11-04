'use client';

import { useEffect, useState } from 'react';
import { Check, X, Clock, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  crypto_currency: string;
  crypto_address: string;
  crypto_amount: number;
  status: string;
  created_at: string;
  user: {
    email: string;
    display_name: string;
  };
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  async function fetchWithdrawals() {
    try {
      const response = await fetch('/api/admin/withdrawals');
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    if (processing) return;

    const confirmed = confirm(
      'Êtes-vous sûr de vouloir approuver ce retrait ? Cette action est irréversible.'
    );
    if (!confirmed) return;

    setProcessing(id);
    try {
      const response = await fetch('/api/admin/withdrawals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: id }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Retrait approuvé avec succès');
        fetchWithdrawals();
      } else {
        toast.error(data.error || 'Erreur lors de l\'approbation');
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(id: string) {
    if (processing) return;

    const reason = prompt('Raison du rejet (optionnel):');
    if (reason === null) return; // User cancelled

    setProcessing(id);
    try {
      const response = await fetch('/api/admin/withdrawals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: id, reason }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Retrait rejeté');
        fetchWithdrawals();
      } else {
        toast.error(data.error || 'Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('Erreur lors du rejet');
    } finally {
      setProcessing(null);
    }
  }

  async function handleBatchApprove() {
    if (selectedIds.size === 0) {
      toast.error('Aucun retrait sélectionné');
      return;
    }

    const confirmed = confirm(
      `Approuver ${selectedIds.size} retrait(s) ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setProcessing('batch');
    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedIds) {
      try {
        const response = await fetch('/api/admin/withdrawals/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ withdrawalId: id }),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setProcessing(null);
    setSelectedIds(new Set());
    fetchWithdrawals();

    if (errorCount === 0) {
      toast.success(`${successCount} retrait(s) approuvé(s)`);
    } else {
      toast.error(`${successCount} approuvé(s), ${errorCount} erreur(s)`);
    }
  }

  function toggleSelection(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
          <p className="text-cream">Chargement des retraits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-gold mb-2">Gestion des Retraits</h1>
          <p className="text-cream/60">
            {pendingWithdrawals.length} retrait(s) en attente
          </p>
        </div>
        <button
          onClick={fetchWithdrawals}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Batch Actions */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gold/10 border border-gold/30 rounded-lg p-4 flex items-center justify-between"
        >
          <p className="text-cream">
            {selectedIds.size} retrait(s) sélectionné(s)
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleBatchApprove}
              disabled={processing === 'batch'}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Approuver Tout
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </motion.div>
      )}

      {/* Withdrawals Table */}
      {pendingWithdrawals.length === 0 ? (
        <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-12 text-center">
          <Clock className="w-16 h-16 text-cream/20 mx-auto mb-4" />
          <h3 className="text-xl text-cream mb-2">Aucun retrait en attente</h3>
          <p className="text-cream/60">
            Les nouveaux retraits apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gold/5 border-b border-gold/20">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === pendingWithdrawals.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(pendingWithdrawals.map((w) => w.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                      className="rounded border-gold/30 bg-navy/50 text-gold focus:ring-gold"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                    Utilisateur
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                    Crypto
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                    Adresse
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-cream">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                <AnimatePresence>
                  {pendingWithdrawals.map((withdrawal) => (
                    <motion.tr
                      key={withdrawal.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gold/5 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(withdrawal.id)}
                          onChange={() => toggleSelection(withdrawal.id)}
                          className="rounded border-gold/30 bg-navy/50 text-gold focus:ring-gold"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-cream font-medium">
                            {withdrawal.user.display_name || 'N/A'}
                          </p>
                          <p className="text-xs text-cream/60">
                            {withdrawal.user.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-cream font-semibold">
                          {withdrawal.amount.toFixed(2)} TND
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-cream">
                            {withdrawal.crypto_amount.toFixed(8)}
                          </p>
                          <p className="text-xs text-cream/60 uppercase">
                            {withdrawal.crypto_currency}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-cream/80 bg-navy/50 px-2 py-1 rounded">
                            {withdrawal.crypto_address.slice(0, 12)}...
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(withdrawal.crypto_address);
                              toast.success('Adresse copiée');
                            }}
                            className="text-gold hover:text-gold/80 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-cream/80">
                          {new Date(withdrawal.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-cream/60">
                          {new Date(withdrawal.created_at).toLocaleTimeString('fr-FR')}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(withdrawal.id)}
                            disabled={processing === withdrawal.id}
                            className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                            title="Approuver"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(withdrawal.id)}
                            disabled={processing === withdrawal.id}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                            title="Rejeter"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-cream/80">
          <p className="font-semibold text-blue-400 mb-1">Note Importante</p>
          <p>
            Les retraits approuvés doivent être traités manuellement via NOWPayments.
            Assurez-vous d'avoir suffisamment de fonds dans votre compte NOWPayments
            avant d'approuver des retraits.
          </p>
        </div>
      </div>
    </div>
  );
}
