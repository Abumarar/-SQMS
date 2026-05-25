# API & Real-Time Integration Guide

This document outlines the approach for interacting with the Supabase Backend and WebSockets for the SQMS.

## 1. Supabase Client Setup

Since we are using Supabase as our BaaS, we will leverage `@supabase/supabase-js` within the Next.js frontend to securely access data. We utilize RLS (Row-Level Security) to ensure safe direct-to-database queries from the client.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 2. Real-Time Subscriptions (WebSockets)

For live sync of queue statuses with zero latency, we subscribe to PostgreSQL changes via Supabase Realtime channels.

### Subscribing to Ticket Updates

To keep the User Portal and Admin Dashboard synchronized, we listen to updates on the `Tickets` table.

```javascript
const channel = supabase
  .channel('public:Tickets')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Tickets' },
    (payload) => {
      console.log('Ticket Change Received!', payload)
      // Call UI update functions here to reflect new position/status
    }
  )
  .subscribe()
```

## 3. Edge Functions
We will employ Supabase Edge Functions for tasks that require elevated permissions or complex server-side validation. Examples:
*   **Ticket Generation API:** Ensure transactional consistency when generating the next ticket position number for a specific queue to avoid race conditions.
*   **Notifications Hook:** Trigger asynchronous webhook actions for notifications (Push/SMS) when a ticket status changes to `almost_turn`.

### Invoking Edge Functions

```javascript
const { data, error } = await supabase.functions.invoke('generate-ticket', {
  body: { queue_id: '1234', user_id: '5678' }
})
```

## 4. Environment Variables Checklist
Ensure these keys are configured in your Vercel deployment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Only for Edge Functions, never expose to frontend)
