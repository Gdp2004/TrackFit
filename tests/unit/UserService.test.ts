/**
 * Unit Test – CreateUserManagerService
 * Covers EVERY method: registraUtente, getUtente, aggiornaUtente,
 * eliminaUtente, associaCoach, aggiornaParametriFisici, getListaUtenti, cambiaRuolo
 */

jest.mock("@/backend/infrastructure/config/supabase", () => ({
    createSupabaseServerClient: jest.fn(),
}));

import { CreateUserManagerService } from "@/backend/application/service/user/CreateUserManagerService";
import { UserRepositoryPort } from "@/backend/domain/port/out/UserRepositoryPort";
import { RuoloEnum } from "@/backend/domain/model/enums";
import { mockDeep, mockReset } from "jest-mock-extended";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

const BASE_USER = {
    id: "u1", email: "test@x.com", nome: "Mario", cognome: "Rossi",
    ruolo: RuoloEnum.UTENTE, createdat: new Date().toISOString(),
};

describe("CreateUserManagerService – All Methods", () => {
    const repo = mockDeep<UserRepositoryPort>();
    let service: CreateUserManagerService;

    const supabase = {
        auth: {
            admin: {
                createUser: jest.fn(),
                deleteUser: jest.fn(),
            },
        },
        from: jest.fn(() => ({
            select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null, error: null }) })) })),
            insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { id: "c1" }, error: null }) })) })),
        })),
    };

    beforeEach(() => {
        mockReset(repo);
        (createSupabaseServerClient as jest.Mock).mockReturnValue(supabase);
        service = new CreateUserManagerService(repo);
        jest.clearAllMocks();
        (createSupabaseServerClient as jest.Mock).mockReturnValue(supabase);
    });

    // ── registraUtente ────────────────────────────────────────────────────────
    describe("registraUtente", () => {
        it("crea utente con dati validi", async () => {
            supabase.auth.admin.createUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
            repo.findById.mockResolvedValue(null);
            repo.save.mockResolvedValue(BASE_USER);

            const result = await service.registraUtente("test@x.com", "pass", "Mario", "Rossi", RuoloEnum.UTENTE);
            expect(result.id).toBe("u1");
            expect(repo.save).toHaveBeenCalled();
        });

        it("restituisce utente esistente se già sincronizzato", async () => {
            supabase.auth.admin.createUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
            repo.findById.mockResolvedValue(BASE_USER);

            const result = await service.registraUtente("test@x.com", "pass", "Mario", "Rossi", RuoloEnum.UTENTE);
            expect(result).toEqual(BASE_USER);
            expect(repo.save).not.toHaveBeenCalled();
        });

        it("lancia errore se campo vuoto", async () => {
            await expect(service.registraUtente("", "pass", "M", "R", RuoloEnum.UTENTE))
                .rejects.toThrow("obbligatori");
        });

        it("propaga errore Supabase", async () => {
            supabase.auth.admin.createUser.mockResolvedValue({ data: { user: null }, error: { message: "EmailTaken" } });
            await expect(service.registraUtente("e@x.com", "pass", "M", "R", RuoloEnum.UTENTE))
                .rejects.toThrow("EmailTaken");
        });
    });

    // ── getUtente ─────────────────────────────────────────────────────────────
    describe("getUtente", () => {
        it("restituisce utente trovato", async () => {
            repo.findById.mockResolvedValue(BASE_USER);
            const result = await service.getUtente("u1");
            expect(result).toEqual(BASE_USER);
        });

        it("lancia errore se non trovato", async () => {
            repo.findById.mockResolvedValue(null);
            await expect(service.getUtente("u999")).rejects.toThrow("non trovato");
        });
    });

    // ── aggiornaUtente ────────────────────────────────────────────────────────
    describe("aggiornaUtente", () => {
        it("aggiorna e restituisce l'utente modificato", async () => {
            repo.update.mockResolvedValue({ ...BASE_USER, nome: "Luigi" });
            const result = await service.aggiornaUtente("u1", { nome: "Luigi" });
            expect(result.nome).toBe("Luigi");
            expect(repo.update).toHaveBeenCalledWith("u1", { nome: "Luigi" });
        });
    });

    // ── eliminaUtente ─────────────────────────────────────────────────────────
    describe("eliminaUtente", () => {
        it("elimina utente da auth e DB", async () => {
            supabase.auth.admin.deleteUser.mockResolvedValue({ error: null });
            repo.delete.mockResolvedValue(undefined);

            await service.eliminaUtente("u1");
            expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith("u1");
            expect(repo.delete).toHaveBeenCalledWith("u1");
        });
    });

    // ── associaCoach ──────────────────────────────────────────────────────────
    describe("associaCoach", () => {
        it("associa il coach all'utente", async () => {
            repo.update.mockResolvedValue({ ...BASE_USER, coachid: "c1" });
            await service.associaCoach("u1", "c1");
            expect(repo.update).toHaveBeenCalledWith("u1", { coachid: "c1" });
        });
    });

    // ── aggiornaParametriFisici ───────────────────────────────────────────────
    describe("aggiornaParametriFisici", () => {
        it("aggiorna peso e altezza", async () => {
            repo.update.mockResolvedValue({ ...BASE_USER, peso: 80, altezza: 180 });
            const result = await service.aggiornaParametriFisici("u1", 80, 180);
            expect(repo.update).toHaveBeenCalledWith("u1", { peso: 80, altezza: 180 });
            expect(result.peso).toBe(80);
        });
    });

    // ── getListaUtenti ────────────────────────────────────────────────────────
    describe("getListaUtenti", () => {
        it("restituisce tutti gli utenti senza filtro", async () => {
            repo.findAll.mockResolvedValue([BASE_USER]);
            const result = await service.getListaUtenti();
            expect(repo.findAll).toHaveBeenCalled();
            expect(result).toHaveLength(1);
        });

        it("filtra per ruolo se specificato", async () => {
            repo.findByRuolo.mockResolvedValue([BASE_USER]);
            const result = await service.getListaUtenti(RuoloEnum.UTENTE);
            expect(repo.findByRuolo).toHaveBeenCalledWith(RuoloEnum.UTENTE);
            expect(result).toHaveLength(1);
        });
    });

    // ── cambiaRuolo ───────────────────────────────────────────────────────────
    describe("cambiaRuolo", () => {
        it("aggiorna ruolo a UTENTE senza creare profili speciali", async () => {
            repo.updateRuolo.mockResolvedValue({ ...BASE_USER, ruolo: RuoloEnum.UTENTE });
            const result = await service.cambiaRuolo("u1", RuoloEnum.UTENTE);
            expect(result.ruolo).toBe(RuoloEnum.UTENTE);
        });

        it("crea profilo COACH se non esiste già", async () => {
            repo.updateRuolo.mockResolvedValue({ ...BASE_USER, ruolo: RuoloEnum.COACH });
            // from("coaches").select("id").eq(...).single() → data: null = non esiste
            supabase.from.mockReturnValue({
                select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null }) })) })),
                insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { id: "c1" }, error: null }) })) })),
            });

            await service.cambiaRuolo("u1", RuoloEnum.COACH);
            expect(supabase.from).toHaveBeenCalledWith("coaches");
        });
    });
});
