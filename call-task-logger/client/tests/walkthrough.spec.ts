import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts');

test.describe('End-to-End User Journey', () => {
    test.beforeAll(async () => {
        if (!fs.existsSync(ARTIFACTS_DIR)) {
            fs.mkdirSync(ARTIFACTS_DIR);
        }
    });

    test('Full walkthrough: Login -> Create Task -> Verify -> Delete Task', async ({ page, context }) => {
        // Force no-cache headers to bypass Service Worker or cache
        await context.setExtraHTTPHeaders({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        // 1. Unregister Service Workers & Clear State
        console.log('Navigating to home to clean up SW...');
        await page.goto('http://localhost:5173');

        await page.evaluate(async () => {
            if (window.navigator.serviceWorker) {
                const registrations = await window.navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    console.log('Unregistering SW:', registration);
                    await registration.unregister();
                }
            }
            localStorage.clear();
        });
        await context.clearCookies();

        // 2. Reload to ensure clean state
        console.log('Reloading after cleanup...');
        await page.reload();
        await page.waitForLoadState('networkidle');

        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'home.png') });

        // 3. Setup Listeners
        const consoleLogs = [];
        page.on('console', msg => {
            if (msg.type() === 'error') console.error(`CONSOLE ERROR: "${msg.text()}"`);
            else console.log(`CONSOLE: "${msg.text()}"`);
            consoleLogs.push(msg.text());
        });

        const failedRequests = [];
        page.on('requestfailed', request => {
            console.error(`FAILED REQUEST: ${request.url()} - ${request.failure()?.errorText}`);
            failedRequests.push(request.url());
        });

        page.on('pageerror', exception => {
            console.error(`PAGE ERROR: ${exception}`);
        });

        // Handle dialogs (confirmations)
        page.on('dialog', async dialog => {
            console.log(`Dialog message: ${dialog.message()}`);
            await dialog.accept();
        });

        // 4. Authenticate via Demo Login
        console.log('Authenticating via demo-login...');
        await page.goto('http://localhost:4000/api/auth/demo-login');
        await page.waitForURL('http://localhost:5173/');
        await page.waitForLoadState('networkidle');

        // 5. Verify Authenticated State
        const cookies = await page.context().cookies();

        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'post-login.png') });
        console.log(`Current URL: ${page.url()}`);
        console.log(`Page Title: ${await page.title()}`);

        // Retry loop for auth check (handling race conditions)
        await expect(async () => {
            const newTaskBtn = page.getByRole('button', { name: /New Task/i }).first();
            const exportBtn = page.getByRole('button', { name: /Export CSV/i }).first();

            const isAuth = (await newTaskBtn.isVisible()) || (await exportBtn.isVisible());
            expect(isAuth).toBeTruthy();
        }).toPass({ timeout: 10000 });

        console.log('Authentication confirmed!');
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'authed.png') });

        // Generate unique task title
        const taskTitle = `UI Walkthrough Task ${Date.now()}`;

        // 6. Create Task
        console.log(`Creating task: ${taskTitle}...`);
        const newTaskBtn = page.getByRole('button', { name: /New Task/i }).first();
        if (await newTaskBtn.count() > 0 && await newTaskBtn.isVisible()) {
            await newTaskBtn.click();
        }

        // Wait for modal
        await expect(page.getByText('Log New Task')).toBeVisible();

        // Fill form
        await page.locator('input[name="fromName"]').fill(taskTitle);
        await page.locator('textarea[name="description"]').fill('Created via Playwright');

        await page.getByRole('button', { name: /Create Task/i }).click();

        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task-created.png') });

        // 7. Verify Task Appears
        console.log('Verifying task in list...');
        // Use exact text match for unique title
        await expect(page.getByText(taskTitle)).toBeVisible();

        // 8. Delete Task
        console.log('Deleting task...');
        const taskCard = page.locator('div').filter({ hasText: taskTitle }).first();
        const deleteBtn = taskCard.getByRole('button', { name: /Delete|Remove/i }).first();

        if (await deleteBtn.count() > 0) {
            await deleteBtn.click();
        } else {
            // Fallback for icon-only buttons
            await taskCard.locator('button').last().click();
        }

        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task-deleted.png') });

        // 9. Verify Task Disappears
        await expect(page.getByText(taskTitle)).not.toBeVisible();

        console.log('Walkthrough Complete!');
    });
});
