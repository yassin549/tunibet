'use client';

import { useState } from 'react';
import { CardClassic, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card-classic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ButtonGold } from '@/components/ui/button-gold';
import { CopyGold } from '@/components/ui/copy-gold';
import { verifyCrashPoint } from '@/lib/provably-fair';
import { motion } from 'framer-motion';

export default function FairVerifierPage() {
  const [serverSeed, setServerSeed] = useState('');
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState('');
  const [expectedCrash, setExpectedCrash] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleVerify = () => {
    if (!serverSeed || !serverSeedHash || !clientSeed || !nonce || !expectedCrash) {
      return;
    }

    const verification = verifyCrashPoint(
      serverSeed,
      serverSeedHash,
      clientSeed,
      parseInt(nonce),
      parseFloat(expectedCrash)
    );

    setResult(verification);
  };

  return (
    <main className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-navy dark:text-cream">
              Vérificateur Provably Fair
            </h1>
            <p className="text-lg text-navy/70 dark:text-cream/70 max-w-2xl mx-auto">
              Vérifiez l'équité de n'importe quel round en utilisant les seeds révélés
            </p>
          </div>

          {/* Explanation */}
          <CardClassic variant="glass">
            <CardHeader>
              <CardTitle>Comment ça marche?</CardTitle>
              <CardDescription>
                Le système Provably Fair garantit que chaque round est équitable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-navy dark:text-cream mb-2">
                    1. Server Seed Hash (Avant le round)
                  </h4>
                  <p className="text-sm text-navy/70 dark:text-cream/70">
                    Avant chaque round, nous affichons un hash du server seed. Ce hash prouve que le seed a été généré avant le début du round.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-navy dark:text-cream mb-2">
                    2. Client Seed
                  </h4>
                  <p className="text-sm text-navy/70 dark:text-cream/70">
                    Vous pouvez fournir votre propre seed ou utiliser un seed auto-généré. Cela garantit que nous ne pouvons pas prédire le résultat.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-navy dark:text-cream mb-2">
                    3. Server Seed (Après le round)
                  </h4>
                  <p className="text-sm text-navy/70 dark:text-cream/70">
                    Après le crash, nous révélons le server seed complet. Vous pouvez alors vérifier que le hash correspond et calculer vous-même le crash point.
                  </p>
                </div>
              </div>
            </CardContent>
          </CardClassic>

          {/* Verification Form */}
          <CardClassic variant="cream">
            <CardHeader>
              <CardTitle>Vérifier un Round</CardTitle>
              <CardDescription>
                Entrez les informations du round pour vérifier son équité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Server Seed */}
              <div className="space-y-2">
                <Label htmlFor="serverSeed">
                  Server Seed (révélé après le round)
                </Label>
                <Input
                  id="serverSeed"
                  value={serverSeed}
                  onChange={(e) => setServerSeed(e.target.value)}
                  placeholder="ex: a1b2c3d4e5f6..."
                  className="font-mono text-sm"
                />
              </div>

              {/* Server Seed Hash */}
              <div className="space-y-2">
                <Label htmlFor="serverSeedHash">
                  Server Seed Hash (affiché avant le round)
                </Label>
                <Input
                  id="serverSeedHash"
                  value={serverSeedHash}
                  onChange={(e) => setServerSeedHash(e.target.value)}
                  placeholder="ex: 9f86d081884c7d659..."
                  className="font-mono text-sm"
                />
              </div>

              {/* Client Seed */}
              <div className="space-y-2">
                <Label htmlFor="clientSeed">
                  Client Seed
                </Label>
                <Input
                  id="clientSeed"
                  value={clientSeed}
                  onChange={(e) => setClientSeed(e.target.value)}
                  placeholder="ex: user-provided-seed"
                  className="font-mono text-sm"
                />
              </div>

              {/* Nonce */}
              <div className="space-y-2">
                <Label htmlFor="nonce">
                  Nonce (Numéro du round)
                </Label>
                <Input
                  id="nonce"
                  type="number"
                  value={nonce}
                  onChange={(e) => setNonce(e.target.value)}
                  placeholder="ex: 1234"
                />
              </div>

              {/* Expected Crash */}
              <div className="space-y-2">
                <Label htmlFor="expectedCrash">
                  Crash Point Attendu
                </Label>
                <Input
                  id="expectedCrash"
                  type="number"
                  step="0.01"
                  value={expectedCrash}
                  onChange={(e) => setExpectedCrash(e.target.value)}
                  placeholder="ex: 2.45"
                />
              </div>

              {/* Verify Button */}
              <ButtonGold
                variant="primary"
                size="lg"
                onClick={handleVerify}
                className="w-full"
                disabled={!serverSeed || !serverSeedHash || !clientSeed || !nonce || !expectedCrash}
              >
                🔍 Vérifier
              </ButtonGold>
            </CardContent>
          </CardClassic>

          {/* Verification Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CardClassic variant={result.isValid ? 'glass' : 'cream'}>
                <CardHeader>
                  <CardTitle className={result.isValid ? 'text-green-600' : 'text-crash'}>
                    {result.isValid ? '✅ Round Vérifié' : '❌ Vérification Échouée'}
                  </CardTitle>
                  <CardDescription>
                    Résultats de la vérification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Hash Verification */}
                  <div className={`p-4 rounded-xl ${result.hashMatches ? 'bg-green-500/10' : 'bg-crash/10'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Hash du Server Seed:</span>
                      <span className={result.hashMatches ? 'text-green-600' : 'text-crash'}>
                        {result.hashMatches ? '✓ Correspond' : '✗ Ne correspond pas'}
                      </span>
                    </div>
                  </div>

                  {/* Crash Point Verification */}
                  <div className={`p-4 rounded-xl ${result.crashMatches ? 'bg-green-500/10' : 'bg-crash/10'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Point de Crash:</span>
                      <span className={result.crashMatches ? 'text-green-600' : 'text-crash'}>
                        {result.crashMatches ? '✓ Correspond' : '✗ Ne correspond pas'}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-navy/70 dark:text-cream/70">
                      Calculé: {result.calculatedCrash.toFixed(2)}x | Attendu: {expectedCrash}x
                    </div>
                  </div>

                  {/* Overall Result */}
                  <div className={`p-6 rounded-xl text-center ${result.isValid ? 'bg-green-500/20 border-2 border-green-500' : 'bg-crash/20 border-2 border-crash'}`}>
                    <p className={`text-xl font-bold ${result.isValid ? 'text-green-600' : 'text-crash'}`}>
                      {result.isValid
                        ? 'Ce round était équitable et vérifiable ✓'
                        : 'Les seeds ne correspondent pas ou les données sont incorrectes'}
                    </p>
                  </div>
                </CardContent>
              </CardClassic>
            </motion.div>
          )}

          {/* Example Data */}
          <CardClassic variant="navy">
            <CardHeader>
              <CardTitle className="text-cream">Exemple de Données</CardTitle>
              <CardDescription className="text-cream/70">
                Utilisez ces données pour tester le vérificateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-cream/90">
                <div>
                  <p className="text-sm text-cream/60 mb-1">Server Seed:</p>
                  <CopyGold 
                    value="a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <p className="text-sm text-cream/60 mb-1">Server Seed Hash:</p>
                  <CopyGold 
                    value="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <p className="text-sm text-cream/60 mb-1">Client Seed:</p>
                  <CopyGold 
                    value="my-test-seed"
                    className="font-mono text-xs"
                  />
                </div>
                <p className="text-sm text-cream/70 mt-4">
                  Note: Ces données sont des exemples. Pour vérifier un vrai round, utilisez les seeds affichés dans l'historique des rounds.
                </p>
              </div>
            </CardContent>
          </CardClassic>
        </motion.div>
      </div>
    </main>
  );
}
