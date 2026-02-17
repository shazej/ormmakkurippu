import { test, expect } from '@playwright/test';
import path from 'path';

test('E2E Walkthrough - Call Task Logger', async ({ page }) => {
    const criticalConsoleErrors: string[] = [];
    const networkFailures: string[] = [];

    // --- Setup Logging ---
    page.on('console', msg => {
        const text = msg.text();
        const type = msg.type();

        if (type === 'error') {
            const allowList = [
                'favicon.ico',
                '.map',
                '[HMR]',
            ];
            const isAllowed = allowList.some(item => text.includes(item));

            if (!isAllowed) {
                console.error(`CRITICAL PAGE ERROR: ${text}`);
                criticalConsoleErrors.push(text);
            } else {
                console.log(`[IGNORED-ERROR] ${text}`);
            }
        } else {
            console.log(`[${type}] ${text}`);
        }
    });

    page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/auth/demo-login') || url.includes('/api/tasks')) {
            const status = response.status();
            const log = `<< ${status} ${url}`;
            console.log(log);

            if (status >= 400) {
                const errorMsg = `NETWORK FAILURE: ${status} ${url}`;
                console.error(errorMsg);
                networkFailures.push(errorMsg);
            }
        }
    });

    page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/auth/demo-login') || url.includes('/api/tasks')) {
            console.log(`>> ${request.method()} ${url}`);
        }
    });

    // Handle Dialogs (Confirm delete)
    page.on('dialog', async dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        await dialog.accept();
    });

    // --- Step 1: Go to Home ---
    console.log('Step 1: Navigating to Home');
    await page.goto('http://localhost:5173');
    // Ensure artifacts directory exists in client/artifacts
    const artifactsDir = path.join(process.cwd(), 'artifacts');
    await page.screenshot({ path: path.join(artifactsDir, '01-home.png') });

    // --- Step 2: Authenticate ---
    console.log('Step 2: Authenticating (Demo Cookie)');
    // Start backend demo session
    await page.goto('http://localhost:5173/api/auth/demo-login');
    await page.goto('http://localhost:5173');

    // --- Step 3: Wait for Authenticated UI ---
    console.log('Step 3: Waiting for Authenticated UI');
    // Verify "New Task" button is visible
    await expect(page.getByRole('button', { name: 'New Task' })).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(artifactsDir, '02-after-login.png') });

    // --- Step 4: Create Task ---
    const taskDescription = `E2E Task ${Date.now()}`;
    console.log(`Step 4: Creating Task "${taskDescription}"`);

    await page.getByRole('button', { name: 'New Task' }).click();

    // Wait for modal
    await expect(page.getByText('Log New Task', { exact: true })).toBeVisible({ timeout: 5000 });

    // Fill Form
    await page.locator('input[name="fromName"]').fill('E2E Tester');
    await page.locator('textarea[name="description"]').fill(taskDescription);

    // Submit
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Verify task appears in list
    await expect(page.getByText(taskDescription)).toBeVisible();
    await page.screenshot({ path: path.join(artifactsDir, '03-task-created.png') });

    // --- Step 5: Delete Task ---
    console.log('Step 5: Deleting Task');

    // Find the task card
    // We look for a container that has the text.
    // The TaskList renders divs. We need to find the specific card.
    // Locator strategy: Find the card by text, then find the Delete button INSIDE it.
    const taskCard = page.locator('div.bg-white').filter({ hasText: taskDescription }).first();

    // Verify card is visible to be sure
    await expect(taskCard).toBeVisible();

    // Click Delete (Trash icon / "Delete")
    // The button has "Delete" text (or "Delete Forever")
    await taskCard.getByRole('button', { name: 'Delete' }).click();

    // Dialog is handled automatically by page.on('dialog')

    // Verify task gone
    await expect(page.getByText(taskDescription)).not.toBeVisible();
    await page.screenshot({ path: path.join(artifactsDir, '04-task-deleted.png') });

    console.log('--- Test Flow Complete ---');

    // Final Strict Assertions
    expect(criticalConsoleErrors, `Critical Console Errors: ${criticalConsoleErrors.join('\n')}`).toHaveLength(0);
    expect(networkFailures, `Network Failures: ${networkFailures.join('\n')}`).toHaveLength(0);

    console.log('--- Strict QA Checks Passed ---');
});
