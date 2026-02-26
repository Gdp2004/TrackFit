// ============================================================
// GET  /api/gyms/tipi-abbonamento?strutturaid=xxx – Lista tipi
// POST /api/gyms/tipi-abbonamento – Crea tipo abbonamento
// DELETE /api/gyms/tipi-abbonamento?id=xxx – Elimina tipo
// Protetto da middleware: GESTORE | ADMIN
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

const CreaTipoSchema = z.object({
    strutturaid: z.string().uuid(),
    nome: z.string().min(1),
    duratamesi: z.number().int().positive(),
    prezzo: z.number().min(0),
    rinnovabile: z.boolean().default(true),
    descrizione: z.string().optional(),
});

export async function GET(req: NextRequest) {
    const strutturaid = req.nextUrl.searchParams.get("strutturaid");
    if (!strutturaid) return NextResponse.json({ error: "strutturaid obbligatorio" }, { status: 400 });

    try {
        const service = buildService();
        const tipi = await service.getTipiAbbonamento(strutturaid);
        return NextResponse.json(tipi);
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const userid = req.headers.get("x-user-id");
    if (!userid) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const body = await req.json();
        const parsed = CreaTipoSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

        const service = buildService();
        const tipo = await service.creaTipoAbbonamento(parsed.data);
        return NextResponse.json(tipo, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest) {
    const id = req.nextUrl.searchParams.get("id");
    const userid = req.headers.get("x-user-id");
    if (!id || !userid) return NextResponse.json({ error: "Parametri mancanti." }, { status: 400 });

    try {
        const service = buildService();
        await service.eliminaTipoAbbonamento(id);
        return NextResponse.json({ message: "Tipo abbonamento eliminato." });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 400 });
    }
}
