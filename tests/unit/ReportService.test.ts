/**
 * Unit Test – CreateReportManagerService
 * Covers: generaReportUtente, generaReportCoach, generaReportGestore,
 *         generaReportAdmin, exportCSV
 */
import { CreateReportManagerService } from "@/backend/application/service/report/CreateReportManagerService";
import { mockDeep, mockReset } from "jest-mock-extended";
import { ReportRepositoryPort } from "@/backend/domain/port/out/ReportRepositoryPort";
import { UserRepositoryPort } from "@/backend/domain/port/out/UserRepositoryPort";
import { Report } from "@/backend/domain/model/types";

const NOW = new Date().toISOString();

const makeReport = (overrides: Partial<Report> = {}): Report => ({
    id: "r1", userid: "u1", periodo: "30", tipo: "UTENTE",
    distanzatotale: 0, tempototaleminuti: 0, ritmomedio: 0,
    formato: "PDF", generatoat: NOW, ...overrides,
});

describe("CreateReportManagerService – All Methods", () => {
    const reportRepo = mockDeep<ReportRepositoryPort>();
    const userRepo = mockDeep<UserRepositoryPort>();
    let service: CreateReportManagerService;

    beforeEach(() => {
        mockReset(reportRepo);
        mockReset(userRepo);
        service = new CreateReportManagerService(reportRepo, userRepo);
    });

    // ── generaReportUtente ────────────────────────────────────────────────────
    describe("generaReportUtente", () => {
        it("salva e restituisce un report di tipo UTENTE", async () => {
            const r = makeReport({ tipo: "UTENTE" });
            reportRepo.save.mockResolvedValue(r);

            const result = await service.generaReportUtente("u1", "30", "UTENTE");

            expect(reportRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                userid: "u1", periodo: "30", tipo: "UTENTE", formato: "PDF",
            }));
            expect(result.tipo).toBe("UTENTE");
        });

        it("include generatoat nell'oggetto salvato", async () => {
            reportRepo.save.mockResolvedValue(makeReport());
            await service.generaReportUtente("u1", "7", "UTENTE");
            const call = reportRepo.save.mock.calls[0][0];
            expect(call.generatoat).toBeDefined();
        });
    });

    // ── generaReportCoach ─────────────────────────────────────────────────────
    describe("generaReportCoach", () => {
        it("conta gli atleti del coach e salva il report", async () => {
            userRepo.findByCoachId.mockResolvedValue([
                { id: "a1" } as any, { id: "a2" } as any,
            ]);
            const r = makeReport({ tipo: "COACH", utentiSeguiti: 2 });
            reportRepo.save.mockResolvedValue(r);

            const result = await service.generaReportCoach("c1", "30");

            expect(userRepo.findByCoachId).toHaveBeenCalledWith("c1");
            expect(reportRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                tipo: "COACH", utentiSeguiti: 2,
            }));
            expect(result.tipo).toBe("COACH");
        });

        it("report con 0 atleti → utentiSeguiti = 0", async () => {
            userRepo.findByCoachId.mockResolvedValue([]);
            reportRepo.save.mockResolvedValue(makeReport({ tipo: "COACH", utentiSeguiti: 0 }));

            await service.generaReportCoach("c1", "30");
            expect(reportRepo.save).toHaveBeenCalledWith(expect.objectContaining({ utentiSeguiti: 0 }));
        });
    });

    // ── generaReportGestore ───────────────────────────────────────────────────
    describe("generaReportGestore", () => {
        it("salva report di tipo GESTORE con strutturaid", async () => {
            const r = makeReport({ tipo: "GESTORE", strutturaid: "gym-1" });
            reportRepo.save.mockResolvedValue(r);

            const result = await service.generaReportGestore("gym-1", "30");

            expect(reportRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                strutturaid: "gym-1", tipo: "GESTORE", formato: "CSV",
            }));
            expect(result.tipo).toBe("GESTORE");
        });
    });

    // ── generaReportAdmin ─────────────────────────────────────────────────────
    describe("generaReportAdmin", () => {
        it("conta tutti gli utenti e salva report ADMIN", async () => {
            userRepo.countAll.mockResolvedValue(42);
            const r = makeReport({ tipo: "ADMIN", totaleUtenti: 42 });
            reportRepo.save.mockResolvedValue(r);

            const result = await service.generaReportAdmin("30");

            expect(userRepo.countAll).toHaveBeenCalled();
            expect(reportRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                tipo: "ADMIN", totaleUtenti: 42,
            }));
            expect(result.totaleUtenti).toBe(42);
        });
    });

    // ── exportCSV ─────────────────────────────────────────────────────────────
    describe("exportCSV", () => {
        it("genera CSV con headers e values su due righe", () => {
            const r = makeReport({ id: "r1", userid: "u1" });
            const csv = service.exportCSV(r);

            const [header, values] = csv.split("\n");
            expect(header).toContain("id");
            expect(header).toContain("userid");
            expect(values).toContain("r1");
            expect(values).toContain("u1");
        });

        it("gestisce campi null/undefined come stringa vuota", () => {
            const r = makeReport({ ritmomedio: undefined } as any);
            const csv = service.exportCSV(r);
            // non deve contenere "undefined" come stringa
            expect(csv).not.toContain("undefined");
        });

        it("CSV ha esattamente 2 righe (header + valori)", () => {
            const r = makeReport();
            const csv = service.exportCSV(r);
            const lines = csv.split("\n");
            expect(lines).toHaveLength(2);
        });
    });
});
