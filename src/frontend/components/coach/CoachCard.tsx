"use client";

import { useState } from "react";
import { Badge } from "@frontend/components/ui/Badge";
import { Button } from "@frontend/components/ui/Button";
import { BookingModal } from "./BookingModal";
import { ReviewSidebar } from "../shared/ReviewSidebar";
import { CoachInfoModal } from "./CoachInfoModal";
import type { User, SlotDisponibilita } from "@backend/domain/model/types";

interface CoachCardProps { coach: User & { specializzazione?: string; rating?: number; bio?: string; telefono?: string; disponibilita?: SlotDisponibilita[]; coachid?: string }; }

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: "0.75rem", color: s <= Math.round(rating) ? "#f59e0b" : "hsl(var(--tf-border))" }}>★</span>
      ))}
      <span style={{ fontSize: "0.72rem", color: "hsl(var(--tf-text-muted))", marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

const BG_COLORS = [
  "linear-gradient(135deg,hsl(25 95% 53%),hsl(20 90% 38%))",
  "linear-gradient(135deg,hsl(38 100% 55%),hsl(25 95% 45%))",
  "linear-gradient(135deg,hsl(20 85% 45%),hsl(10 80% 35%))",
];

export function CoachCard({ coach }: CoachCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const idx = coach.id.charCodeAt(0) % BG_COLORS.length;
  const initials = `${coach.nome[0]}${coach.cognome[0]}`.toUpperCase();

  return (
    <>
      <div
        className="tf-card"
        style={{ display: "flex", flexDirection: "column", gap: "1rem", cursor: "pointer", transition: "transform 0.2s" }}
        onClick={() => setInfoOpen(true)}
        onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        {/* Avatar + info */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: BG_COLORS[idx],
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "1.1rem", color: "#fff",
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{coach.nome} {coach.cognome}</p>
            <p style={{ fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {coach.email}
            </p>
          </div>
        </div>

        {/* Specializzazione + rating */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {coach.specializzazione && (
            <Badge color="blue">{coach.specializzazione}</Badge>
          )}
          <StarRating rating={coach.rating} />
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
            style={{ flex: 1 }}
          >
            🗓️ Prenota
          </Button>
          <Button
            variant="secondary"
            onClick={(e) => { e.stopPropagation(); setReviewOpen(true); }}
            style={{ flex: 1 }}
          >
            ⭐ Recensisci
          </Button>
        </div>
      </div>

      <CoachInfoModal coach={coach} open={infoOpen} onClose={() => setInfoOpen(false)} />
      <BookingModal coach={coach} open={modalOpen} onClose={() => setModalOpen(false)} />
      <ReviewSidebar
        coachId={coach.coachid || coach.id}
        name={`${coach.nome} ${coach.cognome}`}
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
      />
    </>
  );
}

