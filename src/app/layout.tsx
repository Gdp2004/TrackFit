import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@frontend/contexts/AuthContext";

export const metadata: Metadata = {
    title: "TrackFit – Il tuo compagno di allenamento",
    description: "Monitora i tuoi allenamenti, gestisci abbonamenti e prenota coach con TrackFit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="it" suppressHydrationWarning>
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
