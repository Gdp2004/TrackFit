import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateGymManagerService } from "@/backend/application/service/gym/CreateGymManagerService";
import { GymSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/GymSupabaseAdapter";

function buildService() {
    const gymRepo = new GymSupabaseAdapter();
    return new CreateGymManagerService(gymRepo);
}

const CreaStrutturaSchema = z.object({
    piva: z.string().min(11).max(11),
    cun: z.string().min(1),
    denominazione: z.string().min(1),
    indirizzo: z.string().min(1),
    gestoreId: z.string().uuid()
});

const CreaCorsoSchema = z.object({
    strutturaId: z.string().uuid(),
    nome: z.string().min(1),
    dataOra: z.string().datetime(),
    capacitaMassima: z.number().int().positive(),
    durata: z.number().int().positive(),
    coachId: z.string().uuid().optional()
});

// POST /api/gyms - Crea Struttura (UC2)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = CreaStrutturaSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }
        
        const service = buildService();
        const struttura = await service.creaStruttura(
            parsed.data.piva,
            parsed.data.cun,
            parsed.data.denominazione,
            parsed.data.indirizzo,
            parsed.data.gestoreId
        );

        return NextResponse.json(struttura, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}