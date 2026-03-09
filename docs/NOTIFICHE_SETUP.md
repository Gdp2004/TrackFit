# 🔔 TrackFit – Notifiche Realtime

Guida completa all'architettura e al setup del sistema di notifiche in tempo reale di TrackFit, implementato con **Supabase Broadcast** nel piano gratuito.

---

## Architettura

```
Backend  →  inviaNotificaRealtime()
              ├── INSERT in tabella `notifications`  (service_role)
              └── Broadcast su canale "notifiche:{userId}"  ✅ (piano free)
                       ↓
Frontend →  useRealtime(userId)
              ├── mount        → GET /api/notifications  (storico notifiche non lette)
              ├── ogni 60s     → GET /api/notifications  (polling leggero di sincronizzazione)
              └── Broadcast listener → toast istantaneo + sincronizzazione DB dopo 2s
```

> **Nota:** Il sistema **non utilizza `postgres_changes`** (richiede piano Supabase a pagamento).  
> Il **Broadcast è gratuito** nel piano free di Supabase ed è sufficiente per notifiche istantanee.

---

## Setup iniziale (una tantum)

### Step 1 – Migrazione SQL

Apri **Supabase Dashboard → SQL Editor** e incolla il contenuto del file:

```
supabase/migrations/20260308_notifications.sql
```

Questo script crea la tabella `notifications` con le policy RLS necessarie.  
**Non è necessario** abilitare la Replication sulla tabella.

### Step 2 – Verifica variabili d'ambiente

Assicurati che nel file `.env.local` siano presenti le seguenti variabili:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## File coinvolti

| File | Responsabilità |
|:-----|:---------------|
| `supabase/migrations/20260308_notifications.sql` | Crea la tabella `notifications` e le policy RLS |
| `src/app/api/notifications/route.ts` | `GET` storico notifiche / `PATCH` segna come letta |
| `src/backend/infrastructure/adapter/out/notification/SupabaseRealtimeNotificationAdapter.ts` | Scrive nel DB e invia il Broadcast |
| `src/frontend/hooks/useRealtime.ts` | Hook React (polling + ricezione broadcast) |
| `src/frontend/components/layout/NotificationBell.tsx` | UI campanellino notifiche con toast |
| `src/frontend/lib/supabase-browser.ts` | Client Supabase isolato per scheda del browser |
| `src/middleware.ts` | Aggiunge la route `/api/notifications` alla whitelist |

---

## Utilizzo lato backend

```typescript
await notificationService.inviaNotificaRealtime(userId, {
  titolo: "Prenotazione confermata ✅",
  messaggio: "Il corso Yoga di domani alle 10:00 è confermato.",
  tipo: "conferma",
  dati: { corsoId: "abc123", data: "2026-03-10" }
});
```

---

## Utilizzo lato frontend

```tsx
// Campanellino notifiche nel Navbar (già integrato)
<NotificationBell userid={user.id} />
```

```tsx
// In un componente personalizzato
import { useRealtime } from "@frontend/hooks/useRealtime";

const { notifications, unreadCount, markAllAsRead, markAsRead } = useRealtime(userId);
```

---

## Supporto multi-scheda con utenti diversi

`supabase-browser.ts` utilizza uno `storageKey` univoco per scheda, basato su `sessionStorage`, in modo che sessioni diverse non interferiscano tra loro.

**Come testare:**

1. Premi `Ctrl+T` per aprire una **nuova scheda vuota**
2. Naviga su `localhost:3000/login` → accedi come **UTENTE**
3. Premi `Ctrl+T` per aprire un'altra nuova scheda vuota
4. Naviga su `localhost:3000/login` → accedi come **COACH**
5. Le due sessioni sono completamente indipendenti ✅

> ⚠️ **Attenzione:** aprire una scheda con `Ctrl+Click` su un link **eredita** il `sessionStorage` della scheda di origine. Usa sempre `Ctrl+T` per aprire una scheda vuota prima di fare login con un utente diverso.
