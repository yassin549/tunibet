'use client';

import { useState } from 'react';
import { ButtonGold } from '@/components/ui/button-gold';
import {
  CardClassic,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card-classic';
import { MultiplierLux } from '@/components/ui/multiplier-lux';
import { ToggleClassic } from '@/components/ui/toggle-classic';
import { BetSlider } from '@/components/ui/bet-slider';
import { CopyGold } from '@/components/ui/copy-gold';

export default function UIShowcasePage() {
  const [toggleValue, setToggleValue] = useState(false);
  const [betAmount, setBetAmount] = useState(50);
  const [multiplier, setMultiplier] = useState(1.5);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <main className="min-h-screen py-12">
      <div className="container mx-auto px-4 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-display text-5xl font-bold text-navy dark:text-cream">
            UI Kit Tunibet
          </h1>
          <p className="text-lg text-navy/70 dark:text-cream/70">
            Composants classiques et élégants inspirés de Monaco, Rolex et Cartier
          </p>
        </div>

        {/* ButtonGold Section */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-navy dark:text-cream">
            ButtonGold
          </h2>
          <CardClassic>
            <CardHeader>
              <CardTitle>Variantes de boutons</CardTitle>
              <CardDescription>
                Trois variantes avec animations hover et focus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <ButtonGold variant="primary" size="sm">
                  Petit Primary
                </ButtonGold>
                <ButtonGold variant="primary" size="md">
                  Moyen Primary
                </ButtonGold>
                <ButtonGold variant="primary" size="lg">
                  Grand Primary
                </ButtonGold>
              </div>
              <div className="flex flex-wrap gap-4">
                <ButtonGold variant="outline" size="md">
                  Outline
                </ButtonGold>
                <ButtonGold variant="crash" size="md">
                  Crash
                </ButtonGold>
                <ButtonGold variant="primary" size="md" disabled>
                  Désactivé
                </ButtonGold>
              </div>
              <div>
                <ButtonGold
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  onClick={handleLoadingDemo}
                >
                  Cliquez pour charger
                </ButtonGold>
              </div>
            </CardContent>
          </CardClassic>
        </section>

        {/* CardClassic Section */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-navy dark:text-cream">
            CardClassic
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <CardClassic variant="glass">
              <CardHeader>
                <CardTitle>Glass</CardTitle>
                <CardDescription>Effet verre dépoli</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-navy/80 dark:text-cream/80">
                  Carte avec effet glassmorphism et bordure dorée subtile.
                </p>
              </CardContent>
              <CardFooter>
                <ButtonGold variant="outline" size="sm">
                  Action
                </ButtonGold>
              </CardFooter>
            </CardClassic>

            <CardClassic variant="cream">
              <CardHeader>
                <CardTitle>Cream</CardTitle>
                <CardDescription>Fond crème élégant</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-navy/80 dark:text-cream/80">
                  Carte avec fond crème et bordure dorée plus prononcée.
                </p>
              </CardContent>
              <CardFooter>
                <ButtonGold variant="primary" size="sm">
                  Action
                </ButtonGold>
              </CardFooter>
            </CardClassic>

            <CardClassic variant="navy" hover={false}>
              <CardHeader>
                <CardTitle className="text-cream">Navy</CardTitle>
                <CardDescription className="text-cream/70">
                  Fond marine sans hover
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-cream/80">
                  Carte avec fond marine et bordure dorée complète.
                </p>
              </CardContent>
              <CardFooter>
                <ButtonGold variant="primary" size="sm">
                  Action
                </ButtonGold>
              </CardFooter>
            </CardClassic>
          </div>
        </section>

        {/* MultiplierLux Section */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-navy dark:text-cream">
            MultiplierLux
          </h2>
          <CardClassic>
            <CardHeader>
              <CardTitle>Affichage du multiplicateur</CardTitle>
              <CardDescription>
                Grande taille responsive avec animation et accessibilité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex flex-col items-center space-y-4">
                <MultiplierLux value={multiplier} size="xl" />
                <div className="flex gap-2">
                  <ButtonGold
                    variant="outline"
                    size="sm"
                    onClick={() => setMultiplier((m) => Math.max(1, m - 0.5))}
                  >
                    - 0.5x
                  </ButtonGold>
                  <ButtonGold
                    variant="outline"
                    size="sm"
                    onClick={() => setMultiplier((m) => Math.min(100, m + 0.5))}
                  >
                    + 0.5x
                  </ButtonGold>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <MultiplierLux value={1.23} size="sm" />
                  <p className="mt-2 text-xs text-navy/60 dark:text-cream/60">Small</p>
                </div>
                <div className="text-center">
                  <MultiplierLux value={5.67} size="md" />
                  <p className="mt-2 text-xs text-navy/60 dark:text-cream/60">Medium</p>
                </div>
                <div className="text-center">
                  <MultiplierLux value={12.89} size="lg" />
                  <p className="mt-2 text-xs text-navy/60 dark:text-cream/60">Large</p>
                </div>
                <div className="text-center">
                  <MultiplierLux value={99.99} size="xl" animate={false} />
                  <p className="mt-2 text-xs text-navy/60 dark:text-cream/60">XL (no anim)</p>
                </div>
              </div>
            </CardContent>
          </CardClassic>
        </section>

        {/* ToggleClassic Section */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-navy dark:text-cream">
            ToggleClassic
          </h2>
          <CardClassic>
            <CardHeader>
              <CardTitle>Toggle DÉMO / LIVE</CardTitle>
              <CardDescription>
                Pill slider avec animation spring et navigation clavier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <ToggleClassic
                  value={toggleValue}
                  onChange={setToggleValue}
                  labelLeft="DÉMO"
                  labelRight="LIVE"
                />
                <p className="text-sm text-navy/70 dark:text-cream/70">
                  État actuel: <span className="font-bold text-gold">
                    {toggleValue ? 'LIVE' : 'DÉMO'}
                  </span>
                </p>
                <p className="text-xs text-navy/50 dark:text-cream/50">
                  Utilisez les flèches ← → pour naviguer au clavier
                </p>
              </div>
            </CardContent>
          </CardClassic>
        </section>

        {/* BetSlider Section */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-navy dark:text-cream">
            BetSlider
          </h2>
          <CardClassic>
            <CardHeader>
              <CardTitle>Curseur de mise</CardTitle>
              <CardDescription>
                Grand thumb doré avec affichage dynamique du gain potentiel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BetSlider
                value={betAmount}
                onChange={setBetAmount}
                min={1}
                max={1000}
                step={1}
                multiplier={multiplier}
              />
            </CardContent>
          </CardClassic>
        </section>

        {/* CopyGold Section */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-navy dark:text-cream">
            CopyGold
          </h2>
          <CardClassic>
            <CardHeader>
              <CardTitle>Copie vers presse-papiers</CardTitle>
              <CardDescription>
                Copie avec toast notification et effet glow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CopyGold
                value="abc123def456ghi789"
                label="ID de round:"
                message="ID copié pour @tunibetbot"
              />
              <CopyGold
                value="user_9876543210"
                label="ID utilisateur:"
                message="ID utilisateur copié!"
              />
              <CopyGold
                value="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                label="Adresse wallet:"
                message="Adresse copiée!"
              />
            </CardContent>
          </CardClassic>
        </section>

        {/* Accessibility Note */}
        <section className="space-y-6">
          <CardClassic variant="navy">
            <CardHeader>
              <CardTitle className="text-cream">♿ Accessibilité</CardTitle>
              <CardDescription className="text-cream/70">
                Tous les composants respectent les standards WCAG AA+
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-cream/90">
                <li>✓ Navigation clavier complète</li>
                <li>✓ Focus states visibles</li>
                <li>✓ ARIA labels et live regions</li>
                <li>✓ Contraste de couleurs AAA</li>
                <li>✓ Annonces pour lecteurs d'écran</li>
              </ul>
            </CardContent>
          </CardClassic>
        </section>
      </div>
    </main>
  );
}
