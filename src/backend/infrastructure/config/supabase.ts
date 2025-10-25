import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// ─── Client-side (browser) ───────────────────────────────────────────────────
export function createSupabaseBrowserClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// ─── Server-side (service role – use only in Server Actions / API Routes) ────
export function createSupabaseServerClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
