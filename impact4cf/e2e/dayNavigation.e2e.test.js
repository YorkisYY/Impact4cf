import { test, expect } from '@playwright/test';

test.describe('Day Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'superuser@fizzyo.co');
    await page.fill('input[name="password"]', 'foxpass01');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Navigate to the user list page
    await page.goto('/users-list');
    
    // Wait for the data grid to load
    await page.waitForSelector('.MuiDataGrid-root');
    
    // Find and click on the test03@fizzyo.co user cell
    const userEmailCell = page.locator('.MuiDataGrid-cell:has-text("test03@fizzyo.co")').first();
    await expect(userEmailCell).toBeVisible({ timeout: 10000 });
    await userEmailCell.locator('..').click();
    
    // Wait for navigation to treatment overview page
    await page.waitForURL(/\/[^/]+\/all/);
    
    // Wait for the date picker to be visible
    await page.waitForSelector('.ant-picker-range', { state: 'visible', timeout: 10000 });
    
    // Use a flexible approach to identify the previous week button
    const prevWeekButton = page.locator([
      'button[aria-label="Previous Week"]',
      '.date-range-picker button:first-child',
      'button:has(svg[data-testid="ArrowBackIosNewIcon"])',
      'button:has(.MuiSvgIcon-root):first-child'
    ].join(', ')).first();
    
    // Click "Previous Week" button until the correct date range is displayed
    let dateRangeText = '';
    let clickCount = 0;
    const maxClicks = 10;
    
    while (!dateRangeText.includes('16-03-2025') && clickCount < maxClicks) {
      await prevWeekButton.click({ timeout: 5000 });
      clickCount++;
      
      try {
        await page.waitForTimeout(500); // Give UI time to update
        dateRangeText = await page.locator('.ant-picker-input input').first().inputValue();
      } catch (e) {
        console.log(`Error getting date range: ${e.message}`);
      }
      
      if (await page.locator('button[aria-label="Previous Week"]').isDisabled()) {
        break;
      }
    }
    
    // Assert that we found the right date range
    expect(dateRangeText).toContain('16-03-2025');
  });

  test('should navigate to day view and verify details', async ({ page }) => {
    // Find and click on the row with 21/03/2025 date (with flexible date format)
    const dateRow = page.locator('table tbody tr').filter({ 
      hasText: /21\/0?3\/2025|2025\/0?3\/21/ 
    }).first();
    
    await expect(dateRow).toBeVisible({ timeout: 5000 });
    await dateRow.click();
    
    // Wait for navigation to the day view URL
    await page.waitForURL(/\/[^/]+\/all\/[^/]+/);
    
    // Verify day summary loads correctly
    const dayTitle = page.locator('div').filter({ hasText: /Friday 21 Mar 2025 - Day Summary/ }).first();
    await expect(dayTitle).toBeVisible({ timeout: 5000 });
    
    // Check treatment statistics are displayed correctly
    await expect(page.locator('text="ACT Sessions:"').first().locator('..')).toContainText('12/2');
    await expect(page.locator('text="Sets:"').first().locator('..')).toContainText('11/4');
    await expect(page.locator('text="Breaths:"').first().locator('..')).toContainText('41/40');
    
    // Check for breath graph visibility
    await expect(page.locator('.apexcharts-canvas')).toBeVisible({ timeout: 10000 });

    // Verify Sessions List component
    const sessionsList = page.locator('div').filter({ hasText: /Sessions/ }).first();
    await expect(sessionsList).toBeVisible();
    
    // Check first session details
    const firstSession = page.locator('tr').filter({ hasText: 'Session 1' }).first();
    await expect(firstSession).toBeVisible();
    await expect(firstSession).toContainText('0m 54s');
    await expect(firstSession).toContainText('2 / 2');
    await expect(firstSession).toContainText('12 / 40');

    // Verify Participant Information 
    const participantInfo = page.locator('div').filter({ hasText: /Participant Information/ }).first();
    await expect(participantInfo).toContainText('test 03');
    await expect(participantInfo).toContainText('Trial stage: 0');
    await expect(participantInfo).toContainText('Device Mode: Count');
    await expect(participantInfo.getByRole('button', { name: 'View & Edit Details' }).first()).toBeVisible();

    // Verify Prescription Information
    const prescriptionInfo = page.locator('div').filter({ hasText: /Prescription Information/ }).first();
    await expect(prescriptionInfo).toContainText('ACT Sessions');
    await expect(prescriptionInfo).toContainText('per day');
    await expect(prescriptionInfo).toContainText('2');
    await expect(prescriptionInfo).toContainText('Sets');
    await expect(prescriptionInfo).toContainText('per session');
    await expect(prescriptionInfo).toContainText('2');
    await expect(prescriptionInfo).toContainText('Breaths');
    await expect(prescriptionInfo).toContainText('per set');
    await expect(prescriptionInfo).toContainText('10');
    await expect(prescriptionInfo).toContainText('Breath Length');
    await expect(prescriptionInfo).toContainText('2 s');
    await expect(prescriptionInfo).toContainText('Breath Pressure Range');
    await expect(prescriptionInfo).toContainText('10 - 20 cmH₂O');
    await expect(prescriptionInfo.getByRole('button', { name: 'View & Edit Details' }).first()).toBeVisible();
  });
});