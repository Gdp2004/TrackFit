// ============================================================
// GET  /api/gyms/coupon?strutturaid=xxx – Lista coupon palestra
// POST /api/gyms/coupon – Crea coupon
// Protetto da middleware: GESTORE | ADMIN
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

const CreaCouponSchema = z.object({
    strutturaid: z.string().uuid(),
    tipoabbonamentoid: z.string().uuid(),
    codice: z.string().min(3).max(20),
    percentualesconto: z.number().int().min(1).max(100),
    monouso: z.boolean().default(true),
    scadenza: z.string().datetime(),
    usato: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
    const strutturaid = req.nextUrl.searchParams.get("strutturaid");
    if (!strutturaid) return NextResponse.json({ error: "strutturaid obbligatorio" }, { status: 400 });

    try {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("coupon")
            .select("*")
            .eq("strutturaid", strutturaid)
            .order("createdat", { ascending: false });

        if (error) throw new Error(error.message);
        return NextResponse.json(data ?? []);
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const userid = req.headers.get("x-user-id");
    if (!userid) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

    try {
        const body = await req.json();
        const parsed = CreaCouponSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("coupon")
            .insert(parsed.data)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return NextResponse.json(data, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 400 });
    }
}
