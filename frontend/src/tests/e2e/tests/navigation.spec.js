const { test, expect } = require('@playwright/test');

// These tests use the demo login flow (no backend required).

test.describe('Demo navigation flow', () => {
  test('Demo student login -> dashboard -> profile -> logout', async ({ page }) => {
    await page.goto('/src/pages/auth/login.html');

    await expect(page.locator('#demoStudentBtn')).toBeVisible();
    await page.click('#demoStudentBtn');

    await page.waitForURL('**/src/pages/student/dashboard.html', { timeout: 5000 });
    await expect(page.locator('.user-greeting')).toContainText('Demo Student');

    // Go to profile
    await page.click('a[href="../shared/profile.html"]');
    await page.waitForURL('**/src/pages/shared/profile.html');

    // We expect profile fields to contain demo data
    await expect(page.locator('#firstName')).toHaveValue(/Demo/);
    await expect(page.locator('#email')).toHaveValue('student@demo.local');

    // Logout from dashboard
    await page.goto('/src/pages/student/dashboard.html');
    await page.click('#logoutBtn');

    await page.waitForURL('**/src/pages/auth/login.html');
  });

  test('Demo instructor login -> instructor dashboard', async ({ page }) => {
    await page.goto('/src/pages/auth/login.html');
    await page.click('#demoInstructorBtn');

    await page.waitForURL('**/src/pages/instructor/dashboard.html', { timeout: 5000 });
    await expect(page.locator('.user-greeting')).toContainText('Demo Instructor');

    // Logout
    await page.click('#logoutBtn');
    await page.waitForURL('**/src/pages/auth/login.html');
  });
});
