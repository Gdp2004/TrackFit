import { test, expect } from '@playwright/test';

test('Diagnostica Creazione Corso', async ({ page }) => {
    const timestamp = Date.now();
    const email = `diag_${timestamp}@trackfit.it`;
    const gymName = `Diag Gym ${timestamp}`;
    const courseName = `Diag Course ${timestamp}`;

    // 1. Registrazione e Login
    await page.request.post('/api/auth', {
        data: { nome: "Diag", cognome: "Test", email, password: "Password123!", ruolo: "GESTORE", consensoTermini: true }
    });

    await page.goto('/login');
    await page.fill('input#email', email);
    await page.fill('input#password', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/gym\/dashboard/);

    // 2. Crea Palestra
    await page.goto('/gyms/struttura');
    await page.click('button:has-text("Crea Struttura")');
    const piva = timestamp.toString().padStart(11, '0').slice(-11);
    await page.locator('label:has-text("P.IVA") + input').fill(piva);
    await page.locator('label:has-text("CUN") + input').fill("DI" + timestamp.toString().slice(-5));
    await page.locator('label:has-text("Nome Struttura") + input').fill(gymName);
    await page.locator('label:has-text("Indirizzo") + input').fill("Via Diag 1");
    await page.click('form button:has-text("Crea Struttura")');
    await expect(page.locator('text=Struttura creata con successo!')).toBeVisible();

    // 3. Crea Corso
    await page.goto('/gyms/corsi');
    await expect(page.locator(`text=${gymName}`)).toBeVisible();

    await page.click('button:has-text("+ Nuovo Corso")');
    await page.locator('label:has-text("Nome Corso") + input').fill(courseName);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[type="datetime-local"]', tomorrow.toISOString().slice(0, 16));

    await page.locator('label:has-text("Durata") + input').fill('60');
    await page.locator('label:has-text("Max partecipanti") + input').fill('10');

    console.log("Sottomissione form corso...");
    await page.click('form button:has-text("Crea Corso")');

    // Attendiamo che il modal sparisca o che il corso appaia
    await expect(page.locator('h2:has-text("+ Nuovo Corso")')).not.toBeVisible();
    await expect(page.locator('tbody tr').filter({ hasText: courseName })).toBeVisible({ timeout: 15000 });
});
