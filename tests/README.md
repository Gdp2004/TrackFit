# 🧪 TrackFit – Test Suite

Cartella dedicata a **tutti i test** del progetto, organizzata per tipo come da TPD.

## Struttura

```
tests/
├── unit/                     # Unit test (logica isolata)
│   ├── CoachService.test.ts  # 23 test
│   ├── GymService.test.ts    # 24 test
│   ├── ReportService.test.ts # 9 test
│   ├── TC_2_UserRegistration.test.ts # 3 test
│   ├── TC_5_6_9_WorkoutSession.test.ts # 10 test
│   ├── TC_7_CouponValidation.test.ts # 6 test
│   └── UserService.test.ts   # 14 test
├── integration/              # Integration test (API routes)
│   └── TC_1_2_AuthAPI.test.ts            → TC_1, TC_2: Login & Registrazione
└── e2e/                      # (Step 3) System test con Playwright
```

## Comandi

| Comando | Descrizione |
|---|---|
| `npm test` | Esegui tutti i test |
| `npm run test:watch` | Esegui in modalità watch |
| `npm run test:coverage` | Report copertura codice |
| `npm run test:e2e` | Esegui test end-to-end (Playwright) |

## Test Case coperti (TCS)

| File | Copertura | Tipo | Test |
|---|---|---|---|
| `UserService.test.ts` | TC_2 + tutti i metodi CRUD | Unit | 14 |
| `GymService.test.ts` | TC_3, TC_4 + tutti i metodi CRUD | Unit | 24 |
| `CoachService.test.ts` | TC_6 (coach), Roster + tutti i metodi | Unit | 23 |
| `TC_5_6_9_WorkoutSession.test.ts` | TC_5, TC_6, TC_9 | Unit | 10 |
| `TC_7_CouponValidation.test.ts` | TC_7 | Unit | 6 |
| `ReportService.test.ts` | FR12, FR13, FR14, FR15, FR28 | Unit | 9 |
| `TC_1_2_AuthAPI.test.ts` | TC_1, TC_2 | Integration | 5 |

Totale test passanti: **91** (86 Unit + 5 Integration).

## Note tecniche

- I test usano **Jest + ts-jest** con gli alias `@/`, `@backend/`, `@frontend/`  
- I mock sono **hoistati** prima degli import per evitare side-effect (Stripe, Supabase)  
- Pattern: `mockDeep<InterfaceName>()` da `jest-mock-extended` per i repository
