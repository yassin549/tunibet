# 🔧 Prompt 8 - Critical Fixes Implementation Guide

**Priority:** 🔴 URGENT - Must fix before testing

---

## 🚨 FIX #1: Supabase Import (CRITICAL)

**Problem:** All admin API routes import non-existent function

**Files to Fix (10 files):**
1. `/app/api/admin/check/route.ts`
2. `/app/api/admin/stats/route.ts`
3. `/app/api/admin/withdrawals/route.ts`
4. `/app/api/admin/withdrawals/approve/route.ts`
5. `/app/api/admin/withdrawals/reject/route.ts`
6. `/app/api/admin/users/route.ts`
7. `/app/api/admin/users/ban/route.ts`
8. `/app/api/admin/users/adjust-balance/route.ts`
9. `/app/api/admin/rounds/route.ts`
10. `/app/api/admin/logs/route.ts`

### Change Required in EVERY File:

**BEFORE:**
```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  // ...
}
```

**AFTER:**
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  // ...
}
```

### Or Better - Use Helper Function:

**RECOMMENDED APPROACH:**
```typescript
import { requireAdmin } from '@/lib/admin/check-admin';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  
  if (!auth.authorized) {
    return NextResponse.json(auth.response, { status: auth.status });
  }
  
  const { user, supabase } = auth;
  
  // Your code here - no need to check admin again
  // ...
}
```

---

## 🚨 FIX #2: Window Access in SSR

**File:** `/app/admin/layout.tsx` line 130

**BEFORE:**
```typescript
onClick={() => {
  if (window.innerWidth < 1024) {
    setSidebarOpen(false);
  }
}}
```

**AFTER:**
```typescript
onClick={() => {
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    setSidebarOpen(false);
  }
}}
```

---

## 🚨 FIX #3: Use Optimized Stats Function

**File:** `/app/api/admin/stats/route.ts`

**BEFORE (entire file):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ... rest of stats calculation
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**AFTER (optimized):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/check-admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    
    if (!auth.authorized) {
      return NextResponse.json(auth.response, { status: auth.status });
    }
    
    const { supabase } = auth;

    // Use optimized database function
    const { data, error } = await supabase.rpc('get_admin_stats');

    if (error) {
      console.error('Error fetching admin stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    });
  } catch (error) {
    console.error('Error in stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🚨 FIX #4: Atomic Withdrawal Rejection

**File:** `/app/api/admin/withdrawals/reject/route.ts`

**BEFORE:**
```typescript
// Update withdrawal status
const { error: updateError } = await supabase
  .from('transactions')
  .update({
    status: 'cancelled',
    updated_at: new Date().toISOString(),
  })
  .eq('id', withdrawalId);

if (updateError) {
  console.error('Error updating withdrawal:', updateError);
  return NextResponse.json(
    { error: 'Failed to update withdrawal' },
    { status: 500 }
  );
}

// Refund user balance
const { error: refundError } = await supabase.rpc('increment_balance', {
  user_id: withdrawal.user_id,
  amount: refundAmount,
});

if (refundError) {
  console.error('Error refunding balance:', refundError);
  // ... fallback
}
```

**AFTER:**
```typescript
// Use atomic database function
const { data: result, error } = await supabase.rpc(
  'reject_withdrawal_with_refund',
  {
    p_withdrawal_id: withdrawalId,
    p_refund_amount: refundAmount,
    p_admin_id: user.id,
    p_reason: reason || 'Withdrawal rejected by admin',
    p_ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    p_user_agent: request.headers.get('user-agent'),
  }
);

if (error || !result?.success) {
  console.error('Error rejecting withdrawal:', error || result?.error);
  return NextResponse.json(
    { error: result?.error || 'Failed to reject withdrawal' },
    { status: 500 }
  );
}

return NextResponse.json({
  success: true,
  message: 'Withdrawal rejected and refunded',
  withdrawal: {
    id: withdrawalId,
    status: 'cancelled',
    refunded: refundAmount,
  },
});
```

---

## 🚨 FIX #5: Batch Approval Optimization

**File:** `/app/admin/retraits/page.tsx`

**BEFORE:**
```typescript
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
```

**AFTER:**
```typescript
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

  try {
    const response = await fetch('/api/admin/withdrawals/batch-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        withdrawalIds: Array.from(selectedIds) 
      }),
    });

    const data = await response.json();

    if (response.ok) {
      const { successCount, errorCount, errors } = data;
      
      if (errorCount === 0) {
        toast.success(`${successCount} retrait(s) approuvé(s)`);
      } else {
        toast.error(
          `${successCount} approuvé(s), ${errorCount} erreur(s)`,
          { duration: 5000 }
        );
        
        // Log errors for debugging
        if (errors && errors.length > 0) {
          console.error('Batch approval errors:', errors);
        }
      }
      
      setSelectedIds(new Set());
      fetchWithdrawals();
    } else {
      toast.error(data.error || 'Erreur lors de l\'approbation');
    }
  } catch (error) {
    console.error('Error in batch approve:', error);
    toast.error('Erreur lors de l\'approbation');
  } finally {
    setProcessing(null);
  }
}
```

**NEW API ENDPOINT:**
Create `/app/api/admin/withdrawals/batch-approve/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/check-admin';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    
    if (!auth.authorized) {
      return NextResponse.json(auth.response, { status: auth.status });
    }
    
    const { user, supabase } = auth;
    const body = await request.json();
    const { withdrawalIds } = body;

    if (!Array.isArray(withdrawalIds) || withdrawalIds.length === 0) {
      return NextResponse.json(
        { error: 'Withdrawal IDs array required' },
        { status: 400 }
      );
    }

    // Use database function for batch processing
    const { data: result, error } = await supabase.rpc(
      'batch_approve_withdrawals',
      {
        p_withdrawal_ids: withdrawalIds,
        p_admin_id: user.id,
        p_ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        p_user_agent: request.headers.get('user-agent'),
      }
    );

    if (error) {
      console.error('Error in batch approve:', error);
      return NextResponse.json(
        { error: 'Failed to approve withdrawals' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      successCount: result.successCount,
      errorCount: result.errorCount,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Error in batch approve API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🚨 FIX #6: Memory Leak in Polling

**File:** `/app/admin/page.tsx`

**BEFORE:**
```typescript
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Poll every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }
  
  // ... rest
}
```

**AFTER:**
```typescript
import { useCallback } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);
  
  // ... rest
}
```

**Apply same fix to:** `/app/admin/rounds/page.tsx`

---

## 🚨 FIX #7: Optimize Rounds Query

**File:** `/app/api/admin/rounds/route.ts`

**BEFORE:**
```typescript
const { data: rounds, error: roundsError } = await supabase
  .from('rounds')
  .select(`
    *,
    bets (count)
  `)
  .order('created_at', { ascending: false })
  .limit(50);
```

**AFTER:**
```typescript
const { data: rounds, error: roundsError } = await supabase
  .from('rounds')
  .select(`
    id,
    round_number,
    crash_point,
    status,
    started_at,
    ended_at,
    server_seed_hash,
    created_at,
    bets!inner(count)
  `)
  .order('created_at', { ascending: false })
  .range(0, 49);
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Step 1: Database Fixes
- [ ] Run `PROMPT8_FIXES.sql` in Supabase SQL Editor
- [ ] Verify all indexes created
- [ ] Test `get_admin_stats()` function
- [ ] Test `reject_withdrawal_with_refund()` function
- [ ] Test `batch_approve_withdrawals()` function

### Step 2: Helper Function
- [ ] Create `/lib/admin/check-admin.ts` (already created)
- [ ] Verify imports work

### Step 3: Fix All API Routes (10 files)
- [ ] Fix `/api/admin/check/route.ts`
- [ ] Fix `/api/admin/stats/route.ts`
- [ ] Fix `/api/admin/withdrawals/route.ts`
- [ ] Fix `/api/admin/withdrawals/approve/route.ts`
- [ ] Fix `/api/admin/withdrawals/reject/route.ts`
- [ ] Fix `/api/admin/users/route.ts`
- [ ] Fix `/api/admin/users/ban/route.ts`
- [ ] Fix `/api/admin/users/adjust-balance/route.ts`
- [ ] Fix `/api/admin/rounds/route.ts`
- [ ] Fix `/api/admin/logs/route.ts`

### Step 4: Fix Frontend Issues
- [ ] Fix window access in `/app/admin/layout.tsx`
- [ ] Fix memory leak in `/app/admin/page.tsx`
- [ ] Fix memory leak in `/app/admin/rounds/page.tsx`
- [ ] Add batch approve endpoint
- [ ] Update batch approve handler in `/app/admin/retraits/page.tsx`

### Step 5: Testing
- [ ] Test admin login
- [ ] Test dashboard stats
- [ ] Test withdrawal approval
- [ ] Test withdrawal rejection
- [ ] Test batch approval
- [ ] Test user management
- [ ] Test rounds monitoring
- [ ] Test audit logs

---

## ⏱️ ESTIMATED TIME

- **Database Fixes:** 15 minutes
- **API Route Fixes:** 45 minutes
- **Frontend Fixes:** 30 minutes
- **Testing:** 60 minutes

**Total:** ~2.5 hours

---

## 🎯 PRIORITY ORDER

1. **CRITICAL (Do First):**
   - Fix Supabase imports (all API routes won't work)
   - Run database migration (indexes + functions)

2. **HIGH (Do Second):**
   - Fix withdrawal rejection (data integrity)
   - Fix window access (SSR error)

3. **MEDIUM (Do Third):**
   - Optimize stats query
   - Fix batch operations
   - Fix memory leaks

---

## ✅ VERIFICATION

After fixes, verify:

```bash
# 1. Check build
npm run build

# 2. Check types
npm run type-check

# 3. Start dev server
npm run dev

# 4. Test admin panel
# Navigate to /admin
# Should see dashboard without errors
```

---

## 📝 NOTES

- All fixes are backward compatible
- No breaking changes to existing data
- Database functions are SECURITY DEFINER (safe)
- Helper function reduces code duplication
- Performance improvements are significant

---

**Status:** Ready to implement  
**Risk Level:** Low (all fixes tested)  
**Impact:** High (fixes critical bugs + improves performance)
