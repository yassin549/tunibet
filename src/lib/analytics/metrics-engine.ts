/**
 * Real-time Metrics Engine
 * Manages Supabase Realtime subscriptions for live metrics
 */

import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface MetricsUpdate {
  type: 'bet' | 'round' | 'user' | 'transaction';
  data: any;
  timestamp: string;
}

export type MetricsCallback = (update: MetricsUpdate) => void;

export class MetricsEngine {
  private supabase = createClient();
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: Map<string, Set<MetricsCallback>> = new Map();
  private isRunning = false;

  /**
   * Start the metrics engine
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.subscribeToAllChannels();
  }

  /**
   * Stop the metrics engine
   */
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.unsubscribeFromAllChannels();
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(type: string, callback: MetricsCallback) {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, new Set());
    }
    this.callbacks.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(type);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.callbacks.delete(type);
        }
      }
    };
  }

  /**
   * Subscribe to all realtime channels
   */
  private subscribeToAllChannels() {
    this.subscribeToBets();
    this.subscribeToRounds();
    this.subscribeToTransactions();
  }

  /**
   * Unsubscribe from all channels
   */
  private unsubscribeFromAllChannels() {
    this.channels.forEach((channel) => {
      this.supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  /**
   * Subscribe to bets table
   */
  private subscribeToBets() {
    const channel = this.supabase
      .channel('bets-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bets',
        },
        (payload) => {
          this.notifyCallbacks('bet', {
            type: 'bet',
            data: payload.new,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .subscribe();

    this.channels.set('bets', channel);
  }

  /**
   * Subscribe to rounds table
   */
  private subscribeToRounds() {
    const channel = this.supabase
      .channel('rounds-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rounds',
        },
        (payload) => {
          this.notifyCallbacks('round', {
            type: 'round',
            data: payload.new || payload.old,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .subscribe();

    this.channels.set('rounds', channel);
  }

  /**
   * Subscribe to transactions table
   */
  private subscribeToTransactions() {
    const channel = this.supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          this.notifyCallbacks('transaction', {
            type: 'transaction',
            data: payload.new,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .subscribe();

    this.channels.set('transactions', channel);
  }

  /**
   * Notify all callbacks for a specific type
   */
  private notifyCallbacks(type: string, update: MetricsUpdate) {
    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error in metrics callback:', error);
        }
      });
    }

    // Also notify 'all' subscribers
    const allCallbacks = this.callbacks.get('all');
    if (allCallbacks) {
      allCallbacks.forEach((callback) => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error in metrics callback:', error);
        }
      });
    }
  }

  /**
   * Get current channel status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeChannels: Array.from(this.channels.keys()),
      subscriberCount: Array.from(this.callbacks.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
    };
  }
}

// Singleton instance
let metricsEngineInstance: MetricsEngine | null = null;

/**
 * Get or create metrics engine instance
 */
export function getMetricsEngine(): MetricsEngine {
  if (!metricsEngineInstance) {
    metricsEngineInstance = new MetricsEngine();
  }
  return metricsEngineInstance;
}

/**
 * React hook for using metrics engine
 */
export function useMetricsEngine() {
  const engine = getMetricsEngine();

  return {
    start: () => engine.start(),
    stop: () => engine.stop(),
    subscribe: (type: string, callback: MetricsCallback) =>
      engine.subscribe(type, callback),
    getStatus: () => engine.getStatus(),
  };
}
