// ============================================================
// GET /api/health – Health check endpoint
// Verifica connessione Supabase + stato applicazione
// Usato da load balancer, monitoring, CI/CD readiness probe
// ============================================================

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export async function GET() {
    const start = Date.now();

    let dbStatus: "ok" | "error" = "ok";
    let dbLatencyMs = 0;

    try {
        const supabase = createSupabaseServerClient();
        const dbStart = Date.now();
        // Query leggera per verificare la connessione
        const { error } = await supabase.from("users").select("id", { head: true, count: "exact" });
        dbLatencyMs = Date.now() - dbStart;
        if (error) dbStatus = "error";
    } catch {
        dbStatus = "error";
    }

    const totalMs = Date.now() - start;
    const healthy = dbStatus === "ok";

    return NextResponse.json(
        {
            status: healthy ? "ok" : "degraded",
            timestamp: new Date().toISOString(),
            uptime: process.uptime().toFixed(1) + "s",
            version: process.env.npm_package_version ?? "1.0.0",
            checks: {
                database: { status: dbStatus, latencyMs: dbLatencyMs },
                api: { status: "ok", latencyMs: totalMs },
            },
        },
        { status: healthy ? 200 : 503 }
    );
}
