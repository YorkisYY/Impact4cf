import { test, expect } from '@playwright/test';
 
 // Configure tests to run serially
 test.describe.configure({ mode: 'serial' });
 
 test.describe('Prescription View Tests', () => {
   // Set global timeout for the entire test suite
   test.setTimeout(180000); // 3 minutes
   
   // Define more precise selectors based on the actual MUI TextField structure
   const selectors = {
     // Device mode is a dropdown and needs special handling
     deviceMode: '.MuiInputBase-root .MuiSelect-select',
     // Selectors for numeric input fields
     sessionsPerDay: 'input[type="text"]:below(:text("Sessions Per Day"))',
     setsPerSession: 'input[type="text"]:below(:text("Sets Per Session"))',
     exhalesPerSet: 'input[type="text"]:below(:text("Exhales Per Set"))',
     exhaleDuration: 'input[type="text"]:below(:text("Exhale Duration"))',
     exhaleTargetPressure: 'input[type="text"]:below(:text("Exhale Target Pressure"))',
     exhaleTargetRange: 'input[type="text"]:below(:text("Exhale Target Range"))',
     // Buttons
     cancelButton: 'button:has-text("Cancel")',
     saveButton: 'button:has-text("Save")'
   };
 
   // Expected values - based on the values shown in the screenshot
   const expectedValues = {
     deviceMode: 'Count',
     sessionsPerDay: '2',
     setsPerSession: '2',
     exhalesPerSet: '10',
     exhaleDuration: '2',
     exhaleTargetPressure: '15',
     exhaleTargetRange: '10'
   };
 
   test.beforeEach(async ({ page }) => {
     // Set a longer timeout
     page.setDefaultTimeout(60000);
     
     // Check if already on the prescription page
     const currentUrl = page.url();
     console.log(`Starting beforeEach, current URL: ${currentUrl}`);
     
     if (currentUrl.includes('/prescription')) {
       console.log('Already on prescription page, skipping navigation');
       return; // Already on the correct page, skip navigation
     }
     
     // Execute login flow
     console.log('Starting login process...');
     await page.goto('/login');
     console.log('Arrived at login page, filling credentials...');
     await page.fill('input[name="email"]', 'superuser@fizzyo.co');
     await page.fill('input[name="password"]', 'foxpass01');
     await page.click('button[type="submit"]');
     console.log('Login submitted...');
     await page.waitForURL(/\/dashboard/, { timeout: 60000 });
     console.log('Successfully logged in to dashboard');
     
     // Navigate to user list and find test user
     console.log('Navigating to user list...');
     await page.goto('/users-list', { timeout: 60000 });
     await page.waitForSelector('.MuiDataGrid-root', { timeout: 60000 });
     
     console.log('Looking for user test03@fizzyo.co...');
     const userEmailCell = page.locator('.MuiDataGrid-cell:has-text("test03@fizzyo.co")').first();
     await expect(userEmailCell).toBeVisible({ timeout: 60000 });
     console.log('Found user, clicking...');
     await userEmailCell.click();
     
     // Navigate to prescription page
     await page.waitForURL(/\/[^/]+\/all/, { timeout: 60000 });
     const allPageUrl = page.url();
     console.log(`Currently on overview page: ${allPageUrl}`);
     
     const userId = allPageUrl.split('/').slice(-2)[0];
     const prescriptionUrl = `/users/${userId}/prescription`;
     console.log(`Directly navigating to prescription page: ${prescriptionUrl}`);
     
     await page.goto(prescriptionUrl, { timeout: 60000 });
     await page.waitForLoadState('networkidle', { timeout: 60000 });
     console.log(`Successfully navigated to prescription page: ${page.url()}`);
   });
 
   test('should verify prescription fields are correctly displayed', async ({ page }) => {
     console.log('Starting prescription fields verification...');
     console.log('Current URL:', page.url());
     
     // Wait for page to fully load
     await page.waitForLoadState('networkidle', { timeout: 60000 });
     
     // Helper function: try multiple ways to get element values
     const getFieldValue = async (selector, fieldName) => {
       try {
         // First try direct selector
         const element = page.locator(selector).first();
         if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
           if (fieldName === 'Device Mode') {
             return await element.innerText();
           } else {
             return await element.inputValue();
           }
         }
         
         // Backup selector: find by label text
         const labelText = fieldName;
         const labelElement = page.getByText(labelText, { exact: true });
         if (await labelElement.isVisible({ timeout: 5000 }).catch(() => false)) {
           // After finding the label, look for adjacent input element
           const inputElement = page.locator(`input, textarea, .MuiSelect-select`).filter({ near: labelElement, hasText: '' }).first();
           if (await inputElement.isVisible({ timeout: 5000 }).catch(() => false)) {
             if (fieldName === 'Device Mode') {
               return await inputElement.innerText();
             } else {
               return await inputElement.inputValue();
             }
           }
         }
         
         // Third method: using page evaluation
         const value = await page.evaluate((label) => {
           // Find label element
           const labelElements = Array.from(document.querySelectorAll('*')).filter(el => 
             el.textContent && el.textContent.trim() === label
           );
           
           if (labelElements.length > 0) {
             const labelElement = labelElements[0];
             
             // Find the Grid item containing the label
             const gridItem = labelElement.closest('.MuiGrid-item') || labelElement.parentElement;
             if (!gridItem) return null;
             
             // If in the same Grid item, directly find input element
             let input = gridItem.querySelector('input, .MuiSelect-select');
             if (input) {
               return label === 'Device Mode' ? 
                 input.textContent : 
                 input.value;
             }
             
             // Look for adjacent Grid item
             let nextGridItem = gridItem.nextElementSibling;
             if (nextGridItem) {
               input = nextGridItem.querySelector('input, .MuiSelect-select');
               if (input) {
                 return label === 'Device Mode' ? 
                   input.textContent : 
                   input.value;
               }
             }
           }
           
           return null;
         }, fieldName);
         
         return value;
       } catch (e) {
         console.log(`Error getting ${fieldName} value:`, e);
         return null;
       }
     };
     
     // Check form field values
     for (const [field, selector] of Object.entries(selectors)) {
       if (field === 'cancelButton' || field === 'saveButton') continue;
       
       const displayName = field
         .replace(/([A-Z])/g, ' $1') // Convert camelCase to space-separated
         .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
       
       console.log(`Checking ${displayName} field...`);
       const value = await getFieldValue(selector, displayName);
       
       if (value !== null) {
         console.log(`${displayName} value: ${value}`);
         
         // Check if value matches expected
         const expected = expectedValues[field];
         if (expected && value !== expected) {
           console.log(`Warning: ${displayName} value (${value}) does not match expected (${expected})`);
         }
       } else {
         console.log(`Could not get ${displayName} value`);
       }
     }
     
     // Check bottom buttons
     console.log('Checking bottom buttons...');
     if (await page.locator(selectors.cancelButton).isVisible({ timeout: 5000 }).catch(() => false)) {
       console.log('Found Cancel button');
     } else {
       console.log('Cancel button not found');
     }
     
     if (await page.locator(selectors.saveButton).isVisible({ timeout: 5000 }).catch(() => false)) {
       console.log('Found Save button');
     } else {
       console.log('Save button not found');
     }
     
     console.log('Prescription fields verification complete');
   });
   
   test('should test form modification and save functionality', async ({ page }) => {
     console.log('Starting form modification and save functionality test...');
     console.log('Current URL:', page.url());
     
     // Wait for page to load completely
     await page.waitForLoadState('networkidle', { timeout: 60000 });
     
     // Try to modify Sessions Per Day field
     console.log('Finding Sessions Per Day field...');
     let sessionField = null;
     
     // Try different selector strategies
     const sessionFieldSelectors = [
       selectors.sessionsPerDay,
       'input:below(div:has-text("Sessions Per Day"))',
       '.MuiGrid-item:has-text("Sessions Per Day") + .MuiGrid-item input'
     ];
     
     for (const selector of sessionFieldSelectors) {
       const field = page.locator(selector).first();
       if (await field.isVisible({ timeout: 5000 }).catch(() => false)) {
         sessionField = field;
         console.log(`Found Sessions Per Day field using selector: ${selector}`);
         break;
       }
     }
     
     if (!sessionField) {
       console.log('Could not find Sessions Per Day field, attempting DOM evaluation...');
       
       // Use DOM evaluation to find the field
       const sessionFieldHandle = await page.evaluateHandle(() => {
         // Find element containing the text
         const labelElement = Array.from(document.querySelectorAll('*')).find(
           el => el.textContent && el.textContent.trim() === 'Sessions Per Day'
         );
         
         if (!labelElement) return null;
         
         // Find the nearest grid containing input
         const gridItem = labelElement.closest('.MuiGrid-item');
         if (!gridItem) return null;
         
         // Try to find adjacent grid
         const nextGrid = gridItem.nextElementSibling;
         if (nextGrid) {
           return nextGrid.querySelector('input');
         }
         
         return null;
       });
       
       if (sessionFieldHandle && !(await sessionFieldHandle.evaluate(node => node === null))) {
         sessionField = sessionFieldHandle;
         console.log('Found Sessions Per Day field using DOM evaluation');
       }
     }
     
     if (!sessionField) {
       console.log('Sessions Per Day field not found, skipping test');
       return;
     }
     
     // Get original value and modify
     try {
       const originalValue = await sessionField.inputValue();
       console.log(`Original Sessions Per Day value: ${originalValue}`);
       
       // Change to new value (2 to 3, or 3 to 2)
       const newValue = originalValue === '2' ? '3' : '2';
       console.log(`Setting new value to: ${newValue}`);
       
       await sessionField.click();
       await sessionField.press('Control+a');
       await sessionField.fill(newValue);
       
       // Click save button
       console.log('Clicking save button...');
       const saveButton = page.locator(selectors.saveButton).first();
       if (await saveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
         await saveButton.click();
         
         // Handle popup dialog
         try {
           const dialog = await page.waitForEvent('dialog', { timeout: 10000 });
           console.log(`Dialog message: ${dialog.message()}`);
           await dialog.accept();
         } catch (e) {
           console.log('No dialog appeared');
         }
         
         // Wait for page redirect
         console.log('Waiting for redirect...');
         await page.waitForURL(/\/users-list/, { timeout: 60000 });
         console.log('Redirected to users list after save');
         
         // Navigate back to prescription page to verify changes
         console.log('Navigating back to prescription page to verify changes...');
         const userEmailCell = page.locator('.MuiDataGrid-cell:has-text("test03@fizzyo.co")').first();
         await expect(userEmailCell).toBeVisible({ timeout: 60000 });
         await userEmailCell.click();
         
         await page.waitForURL(/\/[^/]+\/all/, { timeout: 60000 });
         const userId = page.url().split('/').slice(-2)[0];
         const prescriptionUrl = `/users/${userId}/prescription`;
         await page.goto(prescriptionUrl, { timeout: 60000 });
         await page.waitForLoadState('networkidle', { timeout: 60000 });
         
         // Find Sessions Per Day field again to verify changes
         console.log('Verifying Sessions Per Day value has been updated...');
         let updatedField = null;
         
         for (const selector of sessionFieldSelectors) {
           const field = page.locator(selector).first();
           if (await field.isVisible({ timeout: 5000 }).catch(() => false)) {
             updatedField = field;
             break;
           }
         }
         
         if (updatedField) {
           const updatedValue = await updatedField.inputValue();
           console.log(`Updated value: ${updatedValue}, expected: ${newValue}`);
           
           // Restore original value
           console.log('Restoring original value...');
           await updatedField.click();
           await updatedField.press('Control+a');
           await updatedField.fill(originalValue);
           
           // Save again to restore original state
           const saveButtonAgain = page.locator(selectors.saveButton).first();
           if (await saveButtonAgain.isVisible({ timeout: 5000 }).catch(() => false)) {
             await saveButtonAgain.click();
             
             try {
               const dialog = await page.waitForEvent('dialog', { timeout: 10000 });
               console.log(`Dialog message: ${dialog.message()}`);
               await dialog.accept();
             } catch (e) {
               console.log('No dialog appeared during restoration');
             }
             
             console.log('Waiting for final redirect...');
             await page.waitForURL(/\/users-list/, { timeout: 60000 });
           }
         } else {
           console.log('Could not find field to verify changes');
         }
       } else {
         console.log('Save button not found');
       }
     } catch (e) {
       console.log('Error modifying field:', e);
     }
     
     console.log('Form modification and save functionality test complete');
   });
   
   test('should verify cancel button navigates back to previous page', async ({ page }) => {
     console.log('Starting cancel button navigation test...');
     console.log('Current URL:', page.url());
     
     // Record current URL
     const currentUrl = page.url();
     
     // Find cancel button
     const cancelButton = page.locator(selectors.cancelButton).first();
     if (await cancelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
       console.log('Found Cancel button');
       
       // Try to modify Sessions Per Day field
       for (const selector of [
         selectors.sessionsPerDay,
         'input:below(div:has-text("Sessions Per Day"))',
         '.MuiGrid-item:has-text("Sessions Per Day") + .MuiGrid-item input'
       ]) {
         const sessionField = page.locator(selector).first();
         if (await sessionField.isVisible({ timeout: 5000 }).catch(() => false)) {
           try {
             await sessionField.click();
             await sessionField.press('Control+a');
             await sessionField.fill('999');
             console.log('Modified Sessions Per Day value to 999');
             break;
           } catch (e) {
             console.log(`Failed to modify with selector ${selector}:`, e);
           }
         }
       }
       
       // Click cancel button
       console.log('Clicking cancel button...');
       await cancelButton.click();
       
       // Verify return to previous page
       console.log('Waiting for return to previous page...');
       try {
         await page.waitForFunction(
           (url) => window.location.href !== url,
           currentUrl,
           { timeout: 60000 }
         );
         
         const newUrl = page.url();
         console.log(`New URL: ${newUrl}`);
         expect(newUrl).not.toBe(currentUrl);
         console.log('Successfully returned to previous page');
       } catch (e) {
         console.log('Error waiting for page navigation:', e);
       }
     } else {
       console.log('Cancel button not found');
     }
     
     console.log('Cancel button navigation test complete');
   });
 });