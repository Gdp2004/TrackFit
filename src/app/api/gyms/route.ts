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
    gestoreid: z.string().uuid(),
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

// POST /api/gyms – Crea Struttura (FR5, ADMIN only – guard in middleware)
//               – oppure Crea Corso (FR6, GESTORE only) se action=corso
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const action = req.nextUrl.searchParams.get("action");
        const service = buildService();

        if (action === "corso") {
            // ─── FR6: Crea corso ──────────────────────────────────────────────
            const parsed = CreaCorsoSchema.safeParse(body);
            if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
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

        // ─── FR5: Crea struttura ──────────────────────────────────────────────
        const parsed = CreaStrutturaSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        const struttura = await service.creaStruttura(
            parsed.data.piva,
            parsed.data.cun,
            parsed.data.denominazione,
            parsed.data.indirizzo,
            parsed.data.gestoreid
        );
        return NextResponse.json(struttura, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 400 });
    }
}

// GET /api/gyms?strutturaid=xxx – Lista corsi (FR6)
export async function GET(req: NextRequest) {
    const strutturaid = req.nextUrl.searchParams.get("strutturaid");
    if (!strutturaid) return NextResponse.json({ error: "strutturaid obbligatorio" }, { status: 400 });
    try {
        const service = buildService();
        const corsi = await service.getCorsiStruttura(strutturaid);
        return NextResponse.json(corsi);
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