// ============================================================
// Port/out – CouponRepositoryPort
// R4: Gestione coupon promozionali
// ============================================================

import { Coupon } from "@/backend/domain/model/types";

export interface CouponRepositoryPort {
    findByCodice(codice: string): Promise<Coupon | null>;
    redeemCoupon(couponid: string, userid: string, monouso: boolean): Promise<boolean>;
}
