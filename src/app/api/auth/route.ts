import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@backend/infrastructure/config/supabase";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nome: z.string().min(1),
  cognome: z.string().min(1),
  ruolo: z.enum(["UTENTE", "COACH", "GESTORE"]),
});

// POST /api/auth â€“ registra un nuovo utente (UC1)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      user_metadata: { nome: parsed.data.nome, cognome: parsed.data.cognome, ruolo: parsed.data.ruolo },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data.user, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}