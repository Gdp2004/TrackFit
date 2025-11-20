import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateGymManagerService } from "@/backend/application/service/gym/CreateGymManagerService";
import { GymSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/GymSupabaseAdapter";

function buildService() {
    const gymRepo = new GymSupabaseAdapter();
    return new CreateGymManagerService(gymRepo);
}

const PrenotaCorsoSchema = z.object({
    userId: z.string().uuid(),
    corsoId: z.string().uuid(),
    strutturaId: z.string().uuid()
});

const CancellaPrenotazioneSchema = z.object({
    prenotazioneId: z.string().uuid(),
});

// POST /api/gyms/corsi/prenotazioni - Prenota Corso (UC8 integration) e R6
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = PrenotaCorsoSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        const service = buildService();
        const result = await service.prenotaCorsoPalestra(
            parsed.data.userId,
            parsed.data.corsoId
        );

        return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE /api/gyms/corsi/prenotazioni - Cancella prenotazione corso (R3)
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = CancellaPrenotazioneSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        const service = buildService();
        await service.cancellaPrenotazione(parsed.data.prenotazioneId);

        return NextResponse.json({ message: "Prenotazione cancellata" }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
