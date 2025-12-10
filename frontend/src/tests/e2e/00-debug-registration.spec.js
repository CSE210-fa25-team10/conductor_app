// frontend/src/tests/e2e/00-debug-registration.spec.js
// Run this to see what's actually happening with registration
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test('DEBUG: Check registration behavior', async ({ page }) => {
    console.log('\n========================================');
    console.log('🔍 DEBUG: Testing Registration');
    console.log('========================================\n');
    
    // Listen for console messages
    page.on('console', msg => {
        console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });
    
    // Listen for network errors
    page.on('pageerror', error => {
        console.log(`[PAGE ERROR] ${error.message}`);
    });
    
    // Listen for failed requests
    page.on('requestfailed', request => {
        console.log(`[REQUEST FAILED] ${request.url()}: ${request.failure().errorText}`);
    });
    
    // Navigate to register page
    await page.goto(`${BASE_URL}/register`);
    console.log('✅ Loaded register page');
    
    // Fill form
    const testEmail = `debug.test.${Date.now()}@example.com`;
    console.log(`📧 Using email: ${testEmail}`);
    
    await page.fill('#firstName', 'Debug');
    await page.fill('#lastName', 'Test');
    await page.fill('#email', testEmail);
    await page.selectOption('#role', 'instructor');
    await page.fill('#password', 'Debug123!');
    await page.fill('#confirmPassword', 'Debug123!');
    
    console.log('✅ Form filled');
    
    // Intercept the API call
    const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/auth/register')
    );
    
    // Submit
    console.log('📤 Submitting form...');
    await page.click('#registerButton');
    
    // Wait for API response
    const response = await responsePromise;
    console.log(`\n📥 API Response:`);
    console.log(`   Status: ${response.status()}`);
    console.log(`   Status Text: ${response.statusText()}`);
    
    try {
        const responseBody = await response.json();
        console.log(`   Body: ${JSON.stringify(responseBody, null, 2)}`);
    } catch (e) {
        console.log(`   Body: (not JSON or error reading)`);
    }
    
    // Wait a moment for UI to update
    await page.waitForTimeout(1000);
    
    // Check for success message
    const successVisible = await page.locator('#registerSuccess').isVisible();
    const successText = await page.locator('#registerSuccess').textContent();
    console.log(`\n✅ Success message visible: ${successVisible}`);
    if (successVisible) {
        console.log(`   Text: "${successText}"`);
    }
    
    // Check for error message
    const errorVisible = await page.locator('#registerError').isVisible();
    const errorText = await page.locator('#registerError').textContent();
    console.log(`\n❌ Error message visible: ${errorVisible}`);
    if (errorVisible) {
        console.log(`   Text: "${errorText}"`);
    }
    
    // Check current URL
    console.log(`\n🌐 Current URL: ${page.url()}`);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-registration.png', fullPage: true });
    console.log(`\n📸 Screenshot saved: debug-registration.png`);
    
    console.log('\n========================================\n');
    
    // This test always passes - it's just for debugging
    expect(true).toBe(true);
});