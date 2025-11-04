'use client';

import { useState } from 'react';
import { CardClassic, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card-classic';
import { ButtonGold } from '@/components/ui/button-gold';
import { Download, FileText, Table, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

type ExportType = 'transactions' | 'bets' | 'all';
type ExportFormat = 'csv' | 'pdf';

export function TransactionExport() {
  const [exportType, setExportType] = useState<ExportType>('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('Veuillez sélectionner une plage de dates');
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error('La date de début doit être antérieure à la date de fin');
      return;
    }

    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        type: exportType,
        format: exportFormat,
        from: dateFrom,
        to: dateTo,
      });

      const response = await fetch(`/api/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `tunibet-export-${Date.now()}.${exportFormat}`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export réussi! Le fichier a été téléchargé.');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Échec de l\'export. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  // Set default dates (last 30 days)
  const getDefaultDates = () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  };

  const defaults = getDefaultDates();
  if (!dateFrom) setDateFrom(defaults.from);
  if (!dateTo) setDateTo(defaults.to);

  return (
    <div className="space-y-6">
      {/* Export Instructions */}
      <CardClassic variant="cream">
        <CardHeader>
          <CardTitle>📥 Exporter vos Données</CardTitle>
          <CardDescription>
            Téléchargez vos transactions et historique de paris en CSV ou PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-navy dark:text-cream">
              <strong>ℹ️ Information:</strong> Vos données sont exportées en temps réel.
              Les fichiers incluent toutes les informations pertinentes pour vos dossiers fiscaux et comptables.
            </p>
          </div>
        </CardContent>
      </CardClassic>

      {/* Export Options */}
      <CardClassic variant="glass">
        <CardHeader>
          <CardTitle>Options d'Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-navy dark:text-cream">
              Type de Données
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setExportType('transactions')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  exportType === 'transactions'
                    ? 'border-gold bg-gold/10'
                    : 'border-navy/20 dark:border-cream/20 hover:border-gold/50'
                }`}
              >
                <FileText className={`h-6 w-6 mx-auto mb-2 ${
                  exportType === 'transactions' ? 'text-gold' : 'text-navy/60 dark:text-cream/60'
                }`} />
                <p className="font-semibold text-navy dark:text-cream text-sm">Transactions</p>
                <p className="text-xs text-navy/60 dark:text-cream/60 mt-1">
                  Dépôts & Retraits
                </p>
              </button>

              <button
                onClick={() => setExportType('bets')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  exportType === 'bets'
                    ? 'border-gold bg-gold/10'
                    : 'border-navy/20 dark:border-cream/20 hover:border-gold/50'
                }`}
              >
                <Table className={`h-6 w-6 mx-auto mb-2 ${
                  exportType === 'bets' ? 'text-gold' : 'text-navy/60 dark:text-cream/60'
                }`} />
                <p className="font-semibold text-navy dark:text-cream text-sm">Paris</p>
                <p className="text-xs text-navy/60 dark:text-cream/60 mt-1">
                  Historique de jeu
                </p>
              </button>

              <button
                onClick={() => setExportType('all')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  exportType === 'all'
                    ? 'border-gold bg-gold/10'
                    : 'border-navy/20 dark:border-cream/20 hover:border-gold/50'
                }`}
              >
                <Download className={`h-6 w-6 mx-auto mb-2 ${
                  exportType === 'all' ? 'text-gold' : 'text-navy/60 dark:text-cream/60'
                }`} />
                <p className="font-semibold text-navy dark:text-cream text-sm">Tout</p>
                <p className="text-xs text-navy/60 dark:text-cream/60 mt-1">
                  Export complet
                </p>
              </button>
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-navy dark:text-cream">
              Format de Fichier
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('csv')}
                className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center space-x-3 ${
                  exportFormat === 'csv'
                    ? 'border-gold bg-gold/10'
                    : 'border-navy/20 dark:border-cream/20 hover:border-gold/50'
                }`}
              >
                <Table className={`h-5 w-5 ${
                  exportFormat === 'csv' ? 'text-gold' : 'text-navy/60 dark:text-cream/60'
                }`} />
                <div className="text-left">
                  <p className="font-semibold text-navy dark:text-cream">CSV</p>
                  <p className="text-xs text-navy/60 dark:text-cream/60">
                    Excel, Sheets
                  </p>
                </div>
              </button>

              <button
                onClick={() => setExportFormat('pdf')}
                className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center space-x-3 ${
                  exportFormat === 'pdf'
                    ? 'border-gold bg-gold/10'
                    : 'border-navy/20 dark:border-cream/20 hover:border-gold/50'
                }`}
              >
                <FileText className={`h-5 w-5 ${
                  exportFormat === 'pdf' ? 'text-gold' : 'text-navy/60 dark:text-cream/60'
                }`} />
                <div className="text-left">
                  <p className="font-semibold text-navy dark:text-cream">PDF</p>
                  <p className="text-xs text-navy/60 dark:text-cream/60">
                    Document
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-navy dark:text-cream flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Plage de Dates</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-navy/60 dark:text-cream/60 mb-1 block">
                  Date de Début
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-navy/20 dark:border-cream/20 bg-transparent text-navy dark:text-cream"
                />
              </div>
              <div>
                <label className="text-xs text-navy/60 dark:text-cream/60 mb-1 block">
                  Date de Fin
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-navy/20 dark:border-cream/20 bg-transparent text-navy dark:text-cream"
                />
              </div>
            </div>
          </div>

          {/* Quick Date Ranges */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const to = new Date();
                const from = new Date();
                from.setDate(from.getDate() - 7);
                setDateFrom(from.toISOString().split('T')[0]);
                setDateTo(to.toISOString().split('T')[0]);
              }}
              className="px-3 py-1 text-sm rounded-lg bg-navy/10 dark:bg-cream/10 text-navy dark:text-cream hover:bg-gold/20 transition-colors"
            >
              7 derniers jours
            </button>
            <button
              onClick={() => {
                const to = new Date();
                const from = new Date();
                from.setDate(from.getDate() - 30);
                setDateFrom(from.toISOString().split('T')[0]);
                setDateTo(to.toISOString().split('T')[0]);
              }}
              className="px-3 py-1 text-sm rounded-lg bg-navy/10 dark:bg-cream/10 text-navy dark:text-cream hover:bg-gold/20 transition-colors"
            >
              30 derniers jours
            </button>
            <button
              onClick={() => {
                const to = new Date();
                const from = new Date();
                from.setMonth(from.getMonth() - 3);
                setDateFrom(from.toISOString().split('T')[0]);
                setDateTo(to.toISOString().split('T')[0]);
              }}
              className="px-3 py-1 text-sm rounded-lg bg-navy/10 dark:bg-cream/10 text-navy dark:text-cream hover:bg-gold/20 transition-colors"
            >
              3 derniers mois
            </button>
          </div>

          {/* Export Button */}
          <ButtonGold
            variant="primary"
            size="lg"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Télécharger {exportFormat.toUpperCase()}
              </>
            )}
          </ButtonGold>
        </CardContent>
      </CardClassic>

      {/* Privacy Notice */}
      <CardClassic variant="cream">
        <CardContent className="pt-6">
          <div className="bg-gold/10 border border-gold/30 rounded-xl p-4">
            <p className="text-sm text-navy dark:text-cream">
              <strong>🔒 Confidentialité:</strong> Vos données exportées contiennent des informations sensibles.
              Assurez-vous de les stocker en toute sécurité et de ne les partager avec personne.
            </p>
          </div>
        </CardContent>
      </CardClassic>
    </div>
  );
}
