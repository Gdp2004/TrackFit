/**
 * Unit Test – CreateSubscriptionManagerService
 * TC_7: Validazione Coupon – scadenza, unicità, vincoli piano, sconto %
 */
import { CreateSubscriptionManagerService } from "@/backend/application/service/subscription/CreateSubscriptionManagerService";
import { mockDeep, mockReset } from "jest-mock-extended";
import { SubscriptionRepositoryPort } from "@/backend/domain/port/out/SubscriptionRepositoryPort";
import { PaymentGatewayPort } from "@/backend/domain/port/out/PaymentGatewayPort";
import { PaymentRepositoryPort } from "@/backend/domain/port/out/PaymentRepositoryPort";
import { CouponRepositoryPort } from "@/backend/domain/port/out/CouponRepositoryPort";
import { AuditLogRepositoryPort } from "@/backend/domain/port/out/AuditLogRepositoryPort";
import { StatoPagamentoEnum, StatoAbbonamentoEnum } from "@/backend/domain/model/enums";

describe("CreateSubscriptionManagerService – Coupon (TC_7)", () => {
    const subRepo = mockDeep<SubscriptionRepositoryPort>();
    const paymentGateway = mockDeep<PaymentGatewayPort>();
    const paymentRepo = mockDeep<PaymentRepositoryPort>();
    const couponRepo = mockDeep<CouponRepositoryPort>();
    const auditRepo = mockDeep<AuditLogRepositoryPort>();
    let service: CreateSubscriptionManagerService;

    const TIPO = { id: "tipo-1", strutturaid: "gym-1", nome: "Piano Base", prezzo: 100, duratamesi: 1 };

    const COUPON = {
        id: "coupon-1", codice: "PROMO10", percentualesconto: 10,
        scadenza: new Date(Date.now() + 86400000 * 30).toISOString(),
        monouso: false, tipoabbonamentoid: null,
    };

    const PAYMENT = {
        id: "pay-1", userid: "u1", abbonamentoid: undefined,
        importo: 90, valuta: "eur", stato: StatoPagamentoEnum.IN_ATTESA,
        stripepaymentintentid: "pi_test", createdat: new Date().toISOString(),
    };

    const ABBON = {
        id: "sub-1", userid: "u1", tipoid: "tipo-1", strutturaid: "gym-1",
        stato: StatoAbbonamentoEnum.ATTIVO,
        datainizio: new Date().toISOString(), datafine: new Date().toISOString(),
        rinnovoautomatico: false, pagamentoid: "pay-1", qrcode: "some-uuid",
    };

    beforeEach(() => {
        mockReset(subRepo); mockReset(paymentGateway);
        mockReset(paymentRepo); mockReset(couponRepo); mockReset(auditRepo);
        service = new CreateSubscriptionManagerService(subRepo, paymentGateway, paymentRepo, couponRepo, auditRepo);
    });

    it("TC_7.1 – coupon inesistente → errore", async () => {
        subRepo.findTipoById.mockResolvedValue(TIPO as any);
        couponRepo.findByCodice.mockResolvedValue(null);
        await expect(service.acquistaAbbonamento("u1", "tipo-1", "INVALID"))
            .rejects.toThrow("Coupon non valido o inesistente.");
    });

    it("TC_7.2 – coupon scaduto → errore", async () => {
        subRepo.findTipoById.mockResolvedValue(TIPO as any);
        couponRepo.findByCodice.mockResolvedValue({
            ...COUPON, scadenza: new Date(Date.now() - 86400000).toISOString(),
        } as any);
        await expect(service.acquistaAbbonamento("u1", "tipo-1", "PROMO10"))
            .rejects.toThrow("Coupon scaduto.");
    });

    it("TC_7.3 – coupon non valido per questo piano → errore", async () => {
        subRepo.findTipoById.mockResolvedValue(TIPO as any);
        couponRepo.findByCodice.mockResolvedValue({ ...COUPON, tipoabbonamentoid: "tipo-ALTRO" } as any);
        await expect(service.acquistaAbbonamento("u1", "tipo-1", "PROMO10"))
            .rejects.toThrow("R4: Coupon non valido per questo tipo di abbonamento.");
    });

    it("TC_7.4 – coupon già usato → errore", async () => {
        subRepo.findTipoById.mockResolvedValue(TIPO as any);
        couponRepo.findByCodice.mockResolvedValue({ ...COUPON, monouso: true } as any);
        couponRepo.redeemCoupon.mockResolvedValue(false);
        await expect(service.acquistaAbbonamento("u1", "tipo-1", "PROMO10"))
            .rejects.toThrow("R4: Il coupon è già stato utilizzato o non puoi riutilizzarlo.");
    });

    it("TC_7.5 – coupon valido al 10% → importo scontato = 90", async () => {
        subRepo.findTipoById.mockResolvedValue(TIPO as any);
        couponRepo.findByCodice.mockResolvedValue(COUPON as any);
        couponRepo.redeemCoupon.mockResolvedValue(true);
        auditRepo.registra.mockResolvedValue(undefined);
        paymentGateway.creaIntentPagamento.mockResolvedValue({ id: "pi_test", clientSecret: "s" });
        paymentRepo.save.mockResolvedValue(PAYMENT as any);
        subRepo.save.mockResolvedValue(ABBON as any);
        paymentRepo.update.mockResolvedValue({ ...PAYMENT, abbonamentoid: "sub-1" } as any);

        await service.acquistaAbbonamento("u1", "tipo-1", "PROMO10");

        expect(paymentGateway.creaIntentPagamento).toHaveBeenCalledWith(90, "eur", { userid: "u1", tipoid: "tipo-1" });
        expect(auditRepo.registra).toHaveBeenCalledWith(expect.objectContaining({ azione: "USO_COUPON" }));
    });

    it("TC_7.6 – tipo abbonamento non trovato → errore", async () => {
        subRepo.findTipoById.mockResolvedValue(null);
        await expect(service.acquistaAbbonamento("u1", "tipo-INESISTENTE"))
            .rejects.toThrow("Tipo di abbonamento non valido o inesistente.");
    });
});
