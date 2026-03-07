/**
 * Integration Test – Auth API Route
 * TC_1: Login (credenziali, rate-limit)
 * TC_2: Registrazione (validazione campi, consenso T&C)
 */

// ── Mock all heavy transitive deps BEFORE imports ─────────────────────────────
jest.mock("@/backend/infrastructure/config/supabase", () => ({
    createSupabaseServerClient: jest.fn(),
    createSupabaseBrowserClient: jest.fn(),
}));
jest.mock("@/backend/infrastructure/config/serviceFactory", () => ({
    getUserService: jest.fn(),
    getCoachService: jest.fn(),
    getGymService: jest.fn(),
    getWorkoutService: jest.fn(),
    getSubscriptionService: jest.fn(),
    getReportService: jest.fn(),
}));
jest.mock("@/backend/infrastructure/http/rateLimiter", () => ({ checkRateLimit: jest.fn() }));
jest.mock("@/backend/infrastructure/adapter/out/supabase/UserSupabaseAdapter", () => ({ UserSupabaseAdapter: jest.fn(() => ({})) }));
jest.mock("@/backend/infrastructure/adapter/out/supabase/CoachSupabaseAdapter", () => ({ CoachSupabaseAdapter: jest.fn(() => ({})) }));
jest.mock("@/backend/infrastructure/adapter/out/supabase/GymSupabaseAdapter", () => ({ GymSupabaseAdapter: jest.fn(() => ({})) }));
jest.mock("@/backend/infrastructure/adapter/out/supabase/GestoreSupabaseAdapter", () => ({ GestoreSupabaseAdapter: jest.fn(() => ({})) }));
jest.mock("@/backend/infrastructure/adapter/out/supabase/WorkoutSupabaseAdapter", () => ({ WorkoutSupabaseAdapter: jest.fn(() => ({})) }));
jest.mock("@/backend/infrastructure/adapter/out/supabase/SubscriptionSupabaseAdapter", () => ({ SubscriptionSupabaseAdapter: jest.fn(() => ({})) }));
jest.mock("@/backend/infrastructure/adapter/out/supabase/PaymentSupabaseAdapter", () => ({ PaymentSupabaseAdapter: jest.fn(() => ({})) }));
jest.mock("@/backend/infrastructure/adapter/out/supabase/CouponSupabaseAdapter", () => ({ CouponSupabaseAdapter: jest.fn(() => ({})) }));
jest.mock("@/backend/infrastructure/adapter/out/supabase/AuditLogSupabaseAdapter", () => ({ AuditLogSupabaseAdapter: jest.fn(() => ({})) }));
jest.mock("@/backend/infrastructure/adapter/out/supabase/ReportSupabaseAdapter", () => ({ ReportSupabaseAdapter: jest.fn(() => ({})) }));
jest.mock("@/backend/infrastructure/adapter/out/notification/SupabaseRealtimeNotificationAdapter", () => ({ SupabaseRealtimeNotificationAdapter: jest.fn(() => ({})) }));
jest.mock("@/backend/infrastructure/adapter/out/external/StripeAdapter", () => ({ StripeAdapter: jest.fn(() => ({})) }));

// ── Imports ───────────────────────────────────────────────────────────────────
import { POST } from "@/app/api/auth/route";
import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";
import { getUserService } from "@/backend/infrastructure/config/serviceFactory";
import { checkRateLimit } from "@/backend/infrastructure/http/rateLimiter";

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Auth API (TC_1 Login & TC_2 Registrazione)", () => {
    const mockSupabase = {
        auth: {
            signInWithPassword: jest.fn(),
            admin: { createUser: jest.fn() },
        },
        from: jest.fn(() => ({ insert: jest.fn().mockResolvedValue({ error: null }) })),
    };
    const mockUserService = { registraUtente: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        (checkRateLimit as jest.Mock).mockReturnValue({ allowed: true });
        (createSupabaseServerClient as jest.Mock).mockReturnValue(mockSupabase);
        (getUserService as jest.Mock).mockReturnValue(mockUserService);
    });

    // ── TC_1 ──────────────────────────────────────────────────────────────────
    describe("POST /api/auth/login (TC_1)", () => {
        it("TC_1.4 – login con credenziali valide → 200", async () => {
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: { user: { id: "u1" }, session: { access_token: "jwt" } },
                error: null,
            });
            const req = new NextRequest("http://localhost/api/auth/login", {
                method: "POST", body: JSON.stringify({ email: "a@a.com", password: "pass" }),
            });
            const res = await POST(req);
            const json = await res.json();
            expect(res.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.data.user.id).toBe("u1");
        });

        it("TC_1.3 – password errata → 401", async () => {
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: { user: null, session: null }, error: { message: "Invalid" },
            });
            const req = new NextRequest("http://localhost/api/auth/login", {
                method: "POST", body: JSON.stringify({ email: "a@a.com", password: "wrong" }),
            });
            const res = await POST(req);
            expect(res.status).toBe(401);
        });

        it("TC_1.5 – rate limit superato → 429", async () => {
            (checkRateLimit as jest.Mock).mockReturnValue({ allowed: false });
            const req = new NextRequest("http://localhost/api/auth/login", {
                method: "POST", body: JSON.stringify({ email: "a@a.com", password: "pw" }),
            });
            const res = await POST(req);
            expect(res.status).toBe(429);
        });
    });

    // ── TC_2 ──────────────────────────────────────────────────────────────────
    describe("POST /api/auth (TC_2 – Registrazione)", () => {
        it("TC_2.6 – registrazione con successo → 200", async () => {
            mockUserService.registraUtente.mockResolvedValue({
                id: "u123", email: "new@x.com", nome: "Mario", cognome: "Rossi", ruolo: "UTENTE",
            });
            const req = new NextRequest("http://localhost/api/auth", {
                method: "POST",
                body: JSON.stringify({
                    email: "new@x.com", password: "securePass123",
                    nome: "Mario", cognome: "Rossi", ruolo: "UTENTE", consensoTermini: true,
                }),
            });
            const res = await POST(req);
            const json = await res.json();
            expect(res.status).toBe(200);
            expect(json.data.id).toBe("u123");
        });

        it("TC_2.4 – nome mancante → 400", async () => {
            const req = new NextRequest("http://localhost/api/auth", {
                method: "POST",
                body: JSON.stringify({
                    email: "new@x.com", password: "securePass123",
                    cognome: "Rossi", ruolo: "UTENTE", consensoTermini: true,
                }),
            });
            expect((await POST(req)).status).toBe(400);
        });

        it("TC_2.1 – consenso T&C mancante → 400", async () => {
            const req = new NextRequest("http://localhost/api/auth", {
                method: "POST",
                body: JSON.stringify({
                    email: "new@x.com", password: "securePass123",
                    nome: "Mario", cognome: "Rossi", ruolo: "UTENTE", consensoTermini: false,
                }),
            });
            expect((await POST(req)).status).toBe(400);
        });
    });
});
