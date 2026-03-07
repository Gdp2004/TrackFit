import { CreateUserManagerService } from "./CreateUserManagerService";
import { UserRepositoryPort } from "@/backend/domain/port/out/UserRepositoryPort";
import { RuoloEnum } from "@/backend/domain/model/enums";
import { mockDeep, mockReset } from "jest-mock-extended";
import { createSupabaseServerClient } from "@/backend/infrastructure/config/supabase";

// Mock del client Supabase
jest.mock("@/backend/infrastructure/config/supabase", () => ({
    createSupabaseServerClient: jest.fn(),
}));

describe("CreateUserManagerService (Unit Test)", () => {
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

    beforeEach(() => {
        mockReset(userRepoMock);
        service = new CreateUserManagerService(userRepoMock);
        (createSupabaseServerClient as jest.Mock).mockReturnValue(mockSupabase);
        jest.clearAllMocks();
    });

    describe("registraUtente (TC_2)", () => {
        const mockEmail = "test@example.com";
        const mockPass = "Password123!";
        const mockNome = "Mario";
        const mockCognome = "Rossi";
        const mockRuolo = RuoloEnum.UTENTE;

        it("TC_2.4: fallisce se il nome è vuoto", async () => {
            await expect(service.registraUtente(mockEmail, mockPass, "", mockCognome, mockRuolo))
                .rejects.toThrow("Tutti i campi sono obbligatori.");
        });

        it("TC_2.6: registra l'utente correttamente se tutti i dati sono validi", async () => {
            const mockUserId = "uuid-123";

            // Setup mock Supabase
            mockSupabase.auth.admin.createUser.mockResolvedValue({
                data: { user: { id: mockUserId } },
                error: null,
            });

            // Setup mock Repo
            userRepoMock.findById.mockResolvedValue(null);
            userRepoMock.save.mockResolvedValue({
                id: mockUserId,
                email: mockEmail,
                nome: mockNome,
                cognome: mockCognome,
                ruolo: mockRuolo,
                createdat: new Date().toISOString(),
            });

            const result = await service.registraUtente(mockEmail, mockPass, mockNome, mockCognome, mockRuolo);

            expect(result.id).toBe(mockUserId);
            expect(mockSupabase.auth.admin.createUser).toHaveBeenCalledWith({
                email: mockEmail,
                password: mockPass,
                email_confirm: true,
                user_metadata: { nome: mockNome, cognome: mockCognome, ruolo: mockRuolo },
            });
            expect(userRepoMock.save).toHaveBeenCalled();
        });

        it("TC_2.2: fallisce se Supabase restituisce un errore (es. email già registrata)", async () => {
            mockSupabase.auth.admin.createUser.mockResolvedValue({
                data: { user: null },
                error: { message: "Account già esistente" },
            });

            await expect(service.registraUtente(mockEmail, mockPass, mockNome, mockCognome, mockRuolo))
                .rejects.toThrow("Account già esistente");
        });
    });
});
