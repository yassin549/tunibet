'use client';

import { FuturisticBackground } from '@/components/layout/futuristic-background';
import { GameLoader } from '@/components/loading/game-loader';

export default function Loading() {
  return (
    <div className="min-h-screen relative">
      <FuturisticBackground />
      <div className="flex min-h-screen items-center justify-center">
        <GameLoader message="Loading Tunibet..." />
      </div>
    </div>
  );
}
