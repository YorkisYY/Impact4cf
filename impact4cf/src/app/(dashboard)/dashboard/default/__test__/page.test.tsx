import { jest } from '@jest/globals';
import DefaultDashboardPage from '../page';
import React from 'react';
import DefaultDashboard, { DefaultDashboardProps } from 'views/dashboard/Default';
import { render } from '@testing-library/react';
import { advanceTo, clear } from 'jest-date-mock';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeEach, beforeAll, afterAll, afterEach, describe, test, expect } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock the Next.js router to avoid errors related to routing
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => ({ name, value: 'mock-token' }),
    getAll: () => [],
  }),
}));

// Mock the authFetcherWithRedirect function to return mock data instead of a Response object
// jest.mock('@/utils/withAuthRedirect', () => ({
//     authFetcherWithRedirect: jest.fn((url: string) => {
//       // Determine which mock data to return based on the URL
//       if (url.includes('startDate=2025-04-14')) {
//         return Promise.resolve(mockCurrentWeekData);
//       } else if (url.includes('startDate=2025-04-07')) {
//         return Promise.resolve(mockPreviousWeekData);
//       }
//       return Promise.reject(new Error('Invalid URL'));
//     }),
//   }));

// Mock the DefaultDashboard component
jest.mock('views/dashboard/Default', () => {
  return {
    __esModule: true,
    default: jest.fn<React.FC<DefaultDashboardProps>>().mockImplementation((props) => (
      <div data-testid="dashboard-component">
        {props.initialData && <div data-testid="has-initial-data">true</div>}
      </div>
    ))
  };
});

// Mock API data for current week
const mockCurrentWeekData = {
  participants: {
    total: 100,
    active: 80,
    inactive: 20
  },
  activity: {
    totalSessions: 500,
    totalSets: 2000,
    totalBreaths: 20000
  },
  dateRange: {
    startDate: '2025-04-14',
    endDate: '2025-04-20'
  }
};

// Mock API data for previous week with lower values to test change calculations
const mockPreviousWeekData = {
  participants: {
    total: 90,
    active: 70,
    inactive: 20
  },
  activity: {
    totalSessions: 450,
    totalSets: 1800,
    totalBreaths: 18000
  },
  dateRange: {
    startDate: '2025-04-07',
    endDate: '2025-04-13'
  }
};

let requestCounter = 0;

// Reset before each test
beforeEach(() => {
  requestCounter = 0;
});

// In your server setup
const server = setupServer(
  http.get('*/api/analytics/participants', async ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    console.log(`Request intercepted: startDate=${startDate}, endDate=${endDate}`);
    
    requestCounter++;
    
    // First request: Current week data
    if (requestCounter === 1) {
      console.log("Returning CURRENT week data");
      return HttpResponse.json(mockCurrentWeekData);
    }
    // Second request: Previous week data
    else if (requestCounter === 2) {
      console.log("Returning PREVIOUS week data");
      return HttpResponse.json(mockPreviousWeekData);
    }
    
    console.log(`No matching data for request #${requestCounter}`);
    return new HttpResponse(null, { status: 404 });
  })
);
// Extract date helper functions for direct testing
const { getCurrentWeekDates, getPreviousWeekDates } = jest.requireActual('../page') as {
  getCurrentWeekDates: () => { startDate: Date, endDate: Date },
  getPreviousWeekDates: () => { startDate: Date, endDate: Date }
};

describe('Default Dashboard Page', () => {
  // Set up and tear down MSW server
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
    clear();
  });
  afterAll(() => server.close());

  describe('Date calculation functions', () => {
    test('getCurrentWeekDates returns the correct date range for Wednesday', () => {
      // Mock date to a Wednesday
      advanceTo(new Date(2025, 3, 16)); // April 16, 2025 (Wednesday)

      const { startDate, endDate } = getCurrentWeekDates();

      // Verify Monday (start of week)
      expect(startDate.getDate()).toBe(14); // Should be April 14
      expect(startDate.getMonth()).toBe(3); // April (0-based)
      expect(startDate.getFullYear()).toBe(2025);
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);

      // Verify Sunday (end of week)
      expect(endDate.getDate()).toBe(20); // Should be April 20
      expect(endDate.getMonth()).toBe(3); // April
      expect(endDate.getFullYear()).toBe(2025);
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
    });

    test('getCurrentWeekDates handles Sunday correctly', () => {
      // Mock date to a Sunday
      advanceTo(new Date(2025, 3, 20)); // April 20, 2025 (Sunday)

      const { startDate, endDate } = getCurrentWeekDates();

      // Verify Monday (start of week)
      expect(startDate.getDate()).toBe(14); // Should be April 14
      
      // Verify Sunday (end of week)
      expect(endDate.getDate()).toBe(20); // Should be April 20
    });

    test('getPreviousWeekDates returns dates exactly 7 days before current week', () => {
      // Mock date to a Wednesday
      advanceTo(new Date(2025, 3, 16)); // April 16, 2025 (Wednesday)

      // Get current week dates first
      const currentWeek = getCurrentWeekDates();
      // Get previous week dates
      const { startDate, endDate } = getPreviousWeekDates();

      // Verify previous Monday is 7 days before current Monday
      expect(startDate.getTime()).toBe(currentWeek.startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Verify previous Sunday is 7 days before current Sunday
      expect(endDate.getTime()).toBe(new Date(currentWeek.startDate.getTime() - 7 * 24 * 60 * 60 * 1000 + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000 + 999).getTime());
      
      // Verify it's the correct date
      expect(startDate.getDate()).toBe(7); // Should be April 7
      expect(endDate.getDate()).toBe(13); // Should be April 13
    });
  });

  test('correctly transforms API data into props for DefaultDashboard component', async () => {
    // Mock date to match our test data
    advanceTo(new Date(2025, 3, 16)); // April 16, 2025

    // Call the component function
    const result = await DefaultDashboardPage();

    // Ensure a valid React element is returned
    if (!React.isValidElement(result)) {
      throw new Error('Component did not return valid React element');
    }

    // Render the component
    const { findByTestId } = render(result);
    
    // Wait for Dashboard component to finish rendering
    await findByTestId('dashboard-component');

    // Check that DefaultDashboard was called
    expect(DefaultDashboard).toHaveBeenCalledTimes(1);

    // Get props passed to DefaultDashboard
    const dashboardProps = (DefaultDashboard as jest.Mock).mock.calls[0][0] as DefaultDashboardProps;
    
    // Verify initialData exists
    expect(dashboardProps.initialData).toBeDefined();
    
    // Extract initialData for cleaner test code
    const { initialData } = dashboardProps;
    
    // Verify participant data transformation
    expect(initialData.totalUsers).toBe(mockCurrentWeekData.participants.total);
    expect(initialData.totalActiveUsers).toBe(mockCurrentWeekData.participants.active);
    expect(initialData.totalInactiveUsers).toBe(mockCurrentWeekData.participants.inactive);
    
    // Verify treatment data transformation
    expect(initialData.totalTreatmentData.sessions).toBe(mockCurrentWeekData.activity.totalSessions);
    expect(initialData.totalTreatmentData.sets).toBe(mockCurrentWeekData.activity.totalSets);
    expect(initialData.totalTreatmentData.breaths).toBe(mockCurrentWeekData.activity.totalBreaths);
    
    // Verify derived calculations
    expect(initialData.totalTreatmentData.durationAdherentBreaths).toBe(Math.round(mockCurrentWeekData.activity.totalBreaths * 0.9));
    expect(initialData.totalTreatmentData.pressureAdherentBreaths).toBe(Math.round(mockCurrentWeekData.activity.totalBreaths * 0.85));
    
    // Verify date range transformation
    expect(initialData.dateRange.startDate).toBeInstanceOf(Date);
    expect(initialData.dateRange.endDate).toBeInstanceOf(Date);
    expect(initialData.dateRange.startDate.toISOString().split('T')[0]).toBe(mockCurrentWeekData.dateRange.startDate);
    expect(initialData.dateRange.endDate.toISOString().split('T')[0]).toBe(mockCurrentWeekData.dateRange.endDate);

    // Verify change calculations
    expect(initialData.changes.totalUsers).toBe(mockCurrentWeekData.participants.total - mockPreviousWeekData.participants.total);
    expect(initialData.changes.activeUsers).toBe(mockCurrentWeekData.participants.active - mockPreviousWeekData.participants.active);
    expect(initialData.changes.inactiveUsers).toBe(mockCurrentWeekData.participants.inactive - mockPreviousWeekData.participants.inactive);
    expect(initialData.changes.sessions).toBe(mockCurrentWeekData.activity.totalSessions - mockPreviousWeekData.activity.totalSessions);
    expect(initialData.changes.sets).toBe(mockCurrentWeekData.activity.totalSets - mockPreviousWeekData.activity.totalSets);
    expect(initialData.changes.breaths).toBe(mockCurrentWeekData.activity.totalBreaths - mockPreviousWeekData.activity.totalBreaths);
  });

  test('handles API errors gracefully', async () => {
    // Clear previous mocks
    jest.clearAllMocks();
    
    // Suppress console.error during this test
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Override server handlers to simulate API failures
    server.use(
      http.get('*/api/analytics/participants', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    
    // Mock date to match our test data
    advanceTo(new Date(2025, 3, 16)); // April 16, 2025
    
    // Call the component function
    const result = await DefaultDashboardPage();
    
    // Ensure a valid React element is returned
    if (!React.isValidElement(result)) {
      throw new Error('Component did not return valid React element');
    }
    
    // Render the component
    const { findByTestId } = render(result);
    
    // Wait for Dashboard component to finish rendering
    await findByTestId('dashboard-component');
    
    // Check that DefaultDashboard was called
    expect(DefaultDashboard).toHaveBeenCalledTimes(1);
    
    // Get props passed to DefaultDashboard
    const dashboardProps = (DefaultDashboard as jest.Mock).mock.calls[0][0] as DefaultDashboardProps;
    
    // Verify initialData exists
    expect(dashboardProps.initialData).toBeDefined();
    
    // Extract initialData for cleaner test code
    const { initialData } = dashboardProps;
    
    // Verify fallback values are used for user data
    expect(initialData.totalUsers).toBe(0);
    expect(initialData.totalActiveUsers).toBe(0);
    expect(initialData.totalInactiveUsers).toBe(0);
    
    // Verify fallback treatment data
    expect(initialData.totalTreatmentData.sessions).toBe(0);
    expect(initialData.totalTreatmentData.sets).toBe(0);
    expect(initialData.totalTreatmentData.breaths).toBe(0);
    expect(initialData.totalTreatmentData.durationAdherentBreaths).toBe(0);
    expect(initialData.totalTreatmentData.pressureAdherentBreaths).toBe(0);
    
    // Verify date range is still provided from helper function
    expect(initialData.dateRange).toBeDefined();
    expect(initialData.dateRange.startDate).toBeInstanceOf(Date);
    expect(initialData.dateRange.endDate).toBeInstanceOf(Date);
    
    // Monday April 14, 2025
    expect(initialData.dateRange.startDate.getDate()).toBe(14);
    expect(initialData.dateRange.startDate.getMonth()).toBe(3);
    expect(initialData.dateRange.startDate.getFullYear()).toBe(2025);
    
    // Sunday April 20, 2025
    expect(initialData.dateRange.endDate.getDate()).toBe(20);
    expect(initialData.dateRange.endDate.getMonth()).toBe(3);
    expect(initialData.dateRange.endDate.getFullYear()).toBe(2025);
    
    // Verify all changes are zero
    expect(initialData.changes.totalUsers).toBe(0);
    expect(initialData.changes.activeUsers).toBe(0);
    expect(initialData.changes.inactiveUsers).toBe(0);
    expect(initialData.changes.sessions).toBe(0);
    expect(initialData.changes.sets).toBe(0);
    expect(initialData.changes.breaths).toBe(0);
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});