"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@frontend/contexts/AuthContext";
import { NotificationBell } from "./NotificationBell";
import { RuoloEnum } from "@backend/domain/model/enums";

const ROLE_DASHBOARD: Record<RuoloEnum, string> = {
  [RuoloEnum.COACH]: "/coach/dashboard",
  [RuoloEnum.GESTORE]: "/gym/dashboard",
  [RuoloEnum.UTENTE]: "/dashboard",
  [RuoloEnum.ADMIN]: "/dashboard",
};

type DropdownItem =
  | { type: "link"; href: string; icon: string; label: string }
  | { type: "button"; icon: string; label: string; onClick: () => void; danger?: boolean }
  | { type: "divider" };

export function Navbar() {
  const { user, ruolo, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dashboardHref = ruolo ? ROLE_DASHBOARD[ruolo] : "/dashboard";

  const initials = user
    ? `${user.user_metadata?.nome?.[0] ?? ""}${user.user_metadata?.cognome?.[0] ?? ""}`.toUpperCase() || "?"
    : "?";

  const displayName =
    user?.user_metadata?.nome
      ? `${user.user_metadata.nome} ${user.user_metadata.cognome ?? ""}`.trim()
      : user?.email ?? "";

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.push("/login");
  };

  // Chiudi dropdown cliccando fuori
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Voci menu in base al ruolo
  const menuItems: DropdownItem[] = [
    { type: "link", href: dashboardHref, icon: "💻", label: "Dashboard" },
    { type: "link", href: "/profile", icon: "👤", label: "Il mio profilo" },
    { type: "link", href: "/profile", icon: "⚙️", label: "Impostazioni account" },
    ...(ruolo === RuoloEnum.UTENTE
      ? [
        { type: "link" as const, href: "/subscription", icon: "💳", label: "Abbonamento" },
        { type: "link" as const, href: "/workouts", icon: "🏃", label: "I miei allenamenti" },
      ]
      : []),
    ...(ruolo === RuoloEnum.COACH
      ? [
        { type: "link" as const, href: "/coaches/atleti", icon: "👥", label: "I miei atleti" },
        { type: "link" as const, href: "/coaches/disponibilita", icon: "🗓️", label: "Disponibilità" },
      ]
      : []),
    ...(ruolo === RuoloEnum.GESTORE
      ? [
        { type: "link" as const, href: "/gyms/struttura", icon: "🏋️", label: "La mia struttura" },
        { type: "link" as const, href: "/gyms/coupon", icon: "🎟️", label: "Coupon" },
      ]
      : []),
    ...(ruolo === RuoloEnum.ADMIN
      ? [{ type: "link" as const, href: "/admin/users", icon: "🛡️", label: "Pannello Admin" }]
      : []),
    { type: "divider" },
    { type: "button", icon: "🚪", label: "Esci", onClick: handleSignOut, danger: true },
  ];

  const linkItemStyle = {
    display: "flex", alignItems: "center", gap: "0.6rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "var(--tf-radius-sm)",
    fontSize: "0.875rem",
    color: "hsl(var(--tf-text))",
    textDecoration: "none",
    transition: "background 0.15s",
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
      {/* Mobile logo */}
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

      {/* Spacer desktop */}
      <div className="hidden md:block" />

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {user && <NotificationBell userid={user.id} />}

        {/* Avatar con dropdown click */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            id="user-menu-button"
            aria-haspopup="true"
            aria-expanded={open}
            onClick={() => setOpen(prev => !prev)}
            style={{
              width: 36, height: 36,
              borderRadius: "50%",
              background: open
                ? "linear-gradient(135deg, hsl(var(--tf-accent)), hsl(var(--tf-primary)))"
                : "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.8rem",
              border: open ? "2px solid hsl(var(--tf-primary)/.5)" : "2px solid transparent",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              outline: "none",
              transition: "border 0.15s, transform 0.1s",
              transform: open ? "scale(1.08)" : "scale(1)",
            }}
            title={user?.email}
          >
            {initials}
          </button>

          {/* Dropdown menu */}
          {open && (
            <div
              role="menu"
              aria-labelledby="user-menu-button"
              style={{
                position: "absolute", right: 0, top: "calc(100% + 10px)",
                minWidth: 220,
                background: "hsl(var(--tf-surface))",
                border: "1px solid hsl(var(--tf-border))",
                borderRadius: "var(--tf-radius)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
                padding: "0.5rem",
                zIndex: 50,
                animation: "tf-dropdown-in 0.15s ease",
              }}
            >
              {/* Header con nome e email */}
              <div style={{
                padding: "0.6rem 0.75rem 0.75rem",
                borderBottom: "1px solid hsl(var(--tf-border))",
                marginBottom: "0.375rem",
              }}>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.15rem" }}>
                  {displayName}
                </p>
                <p style={{ fontSize: "0.72rem", color: "hsl(var(--tf-text-muted))", wordBreak: "break-all" }}>
                  {user?.email}
                </p>
              </div>

              {/* Voci menu */}
              {menuItems.map((item, i) => {
                if (item.type === "divider") {
                  return <div key={i} style={{ height: 1, background: "hsl(var(--tf-border))", margin: "0.375rem 0" }} />;
                }
                if (item.type === "link") {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      style={linkItemStyle}
                      onMouseEnter={e => (e.currentTarget.style.background = "hsl(var(--tf-border)/.4)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: "0.9rem", width: 18, flexShrink: 0 }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                }
                // button
                return (
                  <button
                    key={item.label}
                    role="menuitem"
                    onClick={item.onClick}
                    style={{
                      ...linkItemStyle,
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: item.danger ? "hsl(var(--tf-danger))" : "hsl(var(--tf-text))",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = item.danger ? "hsl(var(--tf-danger)/.08)" : "hsl(var(--tf-border)/.4)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: "0.9rem", width: 18, flexShrink: 0 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Keyframe animation per il dropdown */}
      <style>{`
        @keyframes tf-dropdown-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </header>
  );
}