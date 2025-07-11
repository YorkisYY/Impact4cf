import { test, expect } from '@playwright/test';

test.describe('Treatment Navigation Flow', () => {
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
    
    // Navigate to specific date page (21/03/2025)
    // First get to the right week
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
    
    // Find and click on March 21 row
    const dateRow = page.locator('table tbody tr').filter({ 
      hasText: '21/03/2025' 
    }).first();
    await expect(dateRow).toBeVisible({ timeout: 5000 });
    await dateRow.click();
    
    // Wait for navigation to day view
    await page.waitForURL(/\/[^/]+\/all\/[^/]+/);
    
    // Verify day title is visible
    await expect(page.locator('div').filter({ hasText: /Friday 21 Mar 2025 - Day Summary/ }).first())
      .toBeVisible({ timeout: 3000 });
  });

  test('should navigate through session, set, and breath views and verify all details', async ({ page }) => {
    // STEP 1: NAVIGATE TO SESSION VIEW
    console.log('Step 1: Navigating to Session 1');
    const session1Row = page.locator('tr').filter({ hasText: 'Session 1' }).first();
    await expect(session1Row).toBeVisible({ timeout: 5000 });
    await session1Row.click();
    
    // Wait for navigation to session view
    await page.waitForURL(/\/[^/]+\/all\/[^/]+\/[^/]+/);

    // Verify Session Info component
    const sessionTitle = page.locator('div').filter({ 
      hasText: /Friday 21 Mar 2025 - ACT Session 1 Summary/ 
    }).first();
    await expect(sessionTitle).toBeVisible({ timeout: 5000 });
    
    // Check session statistics are displayed correctly
    await expect(page.locator('text="Duration:"').first().locator('..')).toContainText('0m 54s');
    await expect(page.locator('text="Sets:"').first().locator('..')).toContainText('2/2');
    await expect(page.locator('text="Breaths:"').first().locator('..')).toContainText('12/20');
    
    // Check for breath graph visibility
    await expect(page.locator('.apexcharts-canvas')).toBeVisible({ timeout: 10000 });

    // Verify Sets List exists
    const setsList = page.locator('div').filter({ hasText: /Sets/ }).first();
    await expect(setsList).toBeVisible();
    
    // Verify user can see set details in the list
    const firstSet = page.locator('tr').filter({ hasText: 'Set 1' }).first();
    await expect(firstSet).toBeVisible();
    await expect(firstSet).toContainText('0m 37s');
    await expect(firstSet).toContainText('10 / 10');
    
    // STEP 2: NAVIGATE TO SET VIEW
    console.log('Step 2: Navigating to Set 1');
    const set1Row = page.locator('tr').filter({ hasText: 'Set 1' }).first();
    await expect(set1Row).toBeVisible({ timeout: 5000 });
    await set1Row.click();
    
    // Wait for navigation to set view
    await page.waitForURL(/\/[^/]+\/all\/[^/]+\/[^/]+\/[^/]+/);

    // Verify Set Info component
    const setTitle = page.locator('div').filter({ 
      hasText: /Friday 21 Mar 2025 - Session 1 - Set 1 Summary/ 
    }).first();
    await expect(setTitle).toBeVisible({ timeout: 5000 });
    
    // Check set statistics are displayed correctly
    await expect(page.locator('text="Duration:"').first().locator('..')).toContainText('0m 37s');
    await expect(page.locator('text="Breaths:"').first().locator('..')).toContainText('10/10');
    
    // Check for breath graph visibility
    await expect(page.locator('.apexcharts-canvas')).toBeVisible({ timeout: 10000 });
    
    // Verify Breaths List exists
    const breathsList = page.locator('div').filter({ hasText: /Breaths/ }).first();
    await expect(breathsList).toBeVisible();
    
    // Verify user can see breath details in the list
    const firstBreath = page.locator('tr').filter({ hasText: 'Breath 1' }).first();
    await expect(firstBreath).toBeVisible();
    await expect(firstBreath).toContainText('2.4s');
    await expect(firstBreath).toContainText('10 cmH₂O');
    
    // STEP 3: NAVIGATE TO BREATH VIEW
    console.log('Step 3: Navigating to Breath 1');
    const breath1Row = page.locator('tr').filter({ hasText: 'Breath 1' }).first();
    await expect(breath1Row).toBeVisible({ timeout: 5000 });
    await breath1Row.click();
    
    // Wait for navigation to breath view
    await page.waitForURL(/\/[^/]+\/all\/[^/]+\/[^/]+\/[^/]+\/[^/]+/);

    // Verify Breath Info component
    const breathTitle = page.locator('div').filter({ 
      hasText: /Friday 21 Mar 2025 - Session 1 - Set 1 - Breath 1 Summary/ 
    }).first();
    await expect(breathTitle).toBeVisible({ timeout: 5000 });
    
    // Check breath statistics are displayed correctly
    await expect(page.locator('text="Duration:"').first().locator('..')).toContainText('2s');
    await expect(page.locator('text="Mean Pressure:"').first().locator('..')).toContainText('10.0 cmH₂O');

    // Check for breath graph visibility
    await expect(page.locator('.apexcharts-canvas')).toBeVisible({ timeout: 10000 });
    
    // Verify parent information is still visible
    const participantInfo = page.locator('div').filter({ hasText: /Participant Information/ }).first();
    await expect(participantInfo).toBeVisible();
    
    const prescriptionInfo = page.locator('div').filter({ hasText: /Prescription Information/ }).first();
    await expect(prescriptionInfo).toBeVisible();
  });
});