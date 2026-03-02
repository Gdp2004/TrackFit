// ============================================================
// POST/GET /api/gyms  – Struttura (FR5 Admin) + Corso (FR6)
// DELETE /api/gyms/corsi/[id] – Cancella corso (FR26)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateGymManagerService } from "@/backend/application/service/gym/CreateGymManagerService";
import { GymSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/GymSupabaseAdapter";
import { SubscriptionSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/SubscriptionSupabaseAdapter";
import { SupabaseRealtimeNotificationAdapter } from "@/backend/infrastructure/adapter/out/notification/SupabaseRealtimeNotificationAdapter";
import { AuditLogSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/AuditLogSupabaseAdapter";

function buildService() {
    return new CreateGymManagerService(
        new GymSupabaseAdapter(),
        new SubscriptionSupabaseAdapter(),
        new SupabaseRealtimeNotificationAdapter(),
        new AuditLogSupabaseAdapter()
    );
}

const CreaStrutturaSchema = z.object({
    piva: z.string().length(11),
    cun: z.string().min(1),
    denominazione: z.string().min(1),
    indirizzo: z.string().min(1),
    // gestoreid viene iniettato dal middleware via x-user-id header
});

const CreaCorsoSchema = z.object({
    strutturaid: z.string().uuid(),
    nome: z.string().min(1),
    descrizione: z.string().optional(),
    dataora: z.string().datetime(),
    capacitamassima: z.number().int().positive(),
    durata: z.number().int().positive(),
    coachid: z.string().uuid().optional(),
});

const OnboardCoachSchema = z.object({
    strutturaid: z.string().uuid(),
    emailCoach: z.string().email(),
});

// POST /api/gyms – Crea Struttura (FR5, ADMIN only – guard in middleware)
//               – oppure Crea Corso (FR6, GESTORE only) se action=corso
//               – oppure Onboard Coach (UC2, GESTORE/ADMIN) se action=onboard-coach
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const action = req.nextUrl.searchParams.get("action");
        const service = buildService();

        if (action === "onboard-coach") {
            // ─── UC2: Onboard Coach ───────────────────────────────────────────
            const parsed = OnboardCoachSchema.safeParse(body);
            if (!parsed.success) {
                const msgs = Object.entries(parsed.error.flatten().fieldErrors)
                    .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`).join(" | ");
                return NextResponse.json({ error: msgs || "Dati non validi" }, { status: 400 });
            }

            // L\'email del gestore è ricavata preferibilmente dal token, ma qui usiamo x-user-id come traccia
            const tokenUtenteId = req.headers.get("x-user-id") || "SISTEMA";

            await service.onboardCoach(
                parsed.data.strutturaid,
                tokenUtenteId,
                parsed.data.emailCoach
            );
            return NextResponse.json({ message: "Coach creato e email inviata." }, { status: 201 });
        }

        if (action === "corso") {
            // ─── FR6: Crea corso ──────────────────────────────────────────────
            const parsed = CreaCorsoSchema.safeParse(body);
            if (!parsed.success) {
                const msgs = Object.entries(parsed.error.flatten().fieldErrors)
                    .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`).join(" | ");
                return NextResponse.json({ error: msgs || "Dati non validi" }, { status: 400 });
            }
            const corso = await service.creaCorso({
                strutturaid: parsed.data.strutturaid,
                nome: parsed.data.nome,
                dataora: parsed.data.dataora,
                capacitamassima: parsed.data.capacitamassima,
                durata: parsed.data.durata,
                coachid: parsed.data.coachid,
            });
            return NextResponse.json(corso, { status: 201 });
        }

        // ─── FR5: Crea struttura (GESTORE o ADMIN) ───────────────────────────
        const gestoreid = req.headers.get("x-user-id");
        if (!gestoreid) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

        const parsed = CreaStrutturaSchema.safeParse(body);
        if (!parsed.success) {
            const msgs = Object.entries(parsed.error.flatten().fieldErrors)
                .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`).join(" | ");
            return NextResponse.json({ error: msgs || "Dati non validi" }, { status: 400 });
        }
        const struttura = await service.creaStruttura(
            parsed.data.piva,
            parsed.data.cun,
            parsed.data.denominazione,
            parsed.data.indirizzo,
            gestoreid          // ←  dall'header, non dal body
        );
        return NextResponse.json(struttura, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 400 });
    }
}

// GET /api/gyms?strutturaid=xxx – Lista corsi (FR6)
// GET /api/gyms?search=query    – Cerca strutture per nome/indirizzo
export async function GET(req: NextRequest) {
    const strutturaid = req.nextUrl.searchParams.get("strutturaid");
    const search = req.nextUrl.searchParams.get("search");

    try {
        const service = buildService();

        if (search) {
            // ─── Ricerca strutture ────────────────────────────────────────────
            const supabase = (await import("@/backend/infrastructure/config/supabase")).createSupabaseServerClient();
            const { data, error } = await supabase
                .from("strutture")
                .select("id, denominazione, indirizzo, telefono, email, sito, stato, piva")
                .or(`denominazione.ilike.%${search}%,indirizzo.ilike.%${search}%`)
                .order("denominazione");
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json(data ?? []);
        }

        if (strutturaid) {
            // ─── Lista corsi per struttura ─────────────────────────────────
            const corsi = await service.getCorsiStruttura(strutturaid);
            return NextResponse.json(corsi);
        }

        return NextResponse.json({ error: "Parametro mancante: strutturaid o search" }, { status: 400 });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

// DELETE /api/gyms?corsoid=xxx – Cancella corso (FR26, GESTORE)
export async function DELETE(req: NextRequest) {
    const corsoid = req.nextUrl.searchParams.get("corsoid");
    const gestoreid = req.headers.get("x-user-id");   // iniettato dal middleware RBAC
    if (!corsoid || !gestoreid) return NextResponse.json({ error: "Parametri mancanti." }, { status: 400 });
    try {
        const service = buildService();
        await service.cancellaCorso(corsoid, gestoreid);
        return NextResponse.json({ message: "Corso cancellato e utenti notificati." });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 400 });
    }
}