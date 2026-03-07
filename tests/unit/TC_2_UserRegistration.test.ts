/**
 * Unit Test – CreateUserManagerService
 * TC_2: Registrazione utente – validazione campi, integrazione Supabase Auth
 */

jest.mock("@/backend/infrastructure/config/supabase", () => ({
    createSupabaseServerClient: jest.fn(),
}));

import { CreateUserManagerService } from "@/backend/application/service/user/CreateUserManagerService";
import { UserRepositoryPort } from "@/backend/domain/port/out/UserRepositoryPort";
import { RuoloEnum } from "@/backend/domain/model/enums";
import { mockDeep, mockReset } from "jest-mock-extended";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

describe("CreateUserManagerService – Registrazione (TC_2)", () => {
    const userRepoMock = mockDeep<UserRepositoryPort>();
    let service: CreateUserManagerService;

    const mockSupabase = {
        auth: {
            admin: {
                createUser: jest.fn(),
                deleteUser: jest.fn(),
            },
        },
        from: jest.fn(),
    };

    const EMAIL = "test@example.com";
    const PASS = "Password123!";
    const NOME = "Mario";
    const COG = "Rossi";
    const RUOLO = RuoloEnum.UTENTE;

    beforeEach(() => {
        mockReset(userRepoMock);
        service = new CreateUserManagerService(userRepoMock);
        (createSupabaseServerClient as jest.Mock).mockReturnValue(mockSupabase);
        jest.clearAllMocks();
    });

    it("TC_2.4 – fallisce se il nome è vuoto", async () => {
        await expect(service.registraUtente(EMAIL, PASS, "", COG, RUOLO))
            .rejects.toThrow("Tutti i campi sono obbligatori.");
    });

    it("TC_2.6 – registra l'utente con dati validi", async () => {
        const UID = "uuid-123";
        mockSupabase.auth.admin.createUser.mockResolvedValue({
            data: { user: { id: UID } },
            error: null,
        });
        userRepoMock.findById.mockResolvedValue(null);
        userRepoMock.save.mockResolvedValue({
            id: UID, email: EMAIL, nome: NOME, cognome: COG, ruolo: RUOLO,
            createdat: new Date().toISOString(),
        });

        const result = await service.registraUtente(EMAIL, PASS, NOME, COG, RUOLO);

        expect(result.id).toBe(UID);
        expect(mockSupabase.auth.admin.createUser).toHaveBeenCalledWith({
            email: EMAIL, password: PASS, email_confirm: true,
            user_metadata: { nome: NOME, cognome: COG, ruolo: RUOLO },
        });
        expect(userRepoMock.save).toHaveBeenCalled();
    });

    it("TC_2.2 – fallisce se Supabase restituisce errore (email già registrata)", async () => {
        mockSupabase.auth.admin.createUser.mockResolvedValue({
            data: { user: null },
            error: { message: "Account già esistente" },
        });

        await expect(service.registraUtente(EMAIL, PASS, NOME, COG, RUOLO))
            .rejects.toThrow("Account già esistente");
    });
});
