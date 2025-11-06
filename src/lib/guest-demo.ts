import { User } from '@/stores/useStore';

const GUEST_STORAGE_KEY = 'tunibet-guest-demo';

export interface GuestDemoData {
  guestId: string;
  balance: number;
  bets: Array<{
    id: string;
    amount: number;
    multiplier: number;
    profit: number;
    timestamp: number;
  }>;
  createdAt: number;
}

// Generate a unique guest ID
export function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize guest demo session
export function initGuestDemo(): User {
  const guestId = generateGuestId();
  
  const guestData: GuestDemoData = {
    guestId,
    balance: 1000,
    bets: [],
    createdAt: Date.now(),
  };

  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestData));
  }

  // Return a User object for the store
  return {
    id: guestId,
    email: 'guest@tunibet.tn',
    display_name: 'Invité',
    demo_balance: 1000,
    live_balance: 0,
    balance_type: 'virtual',
    virtual_balance_saved: 1000,
    is_admin: false,
    created_at: new Date().toISOString(),
  };
}

// Get guest demo data from localStorage
export function getGuestDemo(): GuestDemoData | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!data) return null;
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading guest demo data:', error);
    return null;
  }
}

// Update guest demo balance
export function updateGuestBalance(newBalance: number): void {
  const guestData = getGuestDemo();
  if (!guestData) return;

  guestData.balance = newBalance;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestData));
  }
}

// Add a bet to guest history
export function addGuestBet(bet: {
  amount: number;
  multiplier: number;
  profit: number;
}): void {
  const guestData = getGuestDemo();
  if (!guestData) return;

  guestData.bets.push({
    id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...bet,
    timestamp: Date.now(),
  });

  // Keep only last 50 bets
  if (guestData.bets.length > 50) {
    guestData.bets = guestData.bets.slice(-50);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestData));
  }
}

// Clear guest demo data
export function clearGuestDemo(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_STORAGE_KEY);
  }
}

// Check if guest demo exists
export function hasGuestDemo(): boolean {
  return getGuestDemo() !== null;
}

// Get guest demo as User object
export function getGuestDemoAsUser(): User | null {
  const guestData = getGuestDemo();
  if (!guestData) return null;

  return {
    id: guestData.guestId,
    email: 'guest@tunibet.tn',
    display_name: 'Invité',
    demo_balance: guestData.balance,
    live_balance: 0,
    balance_type: 'virtual',
    virtual_balance_saved: guestData.balance,
    is_admin: false,
    created_at: new Date(guestData.createdAt).toISOString(),
  };
}
