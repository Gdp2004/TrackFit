import type { Metadata } from "next";
import { Sidebar } from "@frontend/components/layout/Sidebar";
import { Navbar } from "@frontend/components/layout/Navbar";

export const metadata: Metadata = {
  title: "TrackFit – Dashboard",
  description: "Il tuo centro di controllo per gli allenamenti",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "hsl(var(--tf-bg))" }}>
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
