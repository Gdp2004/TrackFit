import { test, expect } from '@playwright/test';

test.describe('Autenticazione E2E (TC_1, TC_2)', () => {
    // Generiamo un'email univoca per evitare collisioni ad ogni run
    const timestamp = Date.now();
    const testEmail = `utente-e2e-${timestamp}@trackfit.lan`;
    const testPassword = 'Password123!';
    const testNome = 'Edoardo';
    const testCognome = 'TestE2E';

    test('Flusso Registrazione -> Login -> Dashboard', async ({ page }) => {
        // ==========================================
        // 1. REGISTRAZIONE (TC_2)
        // ==========================================
        await page.goto('/register');

        // Aspettiamo che la pagina sia caricata
        await expect(page.locator('h2', { hasText: 'Crea il tuo account' })).toBeVisible();

        // Compilazione del form
        await page.fill('input#nome', testNome);
        await page.fill('input#cognome', testCognome);
        await page.fill('input#email', testEmail);
        await page.fill('input#password', testPassword);

        // Click sul bottone Submit
        await page.click('button[type="submit"]');

        // ==========================================
        // 2. REINDIRIZZAMENTO E LOGIN (TC_1)
        // ==========================================
        // Verifichiamo il reindirizzamento corretto con il parametro querystring
        await page.waitForURL(/.*\/login\?registered=1/);

        // Verifica della notifica toast/banner di successo
        await expect(page.locator('text=Registrazione avvenuta con successo!')).toBeVisible();

        // Il form dovrebbe essere vuoto, procediamo al login
        await page.fill('input#email', testEmail);
        await page.fill('input#password', testPassword);

        // Click sul bottone di accesso
        await page.click('button[type="submit"]');

        // ==========================================
        // 3. ACCESSO ALLA DASHBOARD
        // ==========================================
        // Verifichiamo che l'utente atterri sulla dashboard
        await page.waitForURL(/.*\/dashboard/);

        // Verifica che il messaggio di benvenuto includa il nome registrato
        await expect(page.locator(`h1`, { hasText: `Ciao, ${testNome}!` })).toBeVisible();

        // Verifica presenza statistiche (carte contatori)
        await expect(page.locator('text=Km percorsi')).toBeVisible();
        await expect(page.locator('text=Sessioni completate')).toBeVisible();
    });
});
