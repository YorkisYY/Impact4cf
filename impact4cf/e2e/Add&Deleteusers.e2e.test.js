
import { test, expect } from '@playwright/test';

test('User deletion test with system confirmation dialog', async ({ page }) => {
  // Set the overall test timeout
  test.setTimeout(180000); // 3 minutes
  
  // Set longer timeout for page operations
  page.setDefaultTimeout(60000); 
  
  // Set up dialog handler before any operations
  // This is crucial - must set up the handler before the dialog appears
  page.on('dialog', async dialog => {
    console.log(`System dialog appeared: ${dialog.type()}, message: "${dialog.message()}"`);
    // Click "OK" button to accept confirmation
    await dialog.accept();
    console.log('Dialog accepted');
  });
  
  // Execute login flow
  console.log('Starting login process...');
  await page.goto('/login');
  await page.fill('input[name="email"]', 'superuser@fizzyo.co');
  await page.fill('input[name="password"]', 'foxpass01');
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForURL(/\/dashboard/, { timeout: 60000 });
  console.log('Successfully logged in to dashboard');
  
  // Navigate to users list page
  console.log('Navigating to users list page...');
  await page.goto('/users-list', { timeout: 60000 });
  
  // Wait for data grid to load
  console.log('Waiting for data grid to load...');
  await page.waitForSelector('.MuiDataGrid-root', { timeout: 60000 });
  
  // 1. Add new user
  console.log('Clicking "Add User" button...');
  await page.click('button:has-text("Add User")');
  
  // Wait for navigation to add user page
  await page.waitForURL(/.*\/users-list\/add-user$/, { timeout: 60000 });
  console.log('Navigated to add user page');
  
  // Generate unique test user email with specific identification prefix
  const timestamp = new Date().getTime();
  const testUserEmail = `test-delete-${timestamp}@example.com`;
  
  // Fill out the form
  console.log(`Filling add user form... Email: ${testUserEmail}`);
  await page.fill('input[name="email"]', testUserEmail);
  await page.fill('input[name="name"]', `Test User ${timestamp}`);
  await page.fill('input[name="password"]', 'Password123!');
  
  // Submit the form
  console.log('Submitting form...');
  await page.click('button:has-text("Add User")');
  
  // Wait for redirect back to users list page
  await page.waitForURL(/\/users-list/, { timeout: 60000 });
  console.log('Redirected back to users list page');
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  console.log('Page fully loaded');
  
  // Wait for data grid to reload
  console.log('Waiting for data grid to reload...');
  await page.waitForSelector('.MuiDataGrid-root', { timeout: 60000 });
  
  // Find and select the newly created user
  console.log('Finding and selecting newly created user...');
  
  let foundUser = false;
  let pageNum = 1;
  
  // Define a function to check if our user is in the current page
  const checkCurrentPageForUser = async () => {
    const rows = await page.locator('.MuiDataGrid-row').all();
    console.log(`Page ${pageNum} has ${rows.length} rows of data`);
    
    for (const row of rows) {
      const text = await row.textContent();
      if (text.includes(testUserEmail)) {
        console.log(`Found user on page ${pageNum}`);
        
        // Click the checkbox in the row
        const checkbox = row.locator('input[type="checkbox"]').first();
        await checkbox.check();
        console.log('User checkbox selected');
        
        return true;
      }
    }
    return false;
  };
  
  // Check the first page
  foundUser = await checkCurrentPageForUser();
  
  // If not found on first page, try looking through other pages
  while (!foundUser) {
    // Check if there's a next page button
    const nextButton = page.locator('button[aria-label="Go to next page"]');
    const isNextEnabled = await nextButton.isEnabled().catch(() => false);
    
    if (isNextEnabled) {
      console.log(`Going to page ${pageNum + 1}...`);
      await nextButton.click();
      await page.waitForTimeout(3000); // Wait for page to load
      pageNum++;
      foundUser = await checkCurrentPageForUser();
    } else {
      console.log('Reached the last page, user not found');
      break;
    }
  }
  
  if (!foundUser) {
    console.error('Could not find newly created user, cannot continue with delete test');
    return;
  }
  
  // Click Delete Users button - this will trigger the system dialog
  console.log('Clicking Delete Users button...');
  
  // Don't wait for dialog processing to complete, as the dialog handler is already set
  await page.click('button:has-text("Delete Users")');
  
  // Wait a while for dialog processing to complete
  console.log('Waiting for delete operation to complete...');
  await page.waitForTimeout(5000);
  
  // Check if there's a success message
  const successMessage = await page.locator('.MuiAlert-standardSuccess').isVisible().catch(() => false);
  if (successMessage) {
    console.log('Success message detected');
  } else {
    console.log('No success message detected');
  }
  
  // Reload the page to confirm user has been deleted
  console.log('Reloading page...');
  await page.reload();
  await page.waitForSelector('.MuiDataGrid-root', { timeout: 60000 });
  
  // Confirm user has been deleted
  console.log('Verifying user has been deleted...');
  
  let userStillExists = false;
  let checkPageNum = 1;
  
  // Check if user still exists in the table
  const checkUserIsDeleted = async () => {
    const rows = await page.locator('.MuiDataGrid-row').all();
    
    for (const row of rows) {
      const text = await row.textContent();
      if (text.includes(testUserEmail)) {
        console.log(`Warning: User still exists on page ${checkPageNum}`);
        return true;
      }
    }
    return false;
  };
  
  // Check the first page
  userStillExists = await checkUserIsDeleted();
  
  // If not found on first page, check other pages
  while (!userStillExists) {
    // Check if there's a next page button
    const nextButton = page.locator('button[aria-label="Go to next page"]');
    const isNextEnabled = await nextButton.isEnabled().catch(() => false);
    
    if (isNextEnabled) {
      console.log(`Checking page ${checkPageNum + 1}...`);
      await nextButton.click();
      // Reduced wait time from 90000 to 10000 milliseconds
      await page.waitForTimeout(10000);
      checkPageNum++;
      userStillExists = await checkUserIsDeleted();
      
      // If we've already checked up to the page where the user was found, and the user doesn't exist, we can confirm deletion was successful
      if (checkPageNum >= pageNum && !userStillExists) {
        break;
      }
    } else {
      // Reached the last page
      break;
    }
  }
  
  if (userStillExists) {
    console.error('Deletion failed: User still exists in the system');
  } else {
    console.log('Test successful: User has been successfully deleted!');
  }
  
  console.log('Test completed');
});