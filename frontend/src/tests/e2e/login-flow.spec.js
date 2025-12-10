// frontend/src/tests/e2e/login-flow.spec.js
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('E2E Login and Navigation Flow', () => {

    test('should navigate from login to register page', async ({ page }) => {
        // Visit Login Page
        await page.goto(`${BASE_URL}/login`);
        
        // Click "Create one" link to go to register
        await page.click('a[href="/register"]');
        await expect(page).toHaveURL(/\/register/);
        
        // Verify we're on the registration page
        await expect(page.locator('.auth-title')).toContainText(/Create your account/i);
    });

    test('should successfully register a new account', async ({ page }) => {
        await page.goto(`${BASE_URL}/register`);
        
        // Generate unique email
        const testEmail = `e2e.test.${Date.now()}@example.com`;
        const testPass = 'TestPass123!';
        
        // Fill out Registration Form
        await page.fill('#firstName', 'Test');
        await page.fill('#lastName', 'User');
        await page.fill('#email', testEmail);
        await page.selectOption('#role', 'student');
        await page.fill('#password', testPass);
        await page.fill('#confirmPassword', testPass);
        
        // Submit
        await page.click('#registerButton');
        
        // Wait for success message (confirms registration succeeded)
        await expect(page.locator('#registerSuccess')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('#registerSuccess')).toContainText(/created successfully/i);
        
        // Should redirect to login after success (has 900ms setTimeout in register.js)
        await expect(page).toHaveURL(/\/login/, { timeout: 3000 });
    });

    test('should successfully log in and redirect to student dashboard', async ({ page }) => {
        // 1. Register a user first
        await page.goto(`${BASE_URL}/register`);
        const testEmail = `login.test.${Date.now()}@example.com`;
        const testPass = 'LoginPass123!';
        
        await page.fill('#firstName', 'Login');
        await page.fill('#lastName', 'Tester');
        await page.fill('#email', testEmail);
        await page.selectOption('#role', 'student');
        await page.fill('#password', testPass);
        await page.fill('#confirmPassword', testPass);
        await page.click('#registerButton');
        
        // Wait for success message and redirect
        await expect(page.locator('#registerSuccess')).toBeVisible({ timeout: 5000 });
        await expect(page).toHaveURL(/\/login/, { timeout: 3000 });
        
        // 2. Perform Login
        await page.fill('#email', testEmail);
        await page.fill('#password', testPass);
        await page.click('#loginButton');
        
        // 3. Verify redirect to student dashboard
        await expect(page).toHaveURL(/\/student/, { timeout: 5000 });
    });

    test('should successfully log in as instructor and redirect to instructor dashboard', async ({ page }) => {
        // 1. Register an instructor
        await page.goto(`${BASE_URL}/register`);
        const testEmail = `instructor.${Date.now()}@example.com`;
        const testPass = 'InstructorPass123!';
        
        await page.fill('#firstName', 'Professor');
        await page.fill('#lastName', 'Test');
        await page.fill('#email', testEmail);
        await page.selectOption('#role', 'instructor');
        await page.fill('#password', testPass);
        await page.fill('#confirmPassword', testPass);
        await page.click('#registerButton');
        
        // Wait for success message and redirect
        await expect(page.locator('#registerSuccess')).toBeVisible({ timeout: 5000 });
        await expect(page).toHaveURL(/\/login/, { timeout: 3000 });
        
        // 2. Login as instructor
        await page.fill('#email', testEmail);
        await page.fill('#password', testPass);
        await page.click('#loginButton');
        
        // 3. Verify redirect to instructor dashboard
        await expect(page).toHaveURL(/\/instructor/, { timeout: 5000 });
    });

    test('should show error for invalid login credentials', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        
        await page.fill('#email', 'nonexistent@example.com');
        await page.fill('#password', 'WrongPassword123!');
        await page.click('#loginButton');
        
        // Should show error message
        await expect(page.locator('#loginError')).toBeVisible();
        await expect(page.locator('#loginError')).toContainText(/failed|credentials/i);
        
        // Should NOT redirect
        await expect(page).toHaveURL(/\/login/);
    });

    test('should show validation error for mismatched passwords', async ({ page }) => {
        await page.goto(`${BASE_URL}/register`);
        
        await page.fill('#firstName', 'Test');
        await page.fill('#lastName', 'User');
        await page.fill('#email', `test.${Date.now()}@example.com`);
        await page.selectOption('#role', 'student');
        await page.fill('#password', 'Password123!');
        await page.fill('#confirmPassword', 'DifferentPassword123!');
        await page.click('#registerButton');
        
        // Should show error about passwords not matching
        await expect(page.locator('#registerError')).toBeVisible();
        await expect(page.locator('#registerError')).toContainText(/do not match/i);
    });
});