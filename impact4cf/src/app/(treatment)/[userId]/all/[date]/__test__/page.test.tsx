import { jest } from '@jest/globals';
import DayProfilePage from '../page';
import React from 'react';
import Profile, {ProfileProps} from 'views/treatment/day';
import { render } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach, describe, test, expect } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock Next.js router to avoid errors related to routing
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => ({ name, value: 'mock-token' }),
    getAll: () => [],
  }),
}));

// Mock Profile component
jest.mock('views/treatment/day', () => {
  return {
    __esModule: true,
    default: jest.fn<React.FC<ProfileProps>>().mockImplementation((props) => {
      return (
        <div data-testid="day-profile-component">
          <div data-testid="user-id">{props.userId}</div>
          <div data-testid="date">{props.date}</div>
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

const mockDayData = {
  totalSessions: 2,
  totalSets: 4,
  totalExhales: 20,
  treatmentSessions: [
    {
      uid: 'session-1',
      prescriptionId: 'prescription-1',
      startTime: '2025-04-01T10:00:00Z',
      endTime: '2025-04-01T10:20:00Z',
      duration: 1200000, // 20 minutes in ms
      totalSets: 2,
      totalExhales: 10,
      treatmentSets: [
        {
          uid: 'set-1',
          startTime: '2025-04-01T10:00:00Z',
          endTime: '2025-04-01T10:10:00Z',
          duration: 600000, // 10 minutes in ms
          treatmentExhales: [
            {
              uid: 'exhale-1',
              sequenceNumber: 1,
              startTime: '2025-04-01T10:00:10Z',
              endTime: '2025-04-01T10:00:13Z',
              duration: 3000
            }
          ],
          treatmentExhaleGaps: [
            {
              uid: 'gap-1',
              sequenceNum: 2,
              duration: 2000
            }
          ]
        },
        {
          uid: 'set-2',
          startTime: '2025-04-01T10:10:00Z',
          endTime: '2025-04-01T10:20:00Z',
          duration: 600000, // 10 minutes in ms
          treatmentExhales: [
            {
              uid: 'exhale-2',
              sequenceNumber: 1,
              startTime: '2025-04-01T10:10:10Z',
              endTime: '2025-04-01T10:10:13Z',
              duration: 3000
            }
          ],
          treatmentExhaleGaps: [
            {
              uid: 'gap-2',
              sequenceNum: 2,
              duration: 2000
            }
          ]
        }
      ]
    },
    {
      uid: 'session-2',
      prescriptionId: 'prescription-1',
      startTime: '2025-04-01T14:00:00Z',
      endTime: '2025-04-01T14:20:00Z',
      duration: 1200000, // 20 minutes in ms
      totalSets: 2,
      totalExhales: 10,
      treatmentSets: [
        {
          uid: 'set-3',
          startTime: '2025-04-01T14:00:00Z',
          endTime: '2025-04-01T14:10:00Z',
          duration: 600000, // 10 minutes in ms
          treatmentExhales: [
            {
              uid: 'exhale-3',
              sequenceNumber: 1,
              startTime: '2025-04-01T14:00:10Z',
              endTime: '2025-04-01T14:00:13Z',
              duration: 3000
            }
          ],
          treatmentExhaleGaps: [
            {
              uid: 'gap-3',
              sequenceNum: 2,
              duration: 2000
            }
          ]
        },
        {
          uid: 'set-4',
          startTime: '2025-04-01T14:10:00Z',
          endTime: '2025-04-01T14:20:00Z',
          duration: 600000, // 10 minutes in ms
          treatmentExhales: [
            {
              uid: 'exhale-4',
              sequenceNumber: 1,
              startTime: '2025-04-01T14:10:10Z',
              endTime: '2025-04-01T14:10:13Z',
              duration: 3000
            }
          ],
          treatmentExhaleGaps: [
            {
              uid: 'gap-4',
              sequenceNum: 2,
              duration: 2000
            }
          ]
        }
      ]
    }
  ]
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
  
  // Day data endpoint
  http.get('*/api/treatments/:userId/days/:date', () => {
    return HttpResponse.json(mockDayData);
  }),
  
  // Prescription by ID endpoint
  http.get('*/api/prescriptions/:prescriptionId', () => {
    return HttpResponse.json(mockPrescription);
  }),
  
  // User's prescription endpoint
  http.get('*/api/prescriptions/user/:userId', () => {
    return HttpResponse.json(mockPrescription);
  })
);

describe('Day Profile Page', () => {
  // Set up and tear down MSW server
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });
  afterAll(() => server.close());

  test('correctly handles valid date format', async () => {
    // Call the component with a valid date format
    const result = await DayProfilePage({ 
      params: Promise.resolve({ 
        userId: 'test-user-id',
        date: '2025-04-01'
      }) 
    });

    // Verify that it renders successfully
    const { findByTestId } = render(result);
    await findByTestId('day-profile-component');
    
    // Get props passed to Profile
    const profileProps = (Profile as jest.Mock).mock.calls[0][0] as ProfileProps;
    
    // Verify that the date was parsed correctly
    const { initialData } = profileProps;
    expect(initialData.date).toBeInstanceOf(Date);
    expect(initialData.date.getFullYear()).toBe(2025);
    expect(initialData.date.getMonth()).toBe(3); // 0-based: April
    expect(initialData.date.getDate()).toBe(1);
  });

  test('correctly transforms API data into props for Profile component', async () => {
    // Call the function directly
    const result = await DayProfilePage({ 
      params: Promise.resolve({ 
        userId: 'test-user-id',
        date: '2025-04-01'
      }) 
    });

    // Ensure a valid React element is returned
    if (!React.isValidElement(result)) {
      throw new Error('Component did not return valid React element');
    }

    // Render the component
    const { findByTestId } = render(result);
    
    // Wait for Profile component to finish rendering
    await findByTestId('day-profile-component');

    // Check that Profile was called
    expect(Profile).toHaveBeenCalledTimes(1);

    // Get props passed to Profile
    const profileProps = (Profile as jest.Mock).mock.calls[0][0] as ProfileProps;
    
    // Verify basic props
    expect(profileProps.userId).toBe('test-user-id');
    expect(profileProps.date).toBe('2025-04-01');
    
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
    expect(initialData.prescriptionInfo).toBeDefined();
    expect(initialData.prescriptionInfo).toEqual(expect.objectContaining({
      username: mockUserData.name,
      actSessionsPerDay: mockPrescription.sessionsPerDay,
      setsPerACTSession: mockPrescription.setsPerSession,
      breathsPerSet: mockPrescription.exhalesPerSet,
      breathLength: mockPrescription.exhaleDuration,
      breathPressureTarget: mockPrescription.exhaleTargetPressure,
      breathPressureRange: mockPrescription.exhaleTargetRange
    }));
    
    // Verify treatment info transformation
    expect(initialData.participantTreatmentInfo.length).toBe(1);
    expect(initialData.participantTreatmentInfo[0]).toEqual(expect.objectContaining({
      date: expect.stringContaining('2025-04-01'),
      actSessions: mockDayData.totalSessions,
      sets: mockDayData.totalSets,
      breaths: mockDayData.totalExhales
    }));
    
    // Verify session info transformation
    expect(initialData.sessionInfo.length).toBe(2);
    expect(initialData.sessionInfo[0]).toEqual(expect.objectContaining({
      id: 'session-1',
      displayId: 'Session 1',
      index: 1,
      duration: expect.any(Number),
      sets: expect.any(Number),
      breaths: expect.any(Number),
      startTime: expect.any(Date),
      endTime: expect.any(Date)
    }));
    
    // Verify breath data has been processed
    expect(initialData.breathData.length).toBeGreaterThan(0);
    
    // Check for exhale data
    const exhale = initialData.breathData.find(b => b.isGap === false);
    expect(exhale).toBeDefined();
    expect(exhale).toEqual(expect.objectContaining({
      sessionId: expect.any(String),
      setId: expect.any(String),
      sequenceType: 'exhale',
      isGap: false
    }));
    
    // Check for gap data
    const gap = initialData.breathData.find(b => b.isGap === true);
    expect(gap).toBeDefined();
    expect(gap).toEqual(expect.objectContaining({
      sessionId: expect.any(String),
      setId: expect.any(String),
      sequenceType: 'gap',
      sequenceNumber: expect.any(Number),
      isGap: true
    }));
  });

  test('handles API errors gracefully', async () => {
    // Clear previous mocks
    jest.clearAllMocks();
    
    // Suppress console.error during this test
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Override server handlers to simulate API failures
    server.use(
      // User data request failure
      http.get('*/api/users/:userId', () => {
        return new HttpResponse(null, { status: 500 });
      }),
      
      // Day data request failure
      http.get('*/api/treatments/:userId/days/:date', () => {
        return new HttpResponse(null, { status: 500 });
      }),
      
      // Prescription data request failures
      http.get('*/api/prescriptions/:prescriptionId', () => {
        return new HttpResponse(null, { status: 500 });
      }),
      
      http.get('*/api/prescriptions/user/:userId', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    
    // Directly call the component function
    const result = await DayProfilePage({ 
      params: Promise.resolve({ 
        userId: 'test-user-id',
        date: '2025-04-01'
      }) 
    });
    
    // Ensure a valid React element is returned
    if (!React.isValidElement(result)) {
      throw new Error('Component did not return valid React element');
    }
    
    // Render the component
    const { findByTestId } = render(result);
    
    // Wait for Profile component to finish rendering
    await findByTestId('day-profile-component');
    
    // Verify Profile component was called
    expect(Profile).toHaveBeenCalledTimes(1);
    
    // Get props passed to Profile
    const profileProps = (Profile as jest.Mock).mock.calls[0][0] as ProfileProps;
    
    // Verify basic props still work despite API failures
    expect(profileProps.userId).toBe('test-user-id');
    expect(profileProps.date).toBe('2025-04-01');
    
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
    
    // Verify fallback treatment info with zeros
    expect(initialData.participantTreatmentInfo).toEqual([{
      date: expect.any(String),
      actSessions: 0,
      sets: 0,
      breaths: 0
    }]);
    
    // Verify empty session info
    expect(initialData.sessionInfo).toEqual([]);
    
    // Verify empty breath data
    expect(initialData.breathData).toEqual([]);
    
    // Verify prescription info uses default values
    expect(initialData.prescriptionInfo).toBeDefined();
    expect(initialData.prescriptionInfo).toEqual(expect.objectContaining({
      username: "NaN", // From participantInfo fallback
      actSessionsPerDay: 2, // Default value from initialization
      setsPerACTSession: 5, // Default value from initialization
      breathsPerSet: 20, // Default value from initialization
      breathLength: 8, // Default value from initialization
      breathPressureTarget: 15, // Default value from initialization
      breathPressureRange: 10 // Default value from initialization
    }));
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});