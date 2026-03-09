# 🧪 TrackFit – Test Suite

Questa cartella raccoglie **tutti i test** del progetto, organizzati per tipologia secondo il TPD (Test Plan Document).

---

## Struttura

```
tests/
├── unit/                                    # Unit test – logica isolata
│   ├── CoachCancellation.test.ts            # Cancellazione prenotazioni coach
│   ├── CoachService.test.ts                 # 23 test – servizio coach
│   ├── GymService.test.ts                   # 24 test – servizio palestra
│   ├── ReportService.test.ts                # 9 test – generazione report
│   ├── TC_2_UserRegistration.test.ts        # 3 test – registrazione utente
│   ├── TC_5_6_9_WorkoutSession.test.ts      # 10 test – sessioni allenamento
│   ├── TC_7_CouponValidation.test.ts        # 6 test – validazione coupon
│   └── UserService.test.ts                  # 14 test – servizio utente
│
├── integration/                             # Integration test – API routes
│   └── TC_1_2_AuthAPI.test.ts               # TC_1, TC_2: Login & Registrazione
│
└── e2e/                                     # System test – browser automation
    ├── auth.spec.ts                         # Flusso di autenticazione
    ├── booking.spec.ts                      # Prenotazione corsi
    ├── purchase.spec.ts                     # Flusso acquisto abbonamento
    └── test_course_creation.spec.ts         # Creazione corso da parte del coach
```

---

## Comandi

| Comando                    | Descrizione                                   |
|:---------------------------|:----------------------------------------------|
| `npm test`                 | Esegui tutti i test unit + integration (Jest) |
| `npm run test:watch`       | Esegui in modalità watch (ricarica automatica)|
| `npm run test:coverage`    | Genera il report di copertura del codice      |
| `npm run test:e2e`         | Esegui i test end-to-end con Playwright       |

---

## Copertura dei Test Case (TCS)

| File di test                          | Test Case coperti                          | Tipo        | # Test |
|:--------------------------------------|:-------------------------------------------|:------------|:------:|
| `UserService.test.ts`                 | TC_2 + CRUD utente completo                | Unit        | 14     |
| `GymService.test.ts`                  | TC_3, TC_4 + CRUD palestra completo        | Unit        | 24     |
| `CoachService.test.ts`                | TC_6, roster, tutti i metodi               | Unit        | 23     |
| `CoachCancellation.test.ts`           | Cancellazione prenotazioni coach           | Unit        | –      |
| `TC_5_6_9_WorkoutSession.test.ts`     | TC_5, TC_6, TC_9                           | Unit        | 10     |
| `TC_7_CouponValidation.test.ts`       | TC_7 – validazione coupon sconto           | Unit        | 6      |
| `ReportService.test.ts`               | FR12, FR13, FR14, FR15, FR28               | Unit        | 9      |
| `TC_1_2_AuthAPI.test.ts`              | TC_1 (Login), TC_2 (Registrazione)         | Integration | 5      |
| `auth.spec.ts`                        | Flusso autenticazione E2E                  | E2E         | –      |
| `booking.spec.ts`                     | Prenotazione corsi E2E                     | E2E         | –      |
| `purchase.spec.ts`                    | Acquisto abbonamento E2E                   | E2E         | –      |
| `test_course_creation.spec.ts`        | Creazione corso E2E                        | E2E         | –      |

**✅ Totale test passanti: 91** (86 Unit + 5 Integration)

---

## Note tecniche

- I test utilizzano **Jest** con **ts-jest** e supportano gli alias `@/`, `@backend/`, `@frontend/`
- I mock sono **hoistati** prima degli import tramite `jest.mock()` per evitare side-effect (Stripe, Supabase)
- Pattern di mocking: `mockDeep<InterfaceName>()` da `jest-mock-extended` per i repository
- I test E2E usano **Playwright** con la configurazione in `playwright.config.ts` nella root del progetto
- I report di copertura vengono generati nella cartella `coverage/` (ignorata da git)
