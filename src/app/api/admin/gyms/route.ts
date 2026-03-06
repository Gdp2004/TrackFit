import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const pageSize = 10;

        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        const supabase = createSupabaseServerClient();

        const { data, count, error } = await supabase
            .from("strutture")
            .select("*", { count: "exact" })
            .range(start, end)
            .order("denominazione", { ascending: true });

        if (error) {
            console.error("Error fetching admin gyms:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            data: data || [],
            meta: {
                total: count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((count || 0) / pageSize)
            }
        });
    } catch (err: unknown) {
        console.error("Unexpected error in GET /api/admin/gyms:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
