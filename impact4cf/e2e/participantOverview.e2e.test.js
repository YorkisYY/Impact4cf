import { test, expect } from '@playwright/test';

test.describe('Participant Overview Page', () => {
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
  });

  test('should navigate to treatment overview page and verify details', async ({ page }) => {
    // Find the row with test03@fizzyo.co email - using more specific MUI DataGrid selectors
    const userEmailCell = page.locator('.MuiDataGrid-cell:has-text("test03@fizzyo.co")').first();
    
    // Make sure the cell exists before proceeding
    await expect(userEmailCell).toBeVisible({ timeout: 10000 });
    
    // Click on the row containing the email cell (parent row)
    await userEmailCell.locator('..').click();
    
    // Wait for navigation to treatment overview page
    await page.waitForURL(/\/[^/]+\/all/);
    
    // Extract userId from the URL
    const url = page.url();
    const urlParts = url.split('/');
    const userId = urlParts[urlParts.length - 2]; // URL format is /{userId}/all
    
    expect(userId).not.toBeNull();
    
    // Wait for the date picker to be visible on the page
    await page.waitForSelector('.ant-picker-range', { state: 'visible', timeout: 10000 });
    
    // Use a flexible approach to identify the previous week button
    // Try multiple possible selectors
    const prevWeekButton = page.locator([
      'button[aria-label="Previous Week"]',                   // By aria-label
      '.date-range-picker button:first-child',                // First button in date range picker
      'button:has(svg[data-testid="ArrowBackIosNewIcon"])',   // Button with specific icon
      'button:has(.MuiSvgIcon-root):first-child'              // First button with any SVG icon
    ].join(', ')).first();
    
    // Debug - take a screenshot before clicking
    await page.screenshot({ path: `before-click-${Date.now()}.png` });

    // Click "Previous Week" button until the correct date range is displayed
    let dateRangeText = '';
    let clickCount = 0;
    const maxClicks = 10;  // Safety limit
    
    while (!dateRangeText.includes('16-03-2025') && clickCount < maxClicks) {
      await prevWeekButton.click({ timeout: 5000 });
      clickCount++;
      
      // Get text from the input field - ensure it's fully loaded
      try {
        await page.waitForTimeout(500); // Give UI time to update
        dateRangeText = await page.locator('.ant-picker-input input').first().inputValue();
        console.log(`Current date range: ${dateRangeText}, attempt ${clickCount}`);
      } catch (e) {
        console.log(`Error getting date range: ${e.message}`);
      }
      
      // Prevent infinite loop
      if (await page.locator('button[aria-label="Previous Week"]').isDisabled()) {
        console.log('Previous week button is disabled');
        break;
      }
    }
    
    // Assert that we eventually found the right date range
    expect(dateRangeText).toContain('16-03-2025');

    // Verify DaysList component with the correct table structure
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });

    // Check the cells in order by content rather than position
    const dateCell = firstRow.getByText(/21\/03\/2025|21\/3\/2025/, { exact: false });
    await expect(dateCell).toBeVisible();

    const sessionsCell = firstRow.getByText('12 / 2');
    await expect(sessionsCell).toBeVisible();

    const setsCell = firstRow.getByText('11 / 4');
    await expect(setsCell).toBeVisible();

    const breathsCell = firstRow.getByText('41 / 40');
    await expect(breathsCell).toBeVisible();

    // Verify Participant Information - using MainCard component
    const participantInfo = page.locator('div').filter({ hasText: /Participant Information/ }).first();
    await expect(participantInfo).toContainText('test 03');
    await expect(participantInfo).toContainText('Trial stage: 0');
    await expect(participantInfo).toContainText('Device Mode: Count');
    await expect(participantInfo.getByRole('button', { name: 'View & Edit Details' }).first()).toBeVisible();

    // Verify Prescription Information - using MainCard component
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