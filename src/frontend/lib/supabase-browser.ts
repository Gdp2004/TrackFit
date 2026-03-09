// ============================================================
// supabase-browser.ts – CLIENT ISOLATO PER SCHEDA
//
// PROBLEMA MULTI-SCHEDA:
//   Supabase di default usa localStorage per la sessione.
//   Aprendo più schede, tutte condividono lo stesso token
//   → fare login come COACH in una scheda sovrascrive la
//     sessione UTENTE nell'altra.
//
// SOLUZIONE:
//   Ogni scheda del browser usa un `storageKey` univoco basato
//   su sessionStorage (che è isolato per scheda, a differenza
//   di localStorage che è condiviso tra tutte le schede).
//
//   Al primo caricamento della scheda, generiamo un ID casuale
//   e lo salviamo in sessionStorage. Questo ID viene usato
//   come prefisso per le chiavi Supabase → ogni scheda ha
//   la propria sessione completamente indipendente.
//
// NOTE:
//   - sessionStorage viene cancellato alla chiusura della scheda
//   - Aprire una nuova scheda da un link (Ctrl+click) NON copia
//     sessionStorage → ogni scheda parte fresh
//   - Non influisce sulle API Routes (lato server usa service_role)
// ============================================================

import { createBrowserClient } from "@supabase/ssr";

// Genera o recupera un ID univoco per questa scheda del browser
function getTabSessionKey(): string {
    // sessionStorage è isolato per scheda (non condiviso come localStorage)
    const existing = sessionStorage.getItem("tf_tab_id");
    if (existing) return existing;

    const newId = `tab_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("tf_tab_id", newId);
    return newId;
}

// Crea il client Supabase con storageKey isolato per scheda
function createIsolatedBrowserClient() {
    // Durante SSR (Node.js) sessionStorage non esiste → client standard
    if (typeof window === "undefined") {
        return createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    const tabKey = getTabSessionKey();

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                // Ogni scheda salva la sessione con chiave univoca
                storageKey: `sb_${tabKey}`,
                // Usa localStorage ma con chiave isolata per scheda
                // (sessionStorage non supportato nativamente da Supabase SSR)
                storage: {
                    getItem: (key) => {
                        try { return localStorage.getItem(`${tabKey}_${key}`); }
                        catch { return null; }
                    },
                    setItem: (key, value) => {
                        try { localStorage.setItem(`${tabKey}_${key}`, value); }
                        catch { /* ignore */ }
                    },
                    removeItem: (key) => {
                        try { localStorage.removeItem(`${tabKey}_${key}`); }
                        catch { /* ignore */ }
                    },
                },
            },
        }
    );
}

// Singleton per questa scheda (re-crea solo se la pagina viene ricaricata)
export const supabaseBrowser = createIsolatedBrowserClient();
