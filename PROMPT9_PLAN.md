# 📊 Prompt 9 - Analytics & Real-time Engine

## Objective
Build advanced analytics dashboard with real-time metrics, revenue tracking, performance monitoring, and alert system for Tunibet crash game platform.

---

## Features to Implement

### 1. Advanced Analytics Dashboard
- Revenue charts (24h/7d/30d views)
- Active users gauge
- Bets per minute metrics
- House edge visualization
- Top players leaderboard
- Game statistics overview

### 2. Real-time Metrics Engine
- Supabase Realtime integration
- Live bet tracking
- Active player count
- Current round metrics
- Real-time revenue updates

### 3. Revenue Analytics
- Time-based filtering (today, week, month, custom)
- Revenue breakdown by game mode (demo/live)
- Profit margins visualization
- Withdrawal vs deposit tracking
- Net revenue calculations

### 4. Performance Monitoring
- System health indicators
- Database query performance
- API response times
- Error rate tracking
- Uptime monitoring

### 5. Alert System
- Configurable thresholds
- Email/webhook notifications
- Critical event alerts
- Performance degradation warnings
- Suspicious activity detection

### 6. Exportable Reports
- CSV/PDF export
- Custom date ranges
- Scheduled reports
- Email delivery
- Report templates

---

## Technical Stack

- **Charts:** Recharts (lightweight, React-native)
- **Real-time:** Supabase Realtime subscriptions
- **Export:** jsPDF, csv-export
- **Notifications:** React Hot Toast
- **State:** React hooks + context

---

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── analytics/
│   │       ├── page.tsx                    # Main analytics dashboard
│   │       ├── revenue/
│   │       │   └── page.tsx                # Revenue analytics
│   │       └── performance/
│   │           └── page.tsx                # Performance monitoring
│   └── api/
│       └── admin/
│           ├── analytics/
│           │   ├── revenue/route.ts        # Revenue data API
│           │   ├── metrics/route.ts        # Real-time metrics API
│           │   └── performance/route.ts    # Performance data API
│           └── export/
│               └── report/route.ts         # Report export API
├── components/
│   └── admin/
│       └── analytics/
│           ├── revenue-chart.tsx           # Revenue line chart
│           ├── active-users-gauge.tsx      # Active users gauge
│           ├── bets-per-minute.tsx         # BPM chart
│           ├── house-edge-chart.tsx        # House edge visualization
│           ├── top-players.tsx             # Leaderboard
│           ├── metrics-card.tsx            # Metric display card
│           ├── real-time-feed.tsx          # Live activity feed
│           └── export-modal.tsx            # Export configuration
└── lib/
    ├── analytics/
    │   ├── metrics-engine.ts               # Real-time metrics engine
    │   ├── calculations.ts                 # Analytics calculations
    │   └── alerts.ts                       # Alert system
    └── export/
        ├── pdf-generator.ts                # PDF report generation
        └── csv-generator.ts                # CSV export
```

---

## Implementation Steps

### Phase 1: Analytics Dashboard (2 hours)
1. Create analytics page layout
2. Build revenue chart component
3. Add active users gauge
4. Implement bets per minute chart
5. Create house edge visualization
6. Add top players leaderboard

### Phase 2: Real-time Engine (1.5 hours)
7. Set up Supabase Realtime subscriptions
8. Create metrics engine
9. Build real-time feed component
10. Add live metric updates

### Phase 3: Revenue Analytics (1 hour)
11. Create revenue analytics page
12. Add time-based filtering
13. Build breakdown charts
14. Implement comparison views

### Phase 4: Performance Monitoring (1 hour)
15. Create performance page
16. Add system health indicators
17. Build performance charts
18. Add error tracking

### Phase 5: Alert System (1 hour)
19. Create alert configuration
20. Implement threshold checks
21. Add notification system
22. Build alert history

### Phase 6: Export & Reports (1 hour)
23. Create export modal
24. Implement CSV export
25. Add PDF generation
26. Build report templates

---

## Database Schema Additions

```sql
-- Analytics cache table
CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type TEXT NOT NULL,
  time_period TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Alert configurations
CREATE TABLE alert_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id),
  alert_type TEXT NOT NULL,
  threshold DECIMAL NOT NULL,
  enabled BOOLEAN DEFAULT true,
  notification_method TEXT DEFAULT 'toast',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert history
CREATE TABLE alert_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_config_id UUID REFERENCES alert_configs(id),
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  metric_value DECIMAL NOT NULL,
  threshold DECIMAL NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_analytics_cache_type_period ON analytics_cache(metric_type, time_period);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);
CREATE INDEX idx_alert_history_triggered ON alert_history(triggered_at DESC);
```

---

## API Endpoints

### Analytics APIs
- `GET /api/admin/analytics/revenue` - Revenue data with time filters
- `GET /api/admin/analytics/metrics` - Real-time metrics snapshot
- `GET /api/admin/analytics/performance` - System performance data
- `GET /api/admin/analytics/top-players` - Leaderboard data

### Export APIs
- `POST /api/admin/export/report` - Generate and download report
- `GET /api/admin/export/schedule` - Get scheduled reports
- `POST /api/admin/export/schedule` - Create scheduled report

### Alert APIs
- `GET /api/admin/alerts/configs` - Get alert configurations
- `POST /api/admin/alerts/configs` - Create/update alert config
- `GET /api/admin/alerts/history` - Get alert history

---

## Key Metrics to Track

### Revenue Metrics
- Total revenue (24h/7d/30d)
- Revenue by game mode
- Average bet size
- House edge percentage
- Profit margins
- Withdrawal vs deposit ratio

### User Metrics
- Active users (now/24h)
- New registrations
- Retention rate
- Average session duration
- User lifetime value

### Game Metrics
- Total rounds played
- Average crash point
- Bets per minute
- Win rate
- Biggest wins/losses

### Performance Metrics
- API response times
- Database query times
- Error rate
- Uptime percentage
- Concurrent users

---

## Real-time Features

### Supabase Realtime Subscriptions
```typescript
// Subscribe to new bets
supabase
  .channel('bets')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'bets'
  }, handleNewBet)
  .subscribe();

// Subscribe to new rounds
supabase
  .channel('rounds')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'rounds'
  }, handleRoundUpdate)
  .subscribe();
```

---

## Chart Types

1. **Revenue Chart** - Line chart with multiple series
2. **Active Users** - Radial gauge
3. **Bets Per Minute** - Bar chart with trend line
4. **House Edge** - Area chart
5. **Top Players** - Horizontal bar chart
6. **Game Stats** - Donut chart

---

## Dependencies to Install

```bash
npm install recharts jspdf csv-export date-fns
```

---

## Acceptance Criteria

- [ ] Analytics dashboard displays all key metrics
- [ ] Charts update in real-time
- [ ] Revenue analytics with time filtering works
- [ ] Performance monitoring shows system health
- [ ] Alert system triggers on thresholds
- [ ] Export to CSV/PDF works
- [ ] Real-time feed shows live activity
- [ ] All charts are responsive
- [ ] Loading states for all data
- [ ] Error handling throughout

---

## Estimated Time: 7.5 hours

**Status:** Ready to implement
