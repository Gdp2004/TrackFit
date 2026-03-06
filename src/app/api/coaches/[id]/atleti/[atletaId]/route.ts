import { NextRequest, NextResponse } from "next/server";
import { getCoachService } from "@/backend/infrastructure/config/serviceFactory";

// DELETE /api/coaches/[id]/atleti/[atletaId] – Rimuove un atleta dal roster del coach
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; atletaId: string }> }
) {
    const { id: coachId, atletaId } = await params;
    const requesterId = req.headers.get("x-user-id");

    if (!requesterId) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const service = getCoachService();
        await service.rimuoviAtletaDalRoster(coachId, atletaId);
        return NextResponse.json({ message: "Atleta rimosso con successo." });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 400 });
    }
}
