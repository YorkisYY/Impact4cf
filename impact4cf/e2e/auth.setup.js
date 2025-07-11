// auth.setup.js - Playwright authentication setup file

// Define test user credentials (preferably from environment variables)
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'superuser@fizzyo.co',
  password: process.env.TEST_USER_PASSWORD || 'foxpass01'
};

// Create an authenticated context through UI login
async function createAuthenticatedContext(page) {
  // Login through UI interface
  await page.goto('/login');
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  // Wait for login to complete (redirect to dashboard)
  await page.waitForURL(/\/dashboard/);

  // Save authentication state to file for reuse
  const storageState = await page.context().storageState();
  return storageState;
}

// Login via API and save authentication state (faster method)
// Modified to accept baseURL as a direct parameter
async function createAuthViaAPI(apiRequestContext, baseURL) {
  // Ensure the baseURL is provided directly
  if (!baseURL) {
    throw new Error('Base URL is not provided. Please provide a valid baseURL.');
  }

  // Send login request
  const response = await apiRequestContext.post('/api/auth/login', {
    data: {
      email: TEST_USER.email,
      password: TEST_USER.password
    }
  });

  // Check if the response is successful
  if (response.status() !== 200) {
    throw new Error(`Failed to log in: ${response.status()} - ${response.statusText()}`);
  }

  // Extract token from response
  const responseBody = await response.json();
  const token = responseBody.idToken;

  // Create storage state with authentication token
  const storageState = {
    cookies: [
      {
        name: 'access_token',
        value: token,
        domain: new URL(baseURL).hostname,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax'
      }
    ],
    origins: [
      {
        origin: baseURL,
        localStorage: [
          {
            name: 'authToken',
            value: token
          }
        ]
      }
    ]
  };

  return storageState;
}

export {
  TEST_USER,
  createAuthenticatedContext,
  createAuthViaAPI
};