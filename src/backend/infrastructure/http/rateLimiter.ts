// ============================================================
// Rate Limiter – middleware utility per le API Routes
// In-memory (Map) per edge runtime. Per produzione scalabile
// sostituire con Redis (Upstash) mantenendo la stessa interfaccia.
// ============================================================

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

// Store globale (sopravvive tra le richieste nello stesso process)
const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
    /** Numero massimo di richieste nella finestra */
    limit: number;
    /** Durata della finestra in millisecondi */
    windowMs: number;
}

const PRESETS = {
    /** Route auth: 10 tentativi ogni 15 minuti (anti brute-force) */
    auth: { limit: 10, windowMs: 15 * 60 * 1000 },
    /** Route API generali: 100 richieste al minuto */
    api: { limit: 100, windowMs: 60 * 1000 },
    /** Route admin: 30 al minuto */
    admin: { limit: 30, windowMs: 60 * 1000 },
} as const;

export type RateLimitPreset = keyof typeof PRESETS;

/**
 * Controlla se la chiave (tipicamente IP o userid) ha superato il limite.
 * Ritorna `{ allowed: boolean, remaining: number, resetAt: Date }`.
 */
export function checkRateLimit(
    key: string,
    preset: RateLimitPreset | RateLimitConfig = "api"
): { allowed: boolean; remaining: number; resetAt: Date } {
    const config = typeof preset === "string" ? PRESETS[preset] : preset;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now - entry.windowStart >= config.windowMs) {
        // Prima richiesta nella finestra (o finestra scaduta)
        store.set(key, { count: 1, windowStart: now });
        return {
            allowed: true,
            remaining: config.limit - 1,
            resetAt: new Date(now + config.windowMs),
        };
    }

    if (entry.count >= config.limit) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(entry.windowStart + config.windowMs),
        };
    }

    entry.count += 1;
    return {
        allowed: true,
        remaining: config.limit - entry.count,
        resetAt: new Date(entry.windowStart + config.windowMs),
    };
}

/**
 * Pulisce le finestre scadute (chiamare periodicamente per evitare memory leak).
 * In production usare Redis con TTL automatico.
 */
export function cleanupExpiredEntries(windowMs = 15 * 60 * 1000): void {
    const cutoff = Date.now() - windowMs;
    for (const [key, entry] of store.entries()) {
        if (entry.windowStart < cutoff) store.delete(key);
    }
}

// Pulizia ogni 10 minuti
if (typeof setInterval !== "undefined") {
    setInterval(() => cleanupExpiredEntries(), 10 * 60 * 1000);
}
