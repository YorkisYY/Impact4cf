import { chromium, request } from '@playwright/test';
import { createAuthViaAPI } from './auth.setup';

const globalSetup = async config => {
  // Ensure the baseURL is set from environment variables or fallback to a default value
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://api.impact-dev.cs.ucl.ac.uk/';

  // Create API request context with the base URL
  const apiRequestContext = await request.newContext({
    baseURL: baseURL
  });

  // Pass both apiRequestContext and baseURL to createAuthViaAPI
  const storageState = await createAuthViaAPI(apiRequestContext, baseURL);

  // Save the storage state to a file for tests to use
  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState });
  await context.storageState({ path: './playwright/.auth/user.json' });

  await browser.close();
};

export default globalSetup;