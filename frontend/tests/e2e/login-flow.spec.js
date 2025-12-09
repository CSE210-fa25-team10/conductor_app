// frontend/tests/e2e/login-flow.spec.js
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('E2E Login and Navigation Flow', () => {

    test('should navigate from Sign In to Register and submit a valid registration form', async ({ page }) => {
        // Visit Login Page
        await page.goto(`${BASE_URL}/src/pages/auth/login.html`);
        
        // Click "Sign Up" link
        await page.click('#headerRegister'); // Assuming this ID exists based on your logic
        await expect(page).toHaveURL(/register.html/);

        // Fill out Registration Form
        await page.click('button[data-role="student"]'); // Assuming buttons use data-role
        await page.fill('#registerName', 'Test Student');
        await page.fill('#registerEmail', `e2e.student.${Date.now()}@test.com`); // Unique email
        await page.fill('#registerPassword', 'TestPass123!');
        await page.fill('#registerConfirm', 'TestPass123!');

        // Submit
        await page.click('#registerForm button[type="submit"]');

        // Check redirection back to login or dashboard (adjust based on actual app flow)
        await expect(page).toHaveURL(/login.html/);
    });

    test('should successfully log in and navigate to the dashboard', async ({ page }) => {
        // 1. Register a user first (to ensure user exists)
        await page.goto(`${BASE_URL}/src/pages/auth/register.html`);
        const testEmail = `login.test.${Date.now()}@test.com`;
        const testPass = 'LoginPass123!';
        
        await page.click('button[data-role="student"]');
        await page.fill('#registerName', 'Login Test User');
        await page.fill('#registerEmail', testEmail);
        await page.fill('#registerPassword', testPass);
        await page.fill('#registerConfirm', testPass);
        await page.click('#registerForm button[type="submit"]');
        
        // 2. Perform Login
        await page.goto(`${BASE_URL}/src/pages/auth/login.html`);
        await page.fill('#loginEmail', testEmail);
        await page.fill('#loginPassword', testPass);
        await page.click('#loginForm button[type="submit"]');

        // 3. Verify Dashboard Access
        await expect(page).toHaveURL(/dashboard.html/);
        await expect(page.locator('h1')).toContainText(/Welcome/i);
    });

    test('should successfully navigate from dashboard to an individual course page', async ({ page }) => {
        // 1. Setup Session (Register & Login)
        await page.goto(`${BASE_URL}/src/pages/auth/register.html`);
        const email = `nav.test.${Date.now()}@test.com`;
        const pass = 'NavPass123!';
        
        // Quick register
        await page.click('button[data-role="student"]');
        await page.fill('#registerName', 'Nav User');
        await page.fill('#registerEmail', email);
        await page.fill('#registerPassword', pass);
        await page.fill('#registerConfirm', pass);
        await page.click('#registerForm button[type="submit"]');

        // Quick login
        await page.goto(`${BASE_URL}/src/pages/auth/login.html`);
        await page.fill('#loginEmail', email);
        await page.fill('#loginPassword', pass);
        await page.click('#loginForm button[type="submit"]');
        await expect(page).toHaveURL(/dashboard.html/);

        // 2. Test Navigation
        // Ensure there is at least one course item or a link to courses
        // This selector might need adjustment based on your actual HTML structure
        const courseLink = page.locator('.course-card').first(); 
        
        if (await courseLink.isVisible()) {
            await courseLink.click();
            await expect(page).toHaveURL(/courses.html/);
        } else {
            console.log('No courses found to test navigation - verify seed data');
        }
    });
});