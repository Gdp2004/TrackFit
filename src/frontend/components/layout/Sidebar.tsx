"use client";
import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "ðŸ " },
  { href: "/workouts", label: "Allenamenti", icon: "ðŸƒ" },
  { href: "/subscription", label: "Abbonamento", icon: "ðŸŽ«" },
  { href: "/coaches", label: "Coach", icon: "ðŸ§‘â€ðŸ«" },
  { href: "/gyms", label: "Palestre", icon: "ðŸ‹ï¸" },
  { href: "/reports", label: "Report", icon: "ðŸ“Š" },
];

export function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 text-white min-h-screen flex flex-col gap-1 p-4">
      {links.map(({ href, label, icon }) => (
        <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          <span>{icon}</span><span className="text-sm font-medium">{label}</span>
        </Link>
      ))}
    </aside>
  );
}