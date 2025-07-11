import { jest } from '@jest/globals';
import AllDaysTreatmentPage from '../page';
import React from 'react';
import Profile, { ProfileProps } from 'views/treatment';
import { render } from '@testing-library/react';
import { advanceTo, clear } from 'jest-date-mock';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach, describe, test, expect } from '@jest/globals';
import '@testing-library/jest-dom';


// Mock the Next.js router to avoid errors related to routing
// This mock is used to simulate the behavior of cookie handling in a Next.js application during testing. 
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => ({ name, value: 'mock-token' }),
    getAll: () => [],
  }),
}));

// Mock the Profile component with a testable implementation and explicitly type it
jest.mock('views/treatment', () => {
  return {
    __esModule: true,
    default: jest.fn<React.FC<ProfileProps>>().mockImplementation((props) => {
      return (
        <div data-testid="profile-component">
          <div data-testid="user-id">{props.userId}</div>
          {props.initialData && (
            <div data-testid="has-initial-data">true</div>
          )}
        </div>
      );
    }),
  };
});


// Mock API data
const mockUserData = {
  name: 'Test User',
  trialStage: 'Active',
  deviceMode: 'Standard',
  lastActive: '2025-04-01T12:00:00Z',
  lastTreatment: '2025-04-01T10:30:00Z',
};

const mockDaysData = [
  { date: '2025-04-01T00:00:00Z', totalSessions: 2, totalSets: 4, totalExhales: 20 },
];

const mockDayDetailsResponse = {
  totalSessions: 2,
  totalSets: 4,
  totalExhales: 20,
  treatmentSessions: [
    {
      uid: 'session-1',
      prescriptionId: 'prescription-1',
      treatmentSets: [
        {
          uid: 'set-1',
          treatmentExhales: [{ uid: 'exhale-1', sequenceNumber: 1 }],
          treatmentExhaleGaps: [{ uid: 'gap-1', sequenceNum: 1 }],
        },
      ],
    },
  ],
};

const mockPrescription = {
  uid: 'prescription-1',
  sessionsPerDay: 3,
  setsPerSession: 2,
  exhalesPerSet: 10,
  exhaleDuration: 3,
  exhaleTargetPressure: 20,
  exhaleTargetRange: 5,
};

// Setup MSW server
const server = setupServer(
  // User data endpoint
  http.get('*/api/users/:userId', () => {
    return HttpResponse.json(mockUserData);
  }),
  
  // Days data endpoint
  http.get('*/api/treatments/:userId/days', () => {
    return HttpResponse.json(mockDaysData);
  }),
  
  // Day details endpoint
  http.get('*/api/treatments/:userId/days/:date', () => {
    return HttpResponse.json(mockDayDetailsResponse);
  }),
  
  // Prescription by ID endpoint
  http.get('*/api/prescriptions/:prescriptionId', () => {
    return HttpResponse.json(mockPrescription);
  }),
  
  // User prescription endpoint
  http.get('*/api/prescriptions/user/:userId', () => {
    return HttpResponse.json(mockPrescription);
  })
);

// Extract getCurrentWeekDates for direct testing
const { getCurrentWeekDates } = jest.requireActual('../page') as { 
  getCurrentWeekDates: () => { startDate: Date, endDate: Date } 
};

describe('Treatment Page', () => {
  // Set up and tear down MSW server
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
    clear();
  });
  afterAll(() => server.close());

  describe('getCurrentWeekDates function', () => {
    test('returns the correct date range for a weekday', () => {
      // Mock date to a Wednesday
      advanceTo(new Date(2025, 3, 16)); // April 16, 2025 (Wednesday)

      const { startDate, endDate } = getCurrentWeekDates();

      // Verify Monday (start of week)
      expect(startDate.getDate()).toBe(14);
      expect(startDate.getMonth()).toBe(3);
      expect(startDate.getFullYear()).toBe(2025);
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);

      // Verify Wednesday (current day as end date)
      expect(endDate.getDate()).toBe(16);
      expect(endDate.getMonth()).toBe(3);
      expect(endDate.getFullYear()).toBe(2025);
    });

    test('handles Sunday correctly', () => {
      // Mock date to a Sunday
      advanceTo(new Date(2025, 3, 20)); // April 20, 2025 (Sunday)

      const { startDate, endDate } = getCurrentWeekDates();

      // Verify Monday (start of week)
      expect(startDate.getDate()).toBe(14);
      
      // Verify Sunday (end date)
      expect(endDate.getDate()).toBe(20);
    });
  });

  describe('AllDaysTreatmentPage component', () => {
    test('correctly transforms API data into props for Profile component', async () => {
      // Call the function directly instead of rendering it as JSX
      const result = await AllDaysTreatmentPage({ params: { userId: 'test-user-id' } });
      // Ensure a valid React element is returned
      if (!React.isValidElement(result)) {
        throw new Error('Component did not return valid React element');
      }
      // Render the component using testing library
      const { findByTestId } = render(result);
      
      // Wait for Profile component to finish rendering
      await findByTestId('profile-component');

      // Check that Profile was called
      expect(Profile).toHaveBeenCalledTimes(1);

      // Rest of your assertions
      const profileProps = (Profile as jest.Mock).mock.calls[0][0] as ProfileProps;
      
      // Verify userId prop
      expect(profileProps.userId).toBe('test-user-id');
      
      // Verify initialData exists
      expect(profileProps.initialData).toBeDefined();
      
      // Extract initialData for cleaner test code
      const { initialData } = profileProps;
      
      // Verify participant info transformation
      expect(initialData.participantInfo).toEqual({
        username: mockUserData.name,
        trialStage: mockUserData.trialStage,
        deviceMode: mockUserData.deviceMode,
        lastSeen: mockUserData.lastActive,
        lastACT: mockUserData.lastTreatment
      });
      
      // Verify prescription info transformation
      expect(initialData.prescriptionInfo.length).toBeGreaterThan(0);
      expect(initialData.prescriptionInfo[0]).toEqual(expect.objectContaining({
        id: mockPrescription.uid,
        actSessionsPerDay: mockPrescription.sessionsPerDay,
        setsPerACTSession: mockPrescription.setsPerSession,
        breathsPerSet: mockPrescription.exhalesPerSet,
        breathLength: mockPrescription.exhaleDuration,
        breathPressureTarget: mockPrescription.exhaleTargetPressure,
        breathPressureRange: mockPrescription.exhaleTargetRange
      }));
      
      // Verify treatment info transformation
      expect(initialData.participantTreatmentInfo.length).toBeGreaterThan(0);
      expect(initialData.participantTreatmentInfo[0]).toEqual(expect.objectContaining({
        date: expect.any(String),
        actSessions: mockDayDetailsResponse.totalSessions,
        sets: mockDayDetailsResponse.totalSets,
        breaths: mockDayDetailsResponse.totalExhales,
        breathData: expect.arrayContaining([
          expect.objectContaining({
            sessionId: 'session-1',
            setId: 'set-1'
          })
        ])
      }));
      
      // Verify date range is provided
      expect(initialData.dateRange).toBeDefined();
      expect(initialData.dateRange.startDate).toBeInstanceOf(Date);
      expect(initialData.dateRange.endDate).toBeInstanceOf(Date);
    });

    // Test for error handling
    test('handles API errors gracefully', async () => {
      // Clear previous mocks
      jest.clearAllMocks();
      
      // Override server handlers to simulate all API request failures
      server.use(
        // User data request failure
        http.get('*/api/users/:userId', () => {
          return new HttpResponse(null, { status: 500 });
        }),
        
        // Date range days data request failure
        http.get('*/api/treatments/:userId/days', () => {
          return new HttpResponse(null, { status: 500 });
        }),
        
        // Single date details request failure
        http.get('*/api/treatments/:userId/days/:date', () => {
          return new HttpResponse(null, { status: 500 });
        }),
        
        // Prescription data request failure
        http.get('*/api/prescriptions/user/:userId', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );
      
      // Directly call the component function
      const result = await AllDaysTreatmentPage({ params: { userId: 'test-user-id' } });
      
      // Ensure a valid React element is returned
      if (!React.isValidElement(result)) {
        throw new Error('Component did not return valid React element');
      }
      
      // Render the component
      const { findByTestId } = render(result);
      
      // Wait for Profile component to finish rendering
      await findByTestId('profile-component');
      
      // Verify Profile component was called
      expect(Profile).toHaveBeenCalledTimes(1);
      
      // Get props passed to Profile
      const profileProps = (Profile as jest.Mock).mock.calls[0][0] as ProfileProps;
      
      // Verify userId is still correctly passed
      expect(profileProps.userId).toBe('test-user-id');
      
      // Verify initialData exists
      expect(profileProps.initialData).toBeDefined();
      
      // Extract initialData for testing
      const { initialData } = profileProps;
      
      // Verify fallback values are used for user data
      expect(initialData.participantInfo).toEqual({
        username: "NaN",
        trialStage: "NaN",
        deviceMode: "NaN",
        lastSeen: expect.any(Date),
        lastACT: expect.any(Date)
      });
      
      // Verify empty array is used for treatment info
      expect(initialData.participantTreatmentInfo).toEqual([]);
      
      // Verify fallback values are used for prescription info
      expect(initialData.prescriptionInfo.length).toBe(1);
      expect(initialData.prescriptionInfo[0]).toEqual({
        username: "NaN", // Retrieved from participantInfo
        actSessionsPerDay: 0,
        setsPerACTSession: 0,
        breathsPerSet: 0,
        breathLength: 0,
        breathPressureTarget: 0,
        breathPressureRange: 0
      });
      
      // Verify date range is still provided
      expect(initialData.dateRange).toBeDefined();
      expect(initialData.dateRange.startDate).toBeInstanceOf(Date);
      expect(initialData.dateRange.endDate).toBeInstanceOf(Date);
    });
  });
});