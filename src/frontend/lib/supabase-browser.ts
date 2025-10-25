// ============================================================
// Supabase Browser Client  (frontend only)
// Use this in React components and custom hooks.
// It uses the ANON key + RLS policies for security.
// ============================================================
//
// ⚠️  DO NOT use this in API Routes or Server Actions.
//     Use @/backend/infrastructure/config/supabase.ts instead.
//
// ============================================================

import { createBrowserClient } from "@supabase/ssr";

export const supabaseBrowser = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
