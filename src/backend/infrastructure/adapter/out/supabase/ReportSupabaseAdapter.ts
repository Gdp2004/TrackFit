// ============================================================
// ReportSupabaseAdapter
// Infrastructure layer – implements ReportRepositoryPort
// ============================================================

import { ReportRepositoryPort } from "@/backend/domain/port/out/ReportRepositoryPort";
import { Report } from "@/backend/domain/model/types";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export class ReportSupabaseAdapter implements ReportRepositoryPort {
    async save(report: Partial<Report>): Promise<Report> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("reports").insert(report).select().single();
        if (error) throw new Error(`DB Error (save report): ${error.message}`);
        return data as Report;
    }

    async findById(id: string): Promise<Report | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("reports").select("*").eq("id", id).single();
        if (error) return null;
        return data as Report;
    }

    async findByUserId(userid: string): Promise<Report[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("reports").select("*").eq("userid", userid);
        if (error) return [];
        return data as Report[];
    }

    async findByStrutturaId(strutturaid: string): Promise<Report[]> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("reports").select("*").eq("strutturaid", strutturaid);
        if (error) return [];
        return data as Report[];
    }
}
