// frontend/src/tests/e2e/profile.spec.js
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Profile Workflows', () => {
    test('should successfully register and access profile', async ({ page }) => {
        // 1. Register a new user
        const email = `profile.${Date.now()}@example.com`;
        const password = 'ProfilePass123!';
        
        await page.goto(`${BASE_URL}/register`);
        await page.fill('#firstName', 'Profile');
        await page.fill('#lastName', 'Test');
        await page.fill('#email', email);
        await page.selectOption('#role', 'student');
        await page.fill('#password', password);
        await page.fill('#confirmPassword', password);
        await page.click('#registerButton');
        
        // Wait for redirect to login
        await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
        
        // 2. Login
        await page.fill('#email', email);
        await page.fill('#password', password);
        await page.click('#loginButton');
        
        // 3. Verify we reached the dashboard
        await expect(page).toHaveURL(/\/student/, { timeout: 5000 });
        
        // Note: If you have a profile page route, navigate to it here
        // For example: await page.goto(`${BASE_URL}/profile`);
        // Then test profile update functionality
    });
});