"use client";

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@frontend/components/ui/Button";

interface CheckoutFormProps {
    onSuccess: () => void;
    onError: (error: string) => void;
    amount: number;
}

export function CheckoutForm({ onSuccess, onError, amount }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setMessage(null);

        // stripe.confirmPayment will handle the redirect or return an error
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL needs to be absolute
                return_url: `${window.location.origin}/subscription?payment_status=success`,
            },
            redirect: "if_required", // Prevent automatic redirect if possible to handle SPA state
        });

        if (error) {
            setMessage(error.message ?? "Si è verificato un errore imprevisto.");
            onError(error.message ?? "Errore di pagamento");
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            // Payment succeeded without redirect
            onSuccess();
        } else {
            // This case might hit if redirect="always" or for certain payment methods
            // that require additional actions outside the form.
            setMessage("Pagamento in elaborazione...");
        }

        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{
                padding: "1rem", borderRadius: "var(--tf-radius-sm)",
                background: "hsl(var(--tf-surface-2))", border: "1px solid hsl(var(--tf-border))"
            }}>
                <PaymentElement 
                    options={{ 
                        layout: "tabs",
                        business: { name: "TrackFit Subscription" }
                    }} 
                />
            </div>
            
            {message && (
                <div style={{ color: "hsl(var(--tf-danger))", fontSize: "0.875rem", fontWeight: 600 }}>
                    {message}
                </div>
            )}
            
            <Button 
                type="submit" 
                disabled={isProcessing || !stripe || !elements}
                style={{ width: "100%" }}
            >
                {isProcessing ? "Elaborazione..." : `Paga €${amount.toFixed(2)}`}
            </Button>
            <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", textAlign: "center" }}>
                I pagamenti sono sicuri e processati da Stripe.
            </p>
        </form>
    );
}
