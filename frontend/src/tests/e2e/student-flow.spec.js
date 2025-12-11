// frontend/src/tests/e2e/student-flow.spec.js
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Student Core Workflows', () => {
    let studentEmail;
    const studentPass = 'StudentPass123!';

    test.beforeAll(async ({ browser }) => {
        // Create a fresh student account before running tests
        const context = await browser.newContext();
        const page = await context.newPage();
        
        studentEmail = `student.flow.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`;

        await page.goto(`${BASE_URL}/register`);
        await page.fill('#firstName', 'E2E');
        await page.fill('#lastName', 'Student');
        await page.fill('#email', studentEmail);
        await page.selectOption('#role', 'student');
        await page.fill('#password', studentPass);
        await page.fill('#confirmPassword', studentPass);
        await page.click('#registerButton');
        
        // Wait for success message to appear (registration succeeded)
        await expect(page.locator('#registerSuccess')).toBeVisible({ timeout: 5000 });
        
        // Then wait for automatic redirect to login (has 900ms setTimeout)
        await expect(page).toHaveURL(/\/login/, { timeout: 3000 });
        await context.close();
    });

    test.beforeEach(async ({ page }) => {
        // Log in before each test
        await page.goto(`${BASE_URL}/login`);
        await page.fill('#email', studentEmail);
        await page.fill('#password', studentPass);
        await page.click('#loginButton');
        await expect(page).toHaveURL(/\/student/, { timeout: 5000 });
    });

    test('should successfully access student dashboard after login', async ({ page }) => {
        // Already logged in via beforeEach
        await expect(page).toHaveURL(/\/student/);
        
        // Check that we're on a page with typical student dashboard elements
        // Adjust these selectors based on your actual dashboard HTML
        await expect(page.locator('body')).toBeVisible();
    });

    test('should access manual check-in page', async ({ page }) => {
        // Navigate to manual check-in
        await page.goto(`${BASE_URL}/student/manual_checkin`);
        
        // Verify we're on the check-in page
        await expect(page).toHaveURL(/\/student\/manual_checkin/);
        await expect(page.locator('body')).toBeVisible();
    });

    test('should access QR check-in page', async ({ page }) => {
        // Navigate to QR check-in (note: this route doesn't require auth per pageRouter)
        await page.goto(`${BASE_URL}/student/checkin`);
        
        // Verify we're on the check-in page
        await expect(page).toHaveURL(/\/student\/checkin/);
        await expect(page.locator('body')).toBeVisible();
    });

    test('should access student attendance history', async ({ page }) => {
        // Navigate to attendance page
        await page.goto(`${BASE_URL}/student/attendance`);
        
        // Verify we're on the attendance page
        await expect(page).toHaveURL(/\/student\/attendance/);
        await expect(page.locator('body')).toBeVisible();
    });
});