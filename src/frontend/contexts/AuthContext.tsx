"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabaseBrowser } from "@frontend/lib/supabase-browser";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { RuoloEnum } from "@backend/domain/model/enums";

interface AuthContextValue {
    session: Session | null;
    user: SupabaseUser | null;
    ruolo: RuoloEnum | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    session: null,
    user: null,
    ruolo: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabaseBrowser.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });

        const { data: listener } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => listener.subscription.unsubscribe();
    }, []);

    const user = session?.user ?? null;
    const ruolo = (user?.user_metadata?.ruolo as RuoloEnum) ?? null;

    const signOut = async () => {
        await supabaseBrowser.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, ruolo, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
