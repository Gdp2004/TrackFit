/**
 * Integration Test – Auth API Route
 * TC_1: Login, TC_2: Registrazione
 *
 * We mock ALL heavy dependencies at module level so Jest doesn't actually
 * instantiate Supabase adapters, Stripe, etc.
 */

// ─── 1. Mock heavy transitive deps BEFORE any imports ────────────────────────
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

jest.mock("@/backend/infrastructure/http/rateLimiter", () => ({
    checkRateLimit: jest.fn(),
}));

// Mock all Supabase adapters to prevent real instantiation
jest.mock("@/backend/infrastructure/adapter/out/supabase/UserSupabaseAdapter", () => ({
    UserSupabaseAdapter: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("@/backend/infrastructure/adapter/out/supabase/CoachSupabaseAdapter", () => ({
    CoachSupabaseAdapter: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("@/backend/infrastructure/adapter/out/supabase/GymSupabaseAdapter", () => ({
    GymSupabaseAdapter: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("@/backend/infrastructure/adapter/out/supabase/GestoreSupabaseAdapter", () => ({
    GestoreSupabaseAdapter: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("@/backend/infrastructure/adapter/out/supabase/WorkoutSupabaseAdapter", () => ({
    WorkoutSupabaseAdapter: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("@/backend/infrastructure/adapter/out/supabase/SubscriptionSupabaseAdapter", () => ({
    SubscriptionSupabaseAdapter: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("@/backend/infrastructure/adapter/out/supabase/PaymentSupabaseAdapter", () => ({
    PaymentSupabaseAdapter: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("@/backend/infrastructure/adapter/out/supabase/CouponSupabaseAdapter", () => ({
    CouponSupabaseAdapter: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("@/backend/infrastructure/adapter/out/supabase/AuditLogSupabaseAdapter", () => ({
    AuditLogSupabaseAdapter: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("@/backend/infrastructure/adapter/out/supabase/ReportSupabaseAdapter", () => ({
    ReportSupabaseAdapter: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("@/backend/infrastructure/adapter/out/notification/SupabaseRealtimeNotificationAdapter", () => ({
    SupabaseRealtimeNotificationAdapter: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("@/backend/infrastructure/adapter/out/external/StripeAdapter", () => ({
    StripeAdapter: jest.fn().mockImplementation(() => ({})),
}));

// ─── 2. Imports (after mocks are hoisted) ────────────────────────────────────
import { POST } from "./route";
import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";
import { getUserService } from "@/backend/infrastructure/config/serviceFactory";
import { checkRateLimit } from "@/backend/infrastructure/http/rateLimiter";

// ─── 3. Tests ─────────────────────────────────────────────────────────────────
describe("Auth API (TC_1 Login & TC_2 Registrazione)", () => {
    const mockSupabase = {
        auth: {
            signInWithPassword: jest.fn(),
            admin: { createUser: jest.fn() },
        },
        from: jest.fn().mockReturnValue({
            insert: jest.fn().mockResolvedValue({ error: null }),
        }),
    };

    const mockUserService = {
        registraUtente: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (checkRateLimit as jest.Mock).mockReturnValue({ allowed: true });
        (createSupabaseServerClient as jest.Mock).mockReturnValue(mockSupabase);
        (getUserService as jest.Mock).mockReturnValue(mockUserService);
    });

    // ─── TC_1: Login ────────────────────────────────────────────────────────────
    describe("POST /api/auth/login (TC_1)", () => {
        it("TC_1.4 – login con credenziali valide", async () => {
            const req = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email: "test@example.com", password: "validPass" }),
            });

            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: { user: { id: "u1" }, session: { access_token: "jwt" } },
                error: null,
            });

            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.data.user.id).toBe("u1");
        });

        it("TC_1.3 – login con password errata → 401", async () => {
            const req = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email: "test@example.com", password: "wrong" }),
            });

            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: { user: null, session: null },
                error: { message: "Invalid credentials" },
            });

            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(401);
            expect(json.success).toBe(false);
        });

        it("TC_1.5 – rate limiting blocca dopo troppi tentativi → 429", async () => {
            (checkRateLimit as jest.Mock).mockReturnValue({ allowed: false });

            const req = new NextRequest("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email: "test@example.com", password: "pw" }),
            });

            const res = await POST(req);
            expect(res.status).toBe(429);
        });
    });

    // ─── TC_2: Registrazione ────────────────────────────────────────────────────
    describe("POST /api/auth (TC_2 – Registrazione)", () => {
        it("TC_2.6 – registrazione con successo", async () => {
            const body = {
                email: "new@example.com",
                password: "securePass123",
                nome: "Mario",
                cognome: "Rossi",
                ruolo: "UTENTE",
                consensoTermini: true,
            };

            const req = new NextRequest("http://localhost/api/auth", {
                method: "POST",
                body: JSON.stringify(body),
            });

            mockUserService.registraUtente.mockResolvedValue({
                id: "u123",
                email: body.email,
                nome: body.nome,
                cognome: body.cognome,
                ruolo: body.ruolo,
            });

            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.data.id).toBe("u123");
        });

        it("TC_2.4 – mancano campi obbligatori (nome) → 400", async () => {
            const req = new NextRequest("http://localhost/api/auth", {
                method: "POST",
                body: JSON.stringify({
                    email: "new@example.com",
                    password: "securePass123",
                    cognome: "Rossi",
                    ruolo: "UTENTE",
                    consensoTermini: true,
                }),
            });

            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it("TC_2.1 – mancato consenso T&C → 400", async () => {
            const req = new NextRequest("http://localhost/api/auth", {
                method: "POST",
                body: JSON.stringify({
                    email: "new@example.com",
                    password: "securePass123",
                    nome: "Mario",
                    cognome: "Rossi",
                    ruolo: "UTENTE",
                    consensoTermini: false,
                }),
            });

            const res = await POST(req);
            expect(res.status).toBe(400);
        });
    });
});
