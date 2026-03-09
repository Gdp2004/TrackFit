// ============================================================
// RBAC Middleware – NFR-R4
// Verifica JWT Supabase + controllo ruolo sulle API Routes
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

const ROUTE_ROLES: Record<string, string[]> = {
    // Admin
    "/api/admin/users": ["ADMIN"],
    "/api/admin": ["ADMIN"],
    // User profile (all authenticated roles)
    "/api/users/me": ["UTENTE", "COACH", "GESTORE", "ADMIN"],
    // Notifications (tutti i ruoli autenticati)
    "/api/notifications": ["UTENTE", "COACH", "GESTORE", "ADMIN"],
    // Gyms
    "/api/gyms/corsi/prenotazioni": ["UTENTE", "GESTORE", "ADMIN"],
    "/api/gyms/tipi-abbonamento": ["UTENTE", "COACH", "GESTORE", "ADMIN"],
    "/api/gyms/coupon": ["GESTORE", "ADMIN"],
    "/api/gyms/corsi": ["GESTORE", "ADMIN"],
    "/api/gyms/me": ["GESTORE", "ADMIN"],
    "/api/gyms": ["UTENTE", "COACH", "GESTORE", "ADMIN"],
    // Coaches
    "/api/coaches/prenotazioni": ["UTENTE", "COACH", "ADMIN"],
    "/api/coaches/me": ["COACH", "ADMIN"],
    "/api/coaches": ["UTENTE", "COACH", "ADMIN"],
    // Reports
    "/api/reports": ["COACH", "GESTORE", "ADMIN"],
    // Subscriptions
    "/api/subscriptions/validate": ["UTENTE", "GESTORE", "ADMIN"],
    "/api/subscriptions/cancel": ["UTENTE", "ADMIN"],
    "/api/subscriptions/payments": ["UTENTE", "GESTORE", "ADMIN"],
    "/api/subscriptions": ["UTENTE", "GESTORE", "ADMIN"],
    // Workouts
    "/api/workouts": ["UTENTE", "COACH", "ADMIN"],
    // Reviews
    "/api/reviews": ["UTENTE", "COACH", "GESTORE", "ADMIN"],
};

const PUBLIC_ROUTES = ["/api/auth", "/api/health"];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
        return NextResponse.next();
    }

    const matchedKey = Object.keys(ROUTE_ROLES)
        .filter((k) => pathname.startsWith(k))
        .sort((a, b) => b.length - a.length)[0];

    if (!matchedKey) return NextResponse.next();

    const allowedRoles = ROUTE_ROLES[matchedKey];

    let supabaseUser: { id: string; role?: string } | null = null;
    try {
        const response = NextResponse.next();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => req.cookies.getAll(),
                    setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            response.cookies.set(name, value, options as any)
                        );
                    },
                },
            }
        );

        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
        }

        supabaseUser = {
            id: user.id,
            role: (user.user_metadata?.ruolo as string) ?? "UTENTE",
        };
    } catch {
        return NextResponse.json({ error: "Errore autenticazione." }, { status: 401 });
    }

    if (!allowedRoles.includes(supabaseUser.role ?? "")) {
        return NextResponse.json(
            { error: `Accesso negato. Ruolo richiesto: ${allowedRoles.join(" | ")}` },
            { status: 403 }
        );
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", supabaseUser.id);
    requestHeaders.set("x-user-role", supabaseUser.role ?? "UTENTE");

    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
    matcher: ["/api/:path*"],
};
