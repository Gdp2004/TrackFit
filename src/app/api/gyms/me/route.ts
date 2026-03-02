// ============================================================
// GET  /api/gyms/me – Struttura + Stats del Gestore autenticato
// PUT  /api/gyms/me – Aggiorna dati struttura
// Protetto da middleware: solo GESTORE | ADMIN
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateGymManagerService } from "@/backend/application/service/gym/CreateGymManagerService";
import { GymSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/GymSupabaseAdapter";
import { SubscriptionSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/SubscriptionSupabaseAdapter";
import { SupabaseRealtimeNotificationAdapter } from "@/backend/infrastructure/adapter/out/notification/SupabaseRealtimeNotificationAdapter";
import { AuditLogSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/AuditLogSupabaseAdapter";
import { CoachSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/CoachSupabaseAdapter";

function buildService() {
    return new CreateGymManagerService(
        new GymSupabaseAdapter(),
        new SubscriptionSupabaseAdapter(),
        new SupabaseRealtimeNotificationAdapter(),
        new AuditLogSupabaseAdapter(),
        new CoachSupabaseAdapter()
    );
}

const AggiornaStrutturaSchema = z.object({
    denominazione: z.string().min(1).optional(),
    indirizzo: z.string().min(1).optional(),
    telefono: z.string().optional(),
    email: z.string().email().optional(),
    sito: z.string().url().optional().or(z.literal("")),
    descrizione: z.string().optional(),
    stato: z.enum(["Attiva", "Sospesa"]).optional(),
});

export async function GET(req: NextRequest) {
    const userid = req.headers.get("x-user-id");
    if (!userid) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const service = buildService();
        const struttura = await service.getStrutturaGestore(userid);

        let stats = null;
        if (struttura?.id) {
            stats = await service.getGestoreStats(struttura.id);
        }

        return NextResponse.json({ struttura, stats });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const userid = req.headers.get("x-user-id");
    if (!userid) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const body = await req.json();
        const parsed = AggiornaStrutturaSchema.safeParse(body);
        if (!parsed.success) {
            const msgs = Object.entries(parsed.error.flatten().fieldErrors)
                .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`).join(" | ");
            return NextResponse.json({ error: msgs || "Dati non validi" }, { status: 400 });
        }

        const service = buildService();
        const struttura = await service.getStrutturaGestore(userid);
        if (!struttura) return NextResponse.json({ error: "Struttura non trovata." }, { status: 404 });

        const aggiornata = await service.aggiornaStruttura(struttura.id, parsed.data);
        return NextResponse.json(aggiornata);
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
