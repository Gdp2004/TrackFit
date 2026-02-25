"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@frontend/contexts/AuthContext";
import { NotificationBell } from "./NotificationBell";
import { RuoloEnum } from "@backend/domain/model/enums";

const ROLE_DASHBOARD: Record<RuoloEnum, string> = {
  [RuoloEnum.COACH]: "/coach/dashboard",
  [RuoloEnum.GESTORE]: "/gym/dashboard",
  [RuoloEnum.UTENTE]: "/dashboard",
  [RuoloEnum.ADMIN]: "/dashboard",
};

export function Navbar() {
  const { user, ruolo, signOut } = useAuth();
  const router = useRouter();

  const dashboardHref = ruolo ? ROLE_DASHBOARD[ruolo] : "/dashboard";

  const initials = user
    ? `${user.user_metadata?.nome?.[0] ?? ""}${user.user_metadata?.cognome?.[0] ?? ""}`.toUpperCase()
    : "?";

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        background: "hsl(var(--tf-surface))",
        borderBottom: "1px solid hsl(var(--tf-border))",
        position: "sticky",
        top: 0,
        zIndex: 40,
        gap: "1rem",
      }}
    >
      {/* Mobile logo – punta alla dashboard del ruolo */}
      <Link
        href={dashboardHref}
        className="md:hidden flex items-center gap-2"
        style={{ textDecoration: "none" }}
      >
        <span style={{
          fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, hsl(var(--tf-primary)) 30%, hsl(var(--tf-accent)))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>TrackFit</span>
      </Link>

      {/* Spacer for desktop (sidebar has the logo) */}
      <div className="hidden md:block" />

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {user && <NotificationBell userid={user.id} />}

        {/* Role badge */}
        {ruolo && (
          <span style={{
            padding: "0.2rem 0.6rem",
            borderRadius: "999px",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            background: "hsl(var(--tf-primary)/.15)",
            color: "hsl(var(--tf-primary))",
          }}>
            {ruolo}
          </span>
        )}

        {/* Avatar + dropdown */}
        <div style={{ position: "relative" }} className="group">
          <button
            style={{
              width: 36, height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.8rem",
              border: "none",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title={user?.email}
          >
            {initials}
          </button>
          {/* Dropdown */}
          <div
            className="group-hover:opacity-100 group-hover:pointer-events-auto"
            style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              minWidth: 180,
              background: "hsl(var(--tf-surface))",
              border: "1px solid hsl(var(--tf-border))",
              borderRadius: "var(--tf-radius-sm)",
              boxShadow: "var(--tf-shadow-lg)",
              padding: "0.5rem",
              opacity: 0,
              pointerEvents: "none",
              transition: "opacity var(--tf-transition)",
              zIndex: 50,
            }}
          >
            <p style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "hsl(var(--tf-text-muted))" }}>
              {user?.email}
            </p>
            <Link
              href={dashboardHref}
              style={{
                display: "block", padding: "0.5rem 0.75rem",
                borderRadius: "var(--tf-radius-sm)",
                fontSize: "0.875rem",
                color: "hsl(var(--tf-text))",
                textDecoration: "none",
              }}
            >
              ⊞ Dashboard
            </Link>
            <Link
              href="/profile"
              style={{
                display: "block", padding: "0.5rem 0.75rem",
                borderRadius: "var(--tf-radius-sm)",
                fontSize: "0.875rem",
                color: "hsl(var(--tf-text))",
                textDecoration: "none",
              }}
            >
              👤 Profilo
            </Link>
            <button
              onClick={handleSignOut}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--tf-radius-sm)",
                fontSize: "0.875rem",
                color: "hsl(var(--tf-danger))",
                background: "none", border: "none", cursor: "pointer",
              }}
            >
              🚪 Esci
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}