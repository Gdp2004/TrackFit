import type { Metadata } from "next";
import { Sidebar } from "@frontend/components/layout/Sidebar";
import { Navbar } from "@frontend/components/layout/Navbar";

export const metadata: Metadata = {
  title: "TrackFit – Dashboard",
  description: "Il tuo centro di controllo per gli allenamenti",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100dvh", position: "relative", overflow: "hidden" }}>
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/backgrounds/OrangeBackground.jpg"
        alt=""
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          zIndex: -1,
          opacity: 0.18,
        }}
      />
      {/* Overlay scuro per mantenere leggibilità */}
      <div style={{
        position: "fixed", inset: 0,
        background: "hsl(var(--tf-bg)/.82)",
        zIndex: -1,
      }} />

      {/* Contenuto */}
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Navbar />
        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

