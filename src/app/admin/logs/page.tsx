'use client';

import { useEffect, useState } from 'react';
import { Shield, RefreshCw, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  before_state: any;
  after_state: any;
  reason: string | null;
  ip_address: string | null;
  created_at: string;
  admin: {
    email: string;
    display_name: string;
  };
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const response = await fetch('/api/admin/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      approve_withdrawal: 'Retrait Approuvé',
      reject_withdrawal: 'Retrait Rejeté',
      ban_user: 'Utilisateur Banni',
      unban_user: 'Utilisateur Débanni',
      adjust_balance: 'Solde Ajusté',
      pause_round: 'Round Pausé',
      force_round: 'Round Forcé',
    };
    return labels[action] || action;
  }

  function getActionColor(action: string): string {
    if (action.includes('approve')) return 'text-green-400 bg-green-500/20';
    if (action.includes('reject') || action.includes('ban'))
      return 'text-red-400 bg-red-500/20';
    if (action.includes('adjust')) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-blue-400 bg-blue-500/20';
  }

  const filteredLogs =
    filterAction === 'all'
      ? logs
      : logs.filter((log) => log.action === filterAction);

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
          <p className="text-cream">Chargement des logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-gold mb-2">Logs d'Audit</h1>
          <p className="text-cream/60">
            {filteredLogs.length} action(s) enregistrée(s)
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gold" />
          <span className="text-cream font-medium">Filtrer par action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 bg-navy border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold/40 transition-colors"
          >
            <option value="all">Toutes les actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {getActionLabel(action)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg p-12 text-center">
          <Shield className="w-16 h-16 text-cream/20 mx-auto mb-4" />
          <h3 className="text-xl text-cream mb-2">Aucun log trouvé</h3>
          <p className="text-cream/60">
            Les actions administratives apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-navy/50 backdrop-blur-sm border border-gold/20 rounded-lg overflow-hidden"
            >
              {/* Log Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gold/5 transition-colors"
                onClick={() =>
                  setExpandedLog(expandedLog === log.id ? null : log.id)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${getActionColor(
                          log.action
                        )}`}
                      >
                        {getActionLabel(log.action)}
                      </span>
                      <span className="text-xs text-cream/60">
                        {log.target_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-cream/60">Admin: </span>
                        <span className="text-cream">
                          {log.admin.display_name || log.admin.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-cream/60">Date: </span>
                        <span className="text-cream">
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      {log.ip_address && (
                        <div>
                          <span className="text-cream/60">IP: </span>
                          <code className="text-xs text-cream bg-navy/50 px-2 py-0.5 rounded">
                            {log.ip_address}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="text-gold hover:text-gold/80 transition-colors">
                    {expandedLog === log.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedLog === log.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gold/20 bg-navy/30"
                  >
                    <div className="p-4 space-y-4">
                      {/* Reason */}
                      {log.reason && (
                        <div>
                          <p className="text-xs text-cream/60 mb-1">Raison:</p>
                          <p className="text-sm text-cream">{log.reason}</p>
                        </div>
                      )}

                      {/* Target ID */}
                      <div>
                        <p className="text-xs text-cream/60 mb-1">
                          ID de la cible:
                        </p>
                        <code className="text-xs text-cream bg-navy/50 px-2 py-1 rounded">
                          {log.target_id}
                        </code>
                      </div>

                      {/* Before/After States */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {log.before_state && (
                          <div>
                            <p className="text-xs text-cream/60 mb-2">
                              État Avant:
                            </p>
                            <pre className="text-xs text-cream bg-navy/50 p-3 rounded overflow-x-auto">
                              {JSON.stringify(log.before_state, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.after_state && (
                          <div>
                            <p className="text-xs text-cream/60 mb-2">
                              État Après:
                            </p>
                            <pre className="text-xs text-cream bg-navy/50 p-3 rounded overflow-x-auto">
                              {JSON.stringify(log.after_state, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
