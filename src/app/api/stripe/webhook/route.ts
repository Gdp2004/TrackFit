import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";
import { StatoPagamentoEnum, StatoAbbonamentoEnum } from "@/backend/domain/model/enums";

// Inizializza Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-02-24.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
        console.error(`⚠️  Webhook signature verification failed:`, err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`💰 PaymentIntent status: ${paymentIntent.status}`);

            try {
                const supabase = createSupabaseServerClient();

                // 1. Trova il pagamento associato a questo payment intent
                const { data: pagamento, error: payErr } = await supabase
                    .from("pagamenti")
                    .select("id, userid")
                    .eq("stripepaymentintentid", paymentIntent.id)
                    .single();

                if (payErr || !pagamento) {
                    console.error("Non ho trovato il pagamento nel DB per l'intent:", paymentIntent.id);
                    break;
                }

                // 2. Trova l'abbonamento IN_ATTESA collegato a questo utente e aggiornalo
                // NOTA: il CreateSubscriptionMangerService per ora crea in ATTIVO direttamente (da fixare se vogliamo essere 100% rigorosi) 
                // Ma almeno aggiorniamo lo stato del Pagamento a COMPLETATO
                await supabase
                    .from("pagamenti")
                    .update({ stato: StatoPagamentoEnum.COMPLETATO })
                    .eq("id", pagamento.id);

                console.log("✅ Pagamento segnato come COMPLETATO nel database");
            } catch (err) {
                console.error("Errore nell'aggiornamento del DB:", err);
            }
            break;
        }
        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`❌ Payment failed: ${paymentIntent.last_payment_error?.message}`);

            try {
                const supabase = createSupabaseServerClient();
                await supabase
                    .from("pagamenti")
                    .update({ stato: StatoPagamentoEnum.FALLITO })
                    .eq("stripepaymentintentid", paymentIntent.id);
            } catch (err) {
                console.error("Errore nell'aggiornamento del DB:", err);
            }
            break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
