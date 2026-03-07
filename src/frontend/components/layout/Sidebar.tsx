"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@frontend/contexts/AuthContext";
import { RuoloEnum } from "@backend/domain/model/enums";

type NavItem = { href: string; label: string; icon: string };

/** Mappa ruolo → path homepage della dashboard */
const ROLE_DASHBOARD: Record<RuoloEnum, string> = {
  [RuoloEnum.COACH]: "/coach/dashboard",
  [RuoloEnum.GESTORE]: "/gym/dashboard",
  [RuoloEnum.UTENTE]: "/dashboard",
  [RuoloEnum.ADMIN]: "/admin/users",
};

/** Voci comuni a tutti i ruoli */
const NAV_COMMON: NavItem[] = [
  { href: "/profile", label: "Profilo", icon: "👤" },
];

/** Voci per ruolo */
const NAV_BY_ROLE: Record<RuoloEnum, NavItem[]> = {
  [RuoloEnum.UTENTE]: [
    { href: "/workouts", label: "Allenamenti", icon: "🏃" },
    { href: "/coaches", label: "Trova Coach", icon: "🎯" },
    { href: "/gyms", label: "Palestre", icon: "🏋️" },
    { href: "/subscription", label: "Abbonamento", icon: "🎫" },
    { href: "/reports", label: "Report", icon: "📊" },
  ],
  [RuoloEnum.COACH]: [
    { href: "/coaches/atleti", label: "Miei Atleti", icon: "👥" },
    { href: "/coaches/disponibilita", label: "Disponibilità", icon: "🗓️" },
    { href: "/coaches/piani", label: "Piani", icon: "📋" },
    { href: "/coaches/recensioni", label: "Recensioni", icon: "⭐️" },
  ],
  [RuoloEnum.GESTORE]: [
    { href: "/gyms/struttura", label: "Struttura", icon: "🏋️" },
    { href: "/gyms/abbonamenti", label: "Abbonamenti", icon: "💳" },
    { href: "/gyms/tipi-abbonamento", label: "Piani", icon: "📋" },
    { href: "/gyms/corsi", label: "Corsi", icon: "📆" },
    { href: "/gyms/coaches", label: "Coach", icon: "💪" },
    { href: "/gyms/coupon", label: "Coupon", icon: "🎟️" },
  ],
  [RuoloEnum.ADMIN]: [
    { href: "/admin/users", label: "Gestione Utenti", icon: "⚙️" },
    { href: "/admin/workouts", label: "Allenamenti", icon: "🏃" },
    { href: "/admin/gyms", label: "Palestre", icon: "🏋️" },
    { href: "/admin/abbonamenti", label: "Abbonamenti", icon: "🎫" },
  ],
};


export function Sidebar() {
  const pathname = usePathname();
  const { ruolo } = useAuth();

  const dashboardHref = ruolo ? ROLE_DASHBOARD[ruolo] : "/dashboard";
  const roleItems = ruolo ? NAV_BY_ROLE[ruolo] : NAV_BY_ROLE[RuoloEnum.UTENTE];

  const allItems: NavItem[] = [
    ...(ruolo === RuoloEnum.ADMIN ? [] : [{ href: dashboardHref, label: "Dashboard", icon: "💻" }]),
    ...roleItems,
    ...NAV_COMMON,
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== dashboardHref && href !== "/" && pathname.startsWith(href));

  return (
    <aside
      className="hidden md:flex flex-col"
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "hsl(var(--tf-surface))",
        borderRight: "1px solid hsl(var(--tf-border))",
        padding: "1.5rem 0.75rem",
        gap: "0.25rem",
      }}
    >
      {/* Logo */}
      <Link
        href={dashboardHref}
        className="flex flex-col items-center px-3 py-2 mb-8"
        style={{
          textDecoration: "none",
          gap: "0.6rem",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/auth/trackfit_icon_crop.png"
          alt="TrackFit logo"
          style={{
            width: 48,
            height: 48,
            objectFit: "contain",
          }}
        />
        <span style={{
          fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, hsl(var(--tf-primary)) 30%, hsl(var(--tf-accent)))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>TrackFit</span>
      </Link>



      {/* Spacer invisibile (serve per distanziare il logo in alto dal bottone dashboard)*/}
      <div style={{ height: "2rem", pointerEvents: "none", userSelect: "none" }} aria-hidden="true" />

      {/* Nav Items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
        {allItems.map(({ href, label, icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.625rem 0.875rem",
                borderRadius: "var(--tf-radius-sm)",
                textDecoration: "none",
                fontWeight: active ? 600 : 500,
                fontSize: "0.875rem",
                transition: "all var(--tf-transition)",
                background: active ? "hsl(var(--tf-primary)/.15)" : "transparent",
                color: active ? "hsl(var(--tf-primary))" : "hsl(var(--tf-text-muted))",
                borderLeft: active ? "3px solid hsl(var(--tf-primary))" : "3px solid transparent",
              }}
            >
              <span style={{ fontSize: "1rem", width: 20, textAlign: "center" }}>{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}