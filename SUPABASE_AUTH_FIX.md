# Fix: Supabase Email Signup Error

## Error: "Email address is invalid"

This error occurs when Supabase Auth has strict email validation or email confirmation enabled without proper SMTP configuration.

## Solution: Configure Supabase Auth Settings

### Step 1: Disable Email Confirmation (For Development)

1. **Go to Supabase Dashboard** → Your Project
2. **Navigate to**: `Authentication` → `Providers` → `Email`
3. **Find**: "Confirm email" setting
4. **Toggle OFF**: "Enable email confirmations"
5. **Click**: "Save"

This allows users to sign up without email verification (suitable for development).

---

### Step 2: OR Configure Email Provider (For Production)

If you want to keep email confirmations enabled:

1. **Go to**: `Authentication` → `Email Templates`
2. **Configure SMTP** or use Supabase's built-in email service
3. **Set up custom SMTP** (Resend, SendGrid, etc.)

#### Using Resend (Recommended):

1. Get API key from [resend.com](https://resend.com)
2. In Supabase: `Project Settings` → `Auth` → `SMTP Settings`
3. Configure:
   ```
   Host: smtp.resend.com
   Port: 587
   User: resend
   Password: [YOUR_RESEND_API_KEY]
   Sender email: noreply@yourdomain.com
   ```

---

### Step 3: Check Site URL Configuration

1. **Go to**: `Authentication` → `URL Configuration`
2. **Set Site URL**: `http://localhost:3000` (development)
3. **Add Redirect URLs**: 
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/game`

---

### Step 4: Verify Email Domain Settings

1. **Go to**: `Authentication` → `Providers` → `Email`
2. **Check**: "Allowed email domains" (should be empty or include gmail.com)
3. If restricted, add: `gmail.com,yahoo.com,outlook.com` etc.

---

## Quick Fix for Development

**Disable email confirmations** to allow instant signups without email verification.

Path: `Authentication` → `Providers` → `Email` → **Disable "Confirm email"**

---

## After Changes

1. Wait 1-2 minutes for settings to propagate
2. Try signing up again with any email
3. Should work immediately without confirmation

---

## Alternative: Use `autoConfirm` in Signup (Development Only)

If you need emails confirmed but want to bypass for testing, you can use the Supabase service role key (NEVER in production):

```typescript
// DO NOT USE IN PRODUCTION
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      display_name: displayName || email.split('@')[0],
    },
  },
});
```

But the proper fix is to configure Supabase Auth settings as described above.
