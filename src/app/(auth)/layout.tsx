export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ minHeight: "100dvh", display: "flex", background: "hsl(var(--tf-bg))" }}>
            {/* Left panel – branding */}
            <div
                className="hidden md:flex"
                style={{
                    width: "45%",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "3rem",
                    background: "linear-gradient(160deg, hsl(var(--tf-primary-dark)) 0%, hsl(230 60% 20%) 50%, hsl(158 64% 20%) 100%)",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* decorative circles */}
                <div style={{
                    position: "absolute", top: "-80px", right: "-80px",
                    width: 300, height: 300, borderRadius: "50%",
                    background: "hsl(var(--tf-primary)/.15)",
                }} />
                <div style={{
                    position: "absolute", bottom: "-60px", left: "-60px",
                    width: 220, height: 220, borderRadius: "50%",
                    background: "hsl(var(--tf-accent)/.12)",
                }} />

                <div style={{ textAlign: "center", zIndex: 1 }}>
                    <div style={{
                        width: 72, height: 72,
                        borderRadius: "20px",
                        background: "linear-gradient(135deg, hsl(var(--tf-primary)), hsl(var(--tf-accent)))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "2rem", margin: "0 auto 1.5rem",
                        boxShadow: "0 16px 40px hsl(var(--tf-primary)/.4)",
                    }}>🏃</div>

                    <h1 style={{
                        fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.04em",
                        background: "linear-gradient(135deg, #fff 30%, hsl(var(--tf-accent)))",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        marginBottom: "1rem",
                    }}>
                        TrackFit
                    </h1>
                    <p style={{ color: "rgba(255,255,255,.7)", fontSize: "1rem", lineHeight: 1.6, maxWidth: 280 }}>
                        Il tuo compagno digitale per monitorare ogni allenamento e raggiungere i tuoi obiettivi.
                    </p>
                    <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", marginTop: "2.5rem" }}>
                        {[["🏃", "Allenamenti"], ["🎯", "Coach"], ["📊", "Report"]].map(([icon, label]) => (
                            <div key={label} style={{ textAlign: "center", color: "rgba(255,255,255,.8)" }}>
                                <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{icon}</div>
                                <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel – form */}
            <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "2rem",
            }}>
                <div style={{ width: "100%", maxWidth: "420px" }} className="animate-fadeIn">
                    {children}
                </div>
            </div>
        </div>
    );
}
