// ============================================================
// POST /api/auth              – Registrazione (FR1)
// POST /api/auth/login        – Login (FR1)
// POST /api/auth/logout       – Logout (FR1)
// POST /api/auth/forgot       – Password recovery email (FR29)
// DELETE /api/auth            – Cancellazione account GDPR (FR30)
// ============================================================
// NFR-L3: Registrazione richiede accettazione T&C esplicita.
// NFR-R3: Password hashing è gestito internamente da Supabase Auth (bcrypt).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";
import { CreateUserManagerService } from "@/backend/application/service/user/CreateUserManagerService";
import { UserSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/UserSupabaseAdapter";
import { RuoloEnum } from "@/backend/domain/model/enums";

function buildUserService() {
  return new CreateUserManagerService(new UserSupabaseAdapter());
}

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nome: z.string().min(1),
  cognome: z.string().min(1),
  ruolo: z.enum(["UTENTE", "COACH", "GESTORE"]),
  consensoTermini: z.literal(true, { errorMap: () => ({ message: "NFR-L3: Devi accettare i Termini di Servizio." }) }),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ForgotSchema = z.object({
  email: z.string().email(),
});

// POST /api/auth – Registrazione (FR1) + consenso T&C (NFR-L3)
export async function POST(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // POST /api/auth/login – Login (FR1)
  if (path.endsWith("/login")) {
    try {
      const body = await req.json();
      const parsed = LoginSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 401 });
      return NextResponse.json({ user: data.user, session: data.session });
    } catch (err: unknown) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // POST /api/auth/logout – Logout (FR1)
  if (path.endsWith("/logout")) {
    try {
      const supabase = createSupabaseServerClient();
      await supabase.auth.signOut();
      return NextResponse.json({ message: "Sessione terminata." });
    } catch (err: unknown) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // POST /api/auth/forgot – Recupero password (FR29)
  if (path.endsWith("/forgot")) {
    try {
      const body = await req.json();
      const parsed = ForgotSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      const supabase = createSupabaseServerClient();
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      });
      // Risposta generica per non rivelare se l'email esiste (sicurezza)
      if (error) console.error("[Auth] resetPasswordForEmail error:", error.message);
      return NextResponse.json({ message: "Se l'indirizzo email esiste, riceverai un link di recupero." });
    } catch (err: unknown) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // POST /api/auth – Registrazione principale
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const service = buildUserService();
    const user = await service.registraUtente(
      parsed.data.email,
      parsed.data.password,
      parsed.data.nome,
      parsed.data.cognome,
      parsed.data.ruolo as RuoloEnum
    );
    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}

// DELETE /api/auth – Cancellazione account + dati (FR30, GDPR)
export async function DELETE(req: NextRequest) {
  // L'userId viene iniettato dal middleware RBAC dopo verifica JWT
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  try {
    const service = buildUserService();
    await service.eliminaUtente(userId);
    return NextResponse.json({ message: "Account e dati eliminati definitivamente (GDPR Art. 17)." });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}