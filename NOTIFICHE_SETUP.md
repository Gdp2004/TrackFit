# TrackFit – Notifiche Realtime (Piano Gratuito Supabase)

## Architettura finale (zero costi aggiuntivi)

```
Backend inviaNotificaRealtime()
  ├── INSERT in tabella notifications (service_role)
  └── Broadcast su canale "notifiche:{userid}" (piano free ✅)
         ↓
Frontend useRealtime(userid)
  ├── mount → GET /api/notifications (storico non lette)
  ├── ogni 60s → GET /api/notifications (polling leggero)
  └── Broadcast listener → toast istantaneo + sync DB dopo 2s
```

**Non viene usato `postgres_changes`** → richiede piano a pagamento.
**Il Broadcast è gratuito** nel piano free di Supabase.

---

## Setup (una tantum)

### STEP 1 – Migrazione SQL

Vai su **Supabase Dashboard → SQL Editor** e incolla il contenuto di:
`supabase/migrations/20260308_notifications.sql`

NON serve abilitare la Replication sulla tabella.

### STEP 2 – Verifica variabili d'ambiente

Nel `.env.local` devono essere presenti:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## File coinvolti

| File | Ruolo |
|------|-------|
| `supabase/migrations/20260308_notifications.sql` | Crea tabella + RLS |
| `src/app/api/notifications/route.ts` | GET storico / PATCH mark-as-read |
| `src/backend/infrastructure/adapter/out/notification/SupabaseRealtimeNotificationAdapter.ts` | Scrive DB + invia Broadcast |
| `src/frontend/hooks/useRealtime.ts` | Hook React (polling + broadcast) |
| `src/frontend/components/layout/NotificationBell.tsx` | UI campanellino + toast |
| `src/frontend/lib/supabase-browser.ts` | Client isolato per scheda |
| `src/middleware.ts` | Aggiunta route `/api/notifications` |

---

## Uso dal backend

```typescript
await notificationService.inviaNotificaRealtime(userId, {
  titolo: "Prenotazione confermata ✅",
  messaggio: "Il corso Yoga di domani alle 10:00 è confermato.",
  tipo: "conferma",
  dati: { corsoId: "...", data: "..." }
});
```

## Uso dal frontend

```tsx
// Nel Navbar (già integrato)
<NotificationBell userid={user.id} />

// In un componente custom
import { useRealtime } from "@frontend/hooks/useRealtime";
const { notifications, unreadCount, markAllAsRead, markAsRead } = useRealtime(userid);
```

---

## Multi-scheda con utenti diversi

`supabase-browser.ts` usa uno `storageKey` univoco per scheda via `sessionStorage`.

**Per testare:**
1. Apri `localhost:3000/login` in una nuova scheda → login UTENTE
2. Apri `localhost:3000/login` in un'altra nuova scheda → login COACH
3. Le sessioni sono completamente indipendenti ✅

**Nota:** aprire una scheda con Ctrl+click su un link eredita `sessionStorage`.
Usare sempre `Ctrl+T` → nuova scheda vuota → navigare a `/login`.
