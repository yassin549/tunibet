'use client';

import { useEffect, useState } from 'react';
import { Search, Ban, CheckCircle, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  display_name: string;
  demo_balance: number;
  live_balance: number;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleBanUser(userId: string, currentlyBanned: boolean) {
    if (processing) return;

    const action = currentlyBanned ? 'débannir' : 'bannir';
    const confirmed = confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`);
    if (!confirmed) return;

    setProcessing(userId);
    try {
      const response = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ban: !currentlyBanned }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          currentlyBanned ? 'Utilisateur débanni' : 'Utilisateur banni'
        );
        fetchUsers();
      } else {
        toast.error(data.error || 'Erreur lors de l\'opération');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Erreur lors de l\'opération');
    } finally {
      setProcessing(null);
    }
  }

  async function handleAdjustBalance(userId: string, accountType: 'demo' | 'live') {
    if (processing) return;

    const amountStr = prompt(
      `Montant à ajouter (négatif pour retirer) au solde ${
        accountType === 'demo' ? 'démo' : 'réel'
      }:`
    );
    if (amountStr === null) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount === 0) {
      toast.error('Montant invalide');
      return;
    }

    const reason = prompt('Raison de l\'ajustement:');
    if (reason === null) return;

    setProcessing(userId);
    try {
      const response = await fetch('/api/admin/users/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accountType, amount, reason }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Solde ajusté avec succès');
        fetchUsers();
      } else {
        toast.error(data.error || 'Erreur lors de l\'ajustement');
      }
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast.error('Erreur lors de l\'ajustement');
    } finally {
      setProcessing(null);
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.display_name &&
        user.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
          <p className="text-cream">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-gold mb-2">
            Gestion des Utilisateurs
          </h1>
          <p className="text-cream/60">{users.length} utilisateur(s) total</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cream/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par email ou nom..."
          className="w-full pl-12 pr-4 py-3 bg-navy/50 border border-gold/20 rounded-lg text-cream placeholder:text-cream/40 focus:outline-none focus:border-gold/40 transition-colors"
        />
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-12 text-center">
          <AlertCircle className="w-16 h-16 text-cream/20 mx-auto mb-4" />
          <h3 className="text-xl text-cream mb-2">Aucun utilisateur trouvé</h3>
          <p className="text-cream/60">Essayez une autre recherche</p>
        </div>
      ) : (
        <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gold/5 border-b border-gold/20">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                    Utilisateur
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                    Solde Démo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                    Solde Réel
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-cream">
                    Inscrit le
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-cream">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gold/5 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-cream font-medium">
                          {user.display_name || 'N/A'}
                          {user.is_admin && (
                            <span className="ml-2 text-xs bg-gold/20 text-gold px-2 py-0.5 rounded">
                              ADMIN
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-cream/60">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-cream">
                          {user.demo_balance.toFixed(2)} TND
                        </p>
                        <button
                          onClick={() => handleAdjustBalance(user.id, 'demo')}
                          disabled={processing === user.id}
                          className="p-1 hover:bg-gold/10 rounded transition-colors"
                          title="Ajuster solde démo"
                        >
                          <DollarSign className="w-4 h-4 text-gold" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-cream">
                          {user.live_balance.toFixed(2)} TND
                        </p>
                        <button
                          onClick={() => handleAdjustBalance(user.id, 'live')}
                          disabled={processing === user.id}
                          className="p-1 hover:bg-gold/10 rounded transition-colors"
                          title="Ajuster solde réel"
                        >
                          <DollarSign className="w-4 h-4 text-gold" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {user.is_banned ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                          <Ban className="w-3 h-3" />
                          Banni
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          <CheckCircle className="w-3 h-3" />
                          Actif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-cream/80">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!user.is_admin && (
                          <button
                            onClick={() =>
                              handleBanUser(user.id, user.is_banned)
                            }
                            disabled={processing === user.id}
                            className={`px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50 ${
                              user.is_banned
                                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                            }`}
                          >
                            {user.is_banned ? 'Débannir' : 'Bannir'}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
