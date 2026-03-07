"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Button } from "@frontend/components/ui/Button";
import { Card } from "@frontend/components/ui/Card";
import { CheckoutForm } from "./CheckoutForm";
import type { Struttura } from "@backend/domain/model/types";
import { useAuth } from "@frontend/contexts/AuthContext";

// Inizializza Stripe fuori dal componente per evitare re-inizializzazioni
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface TipoAbbonamento {
    id: string;
    nome: string;
    duratamesi: number;
    prezzo: number;
    descrizione?: string;
}

interface PurchaseFlowProps {
    onSuccess: () => void;
}

export function PurchaseFlow({ onSuccess }: PurchaseFlowProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Step 1: Palestre
    const [gyms, setGyms] = useState<Struttura[]>([]);
    const [selectedGym, setSelectedGym] = useState<Struttura | null>(null);
    const [loadingGyms, setLoadingGyms] = useState(true);

    // Step 2: Piani
    const [plans, setPlans] = useState<TipoAbbonamento[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<TipoAbbonamento | null>(null);
    const [loadingPlans, setLoadingPlans] = useState(false);

    // Step 3: Pagamento
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loadingIntent, setLoadingIntent] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [finalPrice, setFinalPrice] = useState<number | null>(null);

    // Fetch Palestre
    useEffect(() => {
        const fetchGyms = async () => {
            try {
                const res = await fetch("/api/gyms?search=");
                if (res.ok) {
                    const data = await res.json();
                    setGyms(data);
                }
            } finally {
                setLoadingGyms(false);
            }
        };
        fetchGyms();
    }, []);

    // Fetch Piani quando cambia la palestra selezionata
    useEffect(() => {
        if (!selectedGym) return;

        const fetchPlans = async () => {
            setLoadingPlans(true);
            try {
                const res = await fetch(`/api/gyms/tipi-abbonamento?strutturaid=${selectedGym.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setPlans(data);
                }
            } finally {
                setLoadingPlans(false);
            }
        };
        fetchPlans();
    }, [selectedGym]);

    const handleSelectGym = useCallback((gym: Struttura) => {
        setSelectedGym(gym);
        setStep(2);
    }, []);

    const handleSelectPlan = useCallback(async (plan: TipoAbbonamento, code?: string) => {
        if (!selectedGym || !user) return;

        setSelectedPlan(plan);
        setLoadingIntent(true);
        try {
            // Crea il payment intent caricando l'API
            const res = await fetch("/api/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userid: user.id,
                    tipoid: plan.id,
                    strutturaid: selectedGym.id,
                    couponCode: code
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data._clientSecret) {
                    setClientSecret(data._clientSecret);
                    setFinalPrice(data.importo);
                    setStep(3);
                } else {
                    alert("Impossibile inizializzare il pagamento.");
                }
            } else {
                const err = await res.json();
                alert(`Errore: ${err.error || "Impossibile elaborare la richiesta"}`);
                // Non resettiamo selectedPlan se stiamo solo applicando un coupon errato in step 3
                if (step !== 3) setSelectedPlan(null);
            }
        } catch (e) {
            console.error("Errore creazione checkout:", e);
            alert("Errore di rete durante la connessione con il sistema di pagamento.");
            if (step !== 3) setSelectedPlan(null);
        } finally {
            setLoadingIntent(false);
        }
    }, [selectedGym, user, step]);

    return (
        <Card title="Acquista Abbonamento" className="animate-fadeIn">
            {/* Wizard Progress */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {[1, 2, 3].map((s) => (
                    <div key={s} style={{
                        flex: 1, height: "4px", borderRadius: "2px",
                        background: s <= step ? "hsl(var(--tf-primary))" : "hsl(var(--tf-surface-2))",
                        transition: "background 0.3s"
                    }} />
                ))}
            </div>

            {/* Step 1: Seleziona Palestra */}
            {step === 1 && (
                <div className="animate-fadeIn">
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>1. Scegli la palestra</h3>
                    {loadingGyms ? (
                        <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>Caricamento palestre...</p>
                    ) : gyms.length === 0 ? (
                        <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-danger))" }}>Nessuna palestra disponibile al momento.</p>
                    ) : (
                        <div style={{ display: "grid", gap: "0.75rem" }}>
                            {gyms.map(gym => (
                                <div
                                    key={gym.id}
                                    onClick={() => handleSelectGym(gym)}
                                    style={{
                                        padding: "1rem", borderRadius: "var(--tf-radius-sm)",
                                        border: "1px solid hsl(var(--tf-border))",
                                        background: "hsl(var(--tf-surface-2))",
                                        cursor: "pointer", transition: "all 0.2s",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = "hsl(var(--tf-primary))"}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = "hsl(var(--tf-border))"}
                                >
                                    <h4 style={{ fontWeight: 700, fontSize: "1rem" }}>{gym.denominazione}</h4>
                                    <p style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))" }}>{gym.indirizzo}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Seleziona Piano */}
            {step === 2 && (
                <div className="animate-fadeIn">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <div>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>2. Scegli il piano</h3>
                            <p style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))" }}>{selectedGym?.denominazione}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setStep(1)} disabled={loadingIntent}>Indietro</Button>
                    </div>

                    {loadingPlans ? (
                        <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-text-muted))" }}>Caricamento piani...</p>
                    ) : plans.length === 0 ? (
                        <p style={{ fontSize: "0.875rem", color: "hsl(var(--tf-danger))" }}>Nessun piano disponibile per questa palestra.</p>
                    ) : (
                        <div style={{ display: "grid", gap: "0.75rem" }}>
                            {plans.map(plan => (
                                <div
                                    key={plan.id}
                                    style={{
                                        padding: "1rem", borderRadius: "var(--tf-radius-sm)",
                                        border: `1px solid ${selectedPlan?.id === plan.id ? 'hsl(var(--tf-primary))' : 'hsl(var(--tf-border))'}`,
                                        background: selectedPlan?.id === plan.id ? 'hsl(var(--tf-primary)/.05)' : 'hsl(var(--tf-surface-2))',
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div>
                                            <h4 style={{ fontWeight: 700, fontSize: "1rem" }}>{plan.nome}</h4>
                                            {plan.descrizione && <p style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))", marginTop: "0.25rem" }}>{plan.descrizione}</p>}
                                            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(var(--tf-primary))", marginTop: "0.5rem" }}>
                                                Durata: {plan.duratamesi} {plan.duratamesi === 1 ? 'mese' : 'mesi'}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                                            <p style={{ fontWeight: 800, fontSize: "1.25rem" }}>€{plan.prezzo.toFixed(2)}</p>
                                            <Button
                                                size="sm"
                                                onClick={() => handleSelectPlan(plan)}
                                                disabled={loadingIntent}
                                            >
                                                {loadingIntent && selectedPlan?.id === plan.id ? "Attendi..." : "Seleziona"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Pagamento */}
            {step === 3 && clientSecret && selectedPlan && (
                <div className="animate-fadeIn">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <div>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>3. Pagamento sicuro</h3>
                            <p style={{ fontSize: "0.8rem", color: "hsl(var(--tf-text-muted))" }}>
                                Piano: {selectedPlan.nome} -
                                {finalPrice && finalPrice < selectedPlan.prezzo ? (
                                    <>
                                        <span style={{ textDecoration: "line-through", marginRight: "0.5rem" }}>€{selectedPlan.prezzo.toFixed(2)}</span>
                                        <span style={{ fontWeight: 800, color: "hsl(var(--tf-primary))" }}>€{finalPrice.toFixed(2)}</span>
                                    </>
                                ) : (
                                    ` €${selectedPlan.prezzo.toFixed(2)}`
                                )}
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Annulla</Button>
                    </div>

                    {/* Coupon Section */}
                    <div style={{
                        marginBottom: "1.5rem", padding: "1rem", borderRadius: "var(--tf-radius-sm)",
                        background: "hsl(var(--tf-surface-2))", border: "1px dashed hsl(var(--tf-border))",
                        display: "flex", gap: "0.5rem", alignItems: "center"
                    }}>
                        <input
                            placeholder="Codice Coupon"
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value)}
                            style={{
                                flex: 1, padding: "0.5rem", borderRadius: "var(--tf-radius-sm)",
                                border: "1px solid hsl(var(--tf-border))", background: "white", fontSize: "0.875rem"
                            }}
                        />
                        <Button
                            size="sm"
                            onClick={() => handleSelectPlan(selectedPlan, couponCode)}
                            disabled={loadingIntent || !couponCode}
                        >
                            Applica
                        </Button>
                    </div>

                    <Elements
                        stripe={stripePromise}
                        options={{
                            clientSecret,
                            appearance: {
                                theme: 'stripe',
                                variables: {
                                    colorPrimary: '#4f46e5', // var(--tf-primary)
                                    colorBackground: '#ffffff', // var(--tf-surface)
                                    colorText: '#1e293b', // var(--tf-text)
                                    colorDanger: '#ef4444', // var(--tf-danger)
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    spacingUnit: '4px',
                                    borderRadius: '8px',
                                }
                            }
                        }}
                    >
                        <CheckoutForm
                            amount={finalPrice ?? selectedPlan.prezzo}
                            onSuccess={onSuccess}
                            onError={(err) => console.error(err)}
                        />
                    </Elements>
                </div>
            )}
        </Card>
    );
}
