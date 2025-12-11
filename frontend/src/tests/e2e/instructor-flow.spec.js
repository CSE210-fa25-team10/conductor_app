// frontend/src/tests/e2e/instructor-flow.spec.js
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Instructor Core Workflows', () => {
    let instructorEmail;
    const instructorPass = 'ProfPass123!';

    test.beforeAll(async ({ browser }) => {
        // Create a fresh instructor account
        const context = await browser.newContext();
        const page = await context.newPage();
        
        instructorEmail = `prof.flow.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`;

        
        await page.goto(`${BASE_URL}/register`);
        await page.fill('#firstName', 'Professor');
        await page.fill('#lastName', 'E2E');
        await page.fill('#email', instructorEmail);
        await page.selectOption('#role', 'instructor');
        await page.fill('#password', instructorPass);
        await page.fill('#confirmPassword', instructorPass);
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
        await page.fill('#email', instructorEmail);
        await page.fill('#password', instructorPass);
        await page.click('#loginButton');
        await expect(page).toHaveURL(/\/instructor/, { timeout: 5000 });
    });

    test('should successfully access instructor dashboard after login', async ({ page }) => {
        // Already logged in via beforeEach
        await expect(page).toHaveURL(/\/instructor/);
        
        // Verify we're on the instructor dashboard
        await expect(page.locator('body')).toBeVisible();
    });

    test('should access instructor attendance page', async ({ page }) => {
        // Navigate to attendance
        await page.goto(`${BASE_URL}/instructor/attendance`);
        
        // Verify we're on the attendance page
        await expect(page).toHaveURL(/\/instructor\/attendance/);
        await expect(page.locator('body')).toBeVisible();
    });

    test('should access course detail page (with courseId)', async ({ page }) => {
        // Assuming a course with ID 1 exists (you may need to create test data)
        await page.goto(`${BASE_URL}/instructor/courses/1`);
        
        // Verify we're on a course page
        await expect(page).toHaveURL(/\/instructor\/courses\/1/);
        await expect(page.locator('body')).toBeVisible();
    });

    test('should access manual attendance marking page', async ({ page }) => {
        // Navigate to manual attendance for a course
        await page.goto(`${BASE_URL}/instructor/courses/1/manual`);
        
        // Verify we're on the manual attendance page
        await expect(page).toHaveURL(/\/instructor\/courses\/1\/manual/);
        await expect(page.locator('body')).toBeVisible();
    });

    test('should access attendance overview page', async ({ page }) => {
        // Navigate to attendance overview for a course
        await page.goto(`${BASE_URL}/instructor/courses/1/overview`);
        
        // Verify we're on the overview page
        await expect(page).toHaveURL(/\/instructor\/courses\/1\/overview/);
        await expect(page.locator('body')).toBeVisible();
    });
});