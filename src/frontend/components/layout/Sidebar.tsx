"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@frontend/contexts/AuthContext";
import { RuoloEnum } from "@backend/domain/model/enums";

type NavItem = { href: string; label: string; icon: string; roles?: RuoloEnum[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/workouts", label: "Allenamenti", icon: "🏃" },
  { href: "/coaches", label: "Coach", icon: "🎯", roles: [RuoloEnum.UTENTE, RuoloEnum.ADMIN] },
  { href: "/gyms", label: "Palestre", icon: "🏋️" },
  { href: "/subscription", label: "Abbonamento", icon: "🎫", roles: [RuoloEnum.UTENTE] },
  { href: "/reports", label: "Report", icon: "📊" },
  { href: "/profile", label: "Profilo", icon: "👤" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { ruolo } = useAuth();

  const items = NAV_ITEMS.filter(
    (item) => !item.roles || !ruolo || item.roles.includes(ruolo)
  );

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
        href="/dashboard"
        className="flex items-center gap-2 px-3 py-2 mb-6"
        style={{ textDecoration: "none" }}
      >
        <span style={{
          width: 36, height: 36,
          borderRadius: "10px",
          background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.1rem", flexShrink: 0,
        }}>🏃</span>
        <span style={{
          fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, hsl(var(--tf-primary)) 30%, hsl(var(--tf-accent)))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>TrackFit</span>
      </Link>

      {/* Nav Items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
        {items.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
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