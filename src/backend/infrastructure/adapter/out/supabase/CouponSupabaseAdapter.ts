// ============================================================
// CouponSupabaseAdapter
// Infrastructure layer – implements CouponRepositoryPort
// R4: Gestione e validazione coupon promozionali
// ============================================================

import { CouponRepositoryPort } from "@/backend/domain/port/out/CouponRepositoryPort";
import { Coupon } from "@/backend/domain/model/types";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

export class CouponSupabaseAdapter implements CouponRepositoryPort {
    async findByCodice(codice: string): Promise<Coupon | null> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
            .from("coupon")
            .select("*")
            .eq("codice", codice)
            .single();
        return error ? null : data as Coupon;
    }

    async redeemCoupon(couponid: string, userid: string, monouso: boolean): Promise<boolean> {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.rpc('redeem_coupon', {
            p_coupon_id: couponid,
            p_user_id: userid,
            is_monouso: monouso
        });

        if (error) {
            console.error("RPC redeem_coupon fallito", error);
            return false;
        }
        return data as boolean;
    }
}
