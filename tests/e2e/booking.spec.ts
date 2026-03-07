import { test, expect } from '@playwright/test';

test.describe('Prenotazione Corsi e Lista d\'attesa (TC_4, TC_5)', () => {
    const timestamp = Date.now();
    const gestoreEmail = `gestore_booking_${timestamp}@trackfit.it`;
    const user1Email = `user1_booking_${timestamp}@trackfit.it`;
    const user2Email = `user2_booking_${timestamp}@trackfit.it`;
    const gymName = `Palestra Booking ${timestamp}`;
    const planName = `Piano Booking ${timestamp}`;
    const courseName = `Crossfit E2E ${timestamp}`;

    test('Flusso completo: creazione corso, prenotazione e lista d\'attesa', async ({ browser }) => {
        test.setTimeout(60000); // 60s for complex multi-user flow
        // 1. SETUP GESTORE: Crea Palestra, Piano e Corso
        const setupContext = await browser.newContext();
        const setupPage = await setupContext.newPage();

        // Registrazione GESTORE
        await setupPage.request.post('/api/auth', {
            data: {
                nome: "Gestore", cognome: "Booking", email: gestoreEmail,
                password: "Password123!", ruolo: "GESTORE", consensoTermini: true
            }
        });

        // Login GESTORE
        await setupPage.goto('/login');
        await setupPage.fill('input#email', gestoreEmail);
        await setupPage.fill('input#password', 'Password123!');
        await setupPage.click('button[type="submit"]');
        await expect(setupPage.locator('h1, h2')).toContainText([/Dashboard/i, /Bentornato/i], { timeout: 20000 });

        // Crea Struttura
        await setupPage.goto('/gyms/struttura');
        await setupPage.locator('button', { hasText: 'Crea Struttura' }).first().click();
        const uniquePiva = timestamp.toString().padStart(11, '0').slice(-11);
        await setupPage.locator('label:has-text("P.IVA * (11 cifre)") + input').fill(uniquePiva);
        await setupPage.locator('label:has-text("CUN *") + input').fill("BK" + timestamp.toString().slice(-5));
        await setupPage.locator('label:has-text("Nome Struttura *") + input').fill(gymName);
        await setupPage.locator('label:has-text("Indirizzo *") + input').fill("Via Test Booking 1, Roma");
        await setupPage.locator('button:has-text("Crea Struttura")').last().click();
        await expect(setupPage.locator('text=Struttura creata con successo!')).toBeVisible({ timeout: 10000 });

        // Crea Piano Abbonamento
        await setupPage.goto('/gyms/tipi-abbonamento');
        await setupPage.fill('input[name="nome"]', planName);
        await setupPage.fill('input[name="duratamesi"]', '1');
        await setupPage.fill('input[name="prezzo"]', '50');
        await setupPage.click('button:has-text("Aggiungi")');
        await expect(setupPage.locator(`text=${planName}`)).toBeVisible();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString();
        const strRes = await setupPage.request.get('/api/gyms?search=');
        const sts = await strRes.json();
        const gym = sts.find((s: any) => s.denominazione === gymName);
        await setupPage.request.post('/api/gyms?action=corso', {
            data: { strutturaid: gym.id, nome: courseName, dataora: dateStr, durata: 60, capacitamassima: 1 }
        });
        await setupPage.goto('/gyms/corsi');
        await expect(setupPage.locator('tbody tr').filter({ hasText: courseName })).toBeVisible({ timeout: 15000 });
        await setupContext.close();

        // 2. USER 1: Acquisto e Prenotazione (Posto 1)
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();

        await page1.request.post('/api/auth', {
            data: { nome: "User1", cognome: "Test", email: user1Email, password: "Password123!", ruolo: "UTENTE", consensoTermini: true }
        });

        await page1.goto('/login');
        await page1.fill('input#email', user1Email);
        await page1.fill('input#password', 'Password123!');
        await page1.click('button[type="submit"]');

        // Acquisto abbonamento
        await page1.goto('/subscription');
        await page1.click(`h2:has-text("${gymName}")`);
        await page1.click('button:has-text("Seleziona")');
        await page1.click('button:has-text("Paga")');
        // Nota: Il pagamento è mockato o bypassato per semplicità se non completiamo Stripe, 
        // ma qui assumiamo che il db venga aggiornato o il tasto porti a successo.

        // Prenotazione Corso
        await page1.goto('/gyms');
        await page1.click('button:has-text("▼ Corsi")');
        await page1.click('button:has-text("Prenota")');
        await expect(page1.locator('text=Prenotazione confermata!')).toBeVisible();

        // 3. USER 2: Acquisto e Lista d'attesa (Posto 2 -> Pieno)
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();

        await page2.request.post('/api/auth', {
            data: { nome: "User2", cognome: "Test", email: user2Email, password: "Password123!", ruolo: "UTENTE", consensoTermini: true }
        });

        await page2.goto('/login');
        await page2.fill('input#email', user2Email);
        await page2.fill('input#password', 'Password123!');
        await page2.click('button[type="submit"]');

        // Acquisto abbonamento
        await page2.goto('/subscription');
        await page2.click(`h2:has-text("${gymName}")`);
        await page2.click('button:has-text("Seleziona")');
        await page2.click('button:has-text("Paga")');

        // Tentativo Prenotazione (dovrebbe andare in lista d'attesa)
        await page2.goto('/gyms');
        await page2.click('button:has-text("▼ Corsi")');

        // Verifichiamo che il pulsante dica "Lista attesa"
        const waitlistBtn = page2.locator('button:has-text("Lista attesa")');
        await expect(waitlistBtn).toBeVisible();

        // Gestione alert/dialog per la lista d'attesa
        page2.on('dialog', async dialog => {
            expect(dialog.message()).toContain("lista d'attesa");
            await dialog.accept();
        });

        await waitlistBtn.click();

        await context1.close();
        await context2.close();
    });
});
