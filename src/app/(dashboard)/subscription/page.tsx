"use client";

import { useState } from "react";
import { Card } from "@frontend/components/ui/Card";
import { Button } from "@frontend/components/ui/Button";
import { Input } from "@frontend/components/ui/Input";
import { SubscriptionCard } from "@frontend/components/subscription/SubscriptionCard";
import { PaymentHistory } from "@frontend/components/subscription/PaymentHistory";
import type { Abbonamento, Pagamento } from "@backend/domain/model/types";
import { StatoAbbonamentoEnum, StatoPagamentoEnum } from "@backend/domain/model/enums";
import { PurchaseFlow } from "@frontend/components/subscription/PurchaseFlow";
import { useAuth } from "@frontend/contexts/AuthContext";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Suspense } from "react";

function SubscriptionContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const paymentStatus = searchParams.get("payment_status");

    const [coupon, setCoupon] = useState("");
    const [couponMsg, setCouponMsg] = useState<string | null>(null);
    const [abbonamento, setAbbonamento] = useState<Abbonamento | null>(null);
    const [pagamenti, setPagamenti] = useState<Pagamento[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSubscriptionData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Fetch abbonamento attivo
            const subRes = await fetch(`/api/subscriptions?userid=${user.id}`);
            if (subRes.ok) {
                const subData = await subRes.json();
                setAbbonamento(subData);
            }

            // 2. Fetch storico pagamenti
            const payRes = await fetch(`/api/subscriptions/payments?userid=${user.id}`);
            if (payRes.ok) {
                const payData = await payRes.json();
                setPagamenti(payData.payments || []);
            }
        } catch (e) {
            console.error("Errore fetch dati abbonamento:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptionData();

        // Se l'utente è stato reindirizzato da Stripe dopo il pagamento
        if (paymentStatus === "success") {
            // Rimuovi il search param e mostra un messaggio di successo
            router.replace("/subscription", undefined);
            setTimeout(() => {
                alert("Pagamento completato con successo! Il tuo abbonamento è ora attivo.");
            }, 500);
        }
    }, [user, paymentStatus]);

    const handleCoupon = () => {
        if (!coupon.trim()) return;
        // Solo un mock per gestire il coupon. Più avanti potremmo voler connettere questo 
        // a una logica reale (es: validandolo prima del rinnovo o per rimborsi parziali)
        setCouponMsg(coupon.toUpperCase() === "TRACKFIT10" ? "✅ Coupon applicato: sconto 10%" : "❌ Coupon non valido");
        setTimeout(() => setCouponMsg(null), 4000);
    };

    const handleCancel = async (id: string) => {
        if (!window.confirm("Sei sicuro di voler cancellare definitivamente il tuo abbonamento? Questa azione non può essere annullata.")) {
            return;
        }

        try {
            const res = await fetch("/api/subscriptions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ abbonamentoid: id })
            });

            if (res.ok) {
                alert("Abbonamento cancellato con successo.");
                fetchSubscriptionData(); // ricarica i dati
            } else {
                const data = await res.json();
                alert(`Errore: ${data.error ?? "Impossibile cancellare l'abbonamento"}`);
            }
        } catch (e) {
            console.error(e);
            alert("Errore di rete durante la cancellazione.");
        }
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
                {loading ? (
                    <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--tf-text-muted))" }}>
                        <div style={{ fontSize: "2rem" }}>⏳</div>
                        <p>Caricamento dettagli abbonamento...</p>
                    </div>
                ) : !abbonamento ? (
                    <>
                        {/* Nessun abbonamento -> Mostra il flusso di acquisto */}
                        <div style={{
                            padding: "1.5rem", borderRadius: "var(--tf-radius)",
                            background: "hsl(var(--tf-surface))", border: "1px solid hsl(var(--tf-border))",
                            textAlign: "center"
                        }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏋️</div>
                            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.25rem" }}>Non hai un piano attivo</h2>
                            <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))", marginBottom: "1.5rem" }}>
                                Scegli una palestra e attiva un abbonamento per iniziare ad allenarti e prenotare i corsi.
                            </p>
                        </div>
                        <PurchaseFlow onSuccess={() => {
                            alert("Pagamento elaborato con successo!");
                            fetchSubscriptionData();
                        }} />
                    </>
                ) : (
                    <>
                        {/* Abbonamento attivo */}
                        <SubscriptionCard abbonamento={abbonamento} onCancel={handleCancel} />

                        {/* Coupon (visibile solo se hai un abbonamento, o forse per applicarlo al prossimo rinnovo) */}
                        <Card title="Applica coupon al rinnovo">
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
                    </>
                )}

                {/* Storico pagamenti (mostrato anche se non ha abbonamento ora, ma ne ha in passato) */}
                {pagamenti.length > 0 && (
                    <Card title="Storico pagamenti">
                        <PaymentHistory payments={pagamenti} />
                        <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
                            <Button variant="secondary" size="sm">📄 Esporta PDF</Button>
                            <Button variant="secondary" size="sm">📊 Esporta CSV</Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default function SubscriptionPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: "center", padding: "3rem" }}>Caricamento...</div>}>
            <SubscriptionContent />
        </Suspense>
    );
}
