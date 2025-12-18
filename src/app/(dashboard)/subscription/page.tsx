"use client";

import { useState } from "react";
import { Card } from "@frontend/components/ui/Card";
import { Button } from "@frontend/components/ui/Button";
import { Input } from "@frontend/components/ui/Input";
import { SubscriptionCard } from "@frontend/components/subscription/SubscriptionCard";
import { PaymentHistory } from "@frontend/components/subscription/PaymentHistory";
import type { Abbonamento, Pagamento } from "@backend/domain/model/types";
import { StatoAbbonamentoEnum, StatoPagamentoEnum } from "@backend/domain/model/enums";

const MOCK_ABBONAMENTO: Abbonamento = {
    id: "ab1", userId: "u1", strutturaId: "g1",
    stato: StatoAbbonamentoEnum.ATTIVO,
    qrCode: "TF-AB1-2025-NAPOLI-ABCDEFGH1234",
    dataInizio: new Date(Date.now() - 30 * 86400000).toISOString(),
    dataFine: new Date(Date.now() + 60 * 86400000).toISOString(),
    importo: 89,
};

const MOCK_PAGAMENTI: Pagamento[] = [
    { id: "p1", userId: "u1", abbonamentoId: "ab1", importo: 89, valuta: "eur", stato: StatoPagamentoEnum.COMPLETATO, metodo: "card", createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    { id: "p2", userId: "u1", abbonamentoId: "ab1", importo: 89, valuta: "eur", stato: StatoPagamentoEnum.COMPLETATO, metodo: "card", createdAt: new Date(Date.now() - 120 * 86400000).toISOString() },
];

export default function SubscriptionPage() {
    const [coupon, setCoupon] = useState("");
    const [couponMsg, setCouponMsg] = useState<string | null>(null);

    const handleCoupon = () => {
        if (!coupon.trim()) return;
        setCouponMsg(coupon.toUpperCase() === "TRACKFIT10" ? "✅ Coupon applicato: sconto 10%" : "❌ Coupon non valido");
        setTimeout(() => setCouponMsg(null), 4000);
    };

    return (
        <div style={{ maxWidth: 800, margin: "0 auto" }} className="animate-fadeIn">
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Abbonamento</h1>
                <p style={{ color: "hsl(var(--tf-text-muted))", fontSize: "0.875rem", marginTop: 2 }}>
                    Gestisci il tuo piano, QR code e pagamenti
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Abbonamento attivo */}
                <SubscriptionCard abbonamento={MOCK_ABBONAMENTO} />

                {/* Coupon */}
                <Card title="Applica coupon">
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                        <div style={{ flex: 1 }}>
                            <Input
                                id="coupon"
                                placeholder="Es. TRACKFIT10"
                                icon="🏷️"
                                value={coupon}
                                onChange={(e) => setCoupon(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleCoupon}>Applica</Button>
                    </div>
                    {couponMsg && (
                        <p style={{
                            marginTop: "0.625rem", fontSize: "0.825rem", fontWeight: 600,
                            color: couponMsg.startsWith("✅") ? "hsl(var(--tf-accent))" : "hsl(var(--tf-danger))"
                        }}>
                            {couponMsg}
                        </p>
                    )}
                </Card>

                {/* Storico pagamenti */}
                <Card title="Storico pagamenti">
                    <PaymentHistory payments={MOCK_PAGAMENTI} />
                    <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
                        <Button variant="secondary" size="sm">📄 Esporta PDF</Button>
                        <Button variant="secondary" size="sm">📊 Esporta CSV</Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
