# 🚀 Tunibet Crash - Deployment Guide

## Complete Production Deployment Checklist

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup ✓

**Run all migrations in Supabase SQL Editor:**

```sql
-- 1. Run SUPABASE_ADMIN.sql (Prompt 8)
-- 2. Run SUPABASE_ANALYTICS.sql (Prompt 9)
-- 3. Run SUPABASE_TELEGRAM.sql (Prompt 10)
```

**Verify tables created:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables:**
- users
- rounds
- bets
- transactions
- admin_logs
- analytics_cache
- alert_configs
- alert_history
- telegram_users
- notification_queue
- bot_stats

---

### 2. Environment Variables

**Create `.env.local` file:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL
NEXT_PUBLIC_APP_URL=https://tunibet.com

# Telegram Bot
TELEGRAM_BOT_TOKEN=8403365999:AAGhAS9XQ1AP0MmM2m8WUZr-waudY146kbQ
TELEGRAM_WEBHOOK_URL=https://tunibet.com/api/telegram/webhook

# NOWPayments (when ready)
NOWPAYMENTS_API_KEY=your_nowpayments_key
NOWPAYMENTS_IPN_SECRET=your_ipn_secret

# Optional
NODE_ENV=production
```

---

### 3. Dependencies Installation

```bash
# Install all dependencies
npm install

# Verify no vulnerabilities
npm audit

# Build test
npm run build
```

**Required packages:**
- next
- react
- @supabase/ssr
- @supabase/supabase-js
- framer-motion
- lucide-react
- recharts
- node-telegram-bot-api

---

### 4. Code Review

**Check critical files:**
- [ ] All API routes have error handling
- [ ] All database queries use RLS
- [ ] No hardcoded secrets
- [ ] All imports are correct
- [ ] TypeScript errors resolved

**Run linting:**
```bash
npm run lint
```

---

## 🔧 Deployment Steps

### Step 1: Deploy to Vercel

**1. Connect Repository:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

**2. Configure Project:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**3. Set Environment Variables:**
Go to Vercel Dashboard → Settings → Environment Variables
Add all variables from `.env.local`

**4. Deploy:**
```bash
vercel --prod
```

---

### Step 2: Configure Supabase

**1. Update Allowed URLs:**
- Go to Supabase Dashboard
- Authentication → URL Configuration
- Add production URL: `https://tunibet.com`
- Add redirect URLs

**2. Enable RLS:**
Verify all tables have RLS enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**3. Create Admin User:**
```sql
-- After first user signs up
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@tunibet.com';
```

---

### Step 3: Set Up Telegram Bot

**1. Set Webhook:**
```bash
curl -X POST "https://api.telegram.org/bot8403365999:AAGhAS9XQ1AP0MmM2m8WUZr-waudY146kbQ/setWebhook" \
  -d "url=https://tunibet.com/api/telegram/webhook"
```

**2. Verify Webhook:**
```bash
curl "https://api.telegram.org/bot8403365999:AAGhAS9XQ1AP0MmM2m8WUZr-waudY146kbQ/getWebhookInfo"
```

**3. Test Bot:**
- Search for your bot on Telegram
- Send `/start`
- Verify response

---

### Step 4: Configure Cron Jobs

**Option A: Vercel Cron (Recommended)**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/telegram/process-queue",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/game/cleanup",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Option B: External Cron**
Use cron-job.org or similar:
```
*/5 * * * * curl https://tunibet.com/api/telegram/process-queue
0 * * * * curl https://tunibet.com/api/game/cleanup
```

---

### Step 5: Configure NOWPayments

**1. Get API Keys:**
- Sign up at nowpayments.io
- Get API key and IPN secret
- Add to environment variables

**2. Set IPN URL:**
- IPN URL: `https://tunibet.com/api/payments/ipn`
- Enable IPN in NOWPayments dashboard

**3. Test Payment:**
- Make small test deposit
- Verify IPN callback
- Check transaction status

---

## 🧪 Post-Deployment Testing

### 1. Authentication Flow
- [ ] Sign up new user
- [ ] Verify email (if enabled)
- [ ] Sign in
- [ ] Sign out
- [ ] Password reset

### 2. Game Functionality
- [ ] Load game page
- [ ] Place demo bet
- [ ] Cash out
- [ ] View bet history
- [ ] Check balance update

### 3. Payment System
- [ ] View wallet page
- [ ] Generate deposit address
- [ ] Make test deposit
- [ ] Verify balance update
- [ ] Request withdrawal
- [ ] Admin approve withdrawal

### 4. Admin Panel
- [ ] Access admin dashboard
- [ ] View statistics
- [ ] Manage withdrawals
- [ ] Ban/unban user
- [ ] View audit logs
- [ ] Check analytics

### 5. Telegram Bot
- [ ] Send /start to bot
- [ ] Link account
- [ ] Check /balance
- [ ] View /stats
- [ ] Test notifications
- [ ] Admin /broadcast

---

## 🔒 Security Hardening

### 1. Rate Limiting

**Add rate limiting middleware:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map();

export function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;

  const requests = rateLimit.get(ip) || [];
  const recentRequests = requests.filter((time: number) => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

### 2. CORS Configuration

**Add CORS headers:**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://tunibet.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

---

### 3. Content Security Policy

**Add CSP headers:**
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

---

### 4. Input Validation

**Validate all user inputs:**
```typescript
// Example validation
function validateBetAmount(amount: number): boolean {
  return (
    typeof amount === 'number' &&
    amount >= 1 &&
    amount <= 10000 &&
    Number.isFinite(amount)
  );
}
```

---

## 📊 Monitoring Setup

### 1. Error Tracking

**Option A: Sentry**
```bash
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs
```

**Option B: LogRocket**
```bash
npm install logrocket
```

---

### 2. Analytics

**Add Google Analytics:**
```typescript
// app/layout.tsx
import Script from 'next/script';

<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
  strategy="afterInteractive"
/>
```

---

### 3. Uptime Monitoring

**Use services like:**
- UptimeRobot
- Pingdom
- StatusCake

Monitor:
- Main site (/)
- API health (/api/health)
- Game endpoint (/api/game/state)
- Telegram webhook (/api/telegram/webhook)

---

## 🔄 Backup Strategy

### 1. Database Backups

**Supabase automatic backups:**
- Daily backups (retained 7 days)
- Point-in-time recovery

**Manual backup:**
```bash
# Export database
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

---

### 2. Code Backups

**Git repository:**
- Push to GitHub/GitLab
- Tag releases
- Maintain branches

---

## 📈 Performance Optimization

### 1. Next.js Optimization

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  swcMinify: true,
};
```

---

### 2. Database Optimization

**Add missing indexes:**
```sql
-- Frequently queried columns
CREATE INDEX IF NOT EXISTS idx_bets_user_created 
  ON bets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_type 
  ON transactions(user_id, type, status);
```

---

### 3. Caching Strategy

**Add Redis (optional):**
```bash
npm install ioredis
```

**Cache frequently accessed data:**
- User balances
- Active rounds
- Leaderboards

---

## 🎯 Launch Checklist

### Final Verification

- [ ] All database migrations applied
- [ ] Environment variables configured
- [ ] Telegram webhook active
- [ ] Payment system tested
- [ ] Admin account created
- [ ] SSL certificate active
- [ ] Domain configured
- [ ] Analytics tracking
- [ ] Error monitoring
- [ ] Backups configured
- [ ] Rate limiting active
- [ ] Security headers set
- [ ] CORS configured
- [ ] Cron jobs running
- [ ] Documentation complete

---

### Go-Live Steps

1. **Final smoke test:**
   - Test all critical paths
   - Verify no errors in logs
   - Check performance metrics

2. **Enable production mode:**
   - Set NODE_ENV=production
   - Disable debug logs
   - Enable caching

3. **Monitor closely:**
   - Watch error rates
   - Check response times
   - Monitor user activity

4. **Announce launch:**
   - Social media posts
   - Email notifications
   - Telegram announcements

---

## 🆘 Troubleshooting

### Common Issues

**1. Webhook not receiving updates:**
```bash
# Check webhook status
curl "https://api.telegram.org/bot{TOKEN}/getWebhookInfo"

# Delete and reset
curl -X POST "https://api.telegram.org/bot{TOKEN}/deleteWebhook"
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook?url={URL}"
```

**2. Database connection errors:**
- Check Supabase status
- Verify connection string
- Check RLS policies

**3. Payment not processing:**
- Verify IPN URL
- Check NOWPayments logs
- Verify API keys

**4. Game not loading:**
- Check browser console
- Verify API responses
- Check WebSocket connection

---

## 📞 Support Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Telegram Bot API: https://core.telegram.org/bots/api
- NOWPayments: https://nowpayments.io/doc

### Community
- Next.js Discord
- Supabase Discord
- Telegram Bot Developers

---

## 🎉 Launch Complete!

**Your Tunibet Crash platform is now live!**

### Next Steps:
1. Monitor performance
2. Gather user feedback
3. Fix bugs promptly
4. Add new features
5. Scale as needed

**Good luck with your launch!** 🚀🎰

---

**Last Updated:** November 4, 2025
**Version:** 1.0.0
**Status:** Production Ready ✅
