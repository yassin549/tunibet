import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  demo_balance: number;
  live_balance: number;
  balance_type: 'virtual' | 'real';
  virtual_balance_saved: number;
  is_admin: boolean;
  created_at: string;
}

export interface Round {
  id: string;
  round_number: number;
  server_seed_hash: string;
  client_seed: string;
  crash_point: number | null;
  status: 'pending' | 'active' | 'crashed' | 'cancelled';
  started_at: string;
  ended_at: string | null;
}

export interface Settings {
  haptic: boolean;
  frameCap: 60 | 120;
  soundEnabled: boolean;
  autoCashout: number | null;
}

interface StoreState {
  // User state
  user: User | null;
  balance: number;
  
  // Game state
  liveRounds: Round[];
  currentRound: Round | null;
  multiplier: number;
  gameStatus: 'waiting' | 'betting' | 'active' | 'crashed';
  
  // Settings
  settings: Settings;
  
  // Actions
  setUser: (user: User | null) => void;
  updateBalance: (balance: number) => void;
  setLiveRounds: (rounds: Round[]) => void;
  setCurrentRound: (round: Round | null) => void;
  setMultiplier: (multiplier: number) => void;
  setGameStatus: (status: 'waiting' | 'betting' | 'active' | 'crashed') => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      balance: 0,
      liveRounds: [],
      currentRound: null,
      multiplier: 1.0,
      gameStatus: 'waiting',
      settings: {
        haptic: true,
        frameCap: 120,
        soundEnabled: true,
        autoCashout: null,
      },
      
      // Actions
      setUser: (user) => {
        set({ user });
        if (user) {
          // Set balance based on current balance_type
          const balance = user.balance_type === 'virtual' ? user.demo_balance : user.live_balance;
          set({ balance });
        } else {
          set({ balance: 0 });
        }
      },
      
      updateBalance: (balance) => set({ balance }),
      
      setLiveRounds: (rounds) => set({ liveRounds: rounds }),
      
      setCurrentRound: (round) => set({ currentRound: round }),
      
      setMultiplier: (multiplier) => set({ multiplier }),
      
      setGameStatus: (status) => set({ gameStatus: status }),
      
      updateSettings: (newSettings) => 
        set((state) => ({ 
          settings: { ...state.settings, ...newSettings } 
        })),
    }),
    {
      name: 'tunibet-storage',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
