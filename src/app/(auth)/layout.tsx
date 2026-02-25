export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ minHeight: "100dvh", display: "flex", background: "hsl(var(--tf-bg))" }}>

            {/* Left panel – solo sfondo + scritta TrackFit */}
            <div
                className="hidden md:flex"
                style={{
                    width: "45%",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    paddingTop: "3.5rem",
                    padding: "3.5rem 3rem 3rem",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Background image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/auth/Login-backgorund.jpg"
                    alt=""
                    aria-hidden="true"
                    style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover",
                        opacity: 0.55,
                    }}
                />
                {/* Dark overlay */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(160deg, hsl(20 50% 10%/.85) 0%, hsl(var(--tf-bg)/.5) 50%, hsl(25 30% 8%/.9) 100%)",
                }} />

                {/* Solo scritta TrackFit – in alto al centro */}
                <h1 style={{
                    position: "relative", zIndex: 1,
                    fontSize: "3.5rem", fontWeight: 900, letterSpacing: "-0.05em",
                    background: "linear-gradient(135deg, #fff 30%, hsl(var(--tf-accent)))",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    margin: 0,
                    textAlign: "center",
                }}>
                    TrackFit
                </h1>
            </div>

            {/* Right panel – form con icona sopra */}
            <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "2rem",
            }}>
                <div style={{ width: "100%", maxWidth: "420px" }} className="animate-fadeIn">

                    {/* Icona TrackFit sopra il form */}
                    <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/auth/trackfit_icon_crop.png"
                            alt="TrackFit logo"
                            style={{
                                width: 110,
                                height: 110,
                                objectFit: "contain",
                                display: "inline-block",
                            }}
                        />
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
