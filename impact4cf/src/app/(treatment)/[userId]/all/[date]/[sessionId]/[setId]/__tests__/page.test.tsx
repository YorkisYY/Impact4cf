import { jest } from '@jest/globals';
import SetProfilePage from '../page';
import React from 'react';
import SetProfile, { SetProfileProps } from 'views/treatment/set';
import { render } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach, describe, test, expect } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock the Next.js router to avoid errors related to routing
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => ({ name, value: 'mock-token' }),
    getAll: () => [],
  }),
}));

// Mock the SetProfile component with a testable implementation
jest.mock('views/treatment/set', () => {
  return {
    __esModule: true,
    default: jest.fn<React.FC<SetProfileProps>>().mockImplementation((props) => {
      return (
        <div data-testid="set-profile-component">
          <div data-testid="user-id">{props.userId}</div>
          <div data-testid="date">{props.date}</div>
          <div data-testid="session-id">{props.sessionId}</div>
          <div data-testid="set-id">{props.setId}</div>
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

// Mock consolidated data with sessions, sets, exhales
const mockConsolidatedData = [
  {
    uid: 'session-1',
    prescriptionId: 'prescription-1',
    startTime: '2025-04-01T10:00:00Z',
    endTime: '2025-04-01T10:20:00Z',
    treatmentSets: [
      {
        uid: 'set-1',
        startTime: '2025-04-01T10:00:00Z',
        endTime: '2025-04-01T10:10:00Z',
        duration: 600000, // 10 minutes in ms
        totalExhales: 10,
        treatmentExhales: [
          {
            uid: 'exhale-1',
            sequenceNumber: 1,
            startTime: '2025-04-01T10:00:10Z',
            endTime: '2025-04-01T10:00:13Z',
            duration: 3000,
            values: {
              data: [0, 0, 0, 0, 65, 66, 10, 65, 0, 0, 0, 0] // Float32 representation of data
            }
          },
          {
            uid: 'exhale-2',
            sequenceNumber: 3,
            startTime: '2025-04-01T10:00:15Z',
            endTime: '2025-04-01T10:00:18Z',
            duration: 3000,
            values: {
              data: [0, 0, 0, 0, 70, 75, 15, 70, 0, 0, 0, 0]
            }
          }
        ],
        treatmentExhaleGaps: [
          {
            uid: 'gap-1',
            sequenceNum: 2,
            duration: 2000
          },
          {
            uid: 'gap-2',
            sequenceNumber: 4,
            duration: 2000
          }
        ]
      }
    ]
  }
];

// Mock prescription
const mockPrescription = {
  uid: 'prescription-1',
  sessionsPerDay: 3,
  setsPerSession: 2,
  exhalesPerSet: 10,
  exhaleDuration: 3,
  exhaleTargetPressure: 20,
  exhaleTargetRange: 5,
};

// Mock session data (for fallback)
const mockSessionData = {
  uid: 'session-1',
  totalSets: 1,
  startTime: '2025-04-01T10:00:00Z',
  endTime: '2025-04-01T10:20:00Z',
};

// Mock set data (for fallback)
const mockSetData = {
  uid: 'set-1',
  startTime: '2025-04-01T10:00:00Z',
  endTime: '2025-04-01T10:10:00Z',
  duration: 600000,
  totalExhales: 10,
  treatmentExhales: [
    {
      uid: 'exhale-1',
      sequenceNumber: 1,
      startTime: '2025-04-01T10:00:10Z',
      endTime: '2025-04-01T10:00:13Z',
      duration: 3000,
      values: {
        data: [0, 0, 0, 0, 65, 66, 10, 65, 0, 0, 0, 0]
      }
    }
  ],
  treatmentExhaleGaps: [
    {
      uid: 'gap-1',
      sequenceNum: 2,
      duration: 2000
    }
  ]
};

// Mock sets in session
const mockSetsInSession = [mockSetData];

// Setup MSW server
const server = setupServer(
  // Consolidated data endpoint
  http.get('*/api/treatments/:userId/sessions/:date', ({ params }) => {
    return HttpResponse.json(mockConsolidatedData);
  }),
  
  // User data endpoint
  http.get('*/api/users/:userId', () => {
    return HttpResponse.json(mockUserData);
  }),
  
  // Prescription by ID endpoint
  http.get('*/api/prescriptions/:prescriptionId', () => {
    return HttpResponse.json(mockPrescription);
  }),
  
  // Prescription by user ID endpoint
  http.get('*/api/prescriptions/user/:userId', () => {
    return HttpResponse.json(mockPrescription);
  }),

  // Session data endpoint (fallback)
  http.get('*/api/treatments/session/:sessionId', () => {
    return HttpResponse.json(mockSessionData);
  }),
  
  // Set data endpoint (fallback)
  http.get('*/api/treatments/set/:setId', () => {
    return HttpResponse.json(mockSetData);
  }),
  
  // Sets in session endpoint (fallback)
  http.get('*/api/treatments/sets/:sessionId', () => {
    return HttpResponse.json(mockSetsInSession);
  })
);

describe('Set Profile Page', () => {
  // Set up and tear down MSW server
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });
  afterAll(() => server.close());

  test('correctly transforms API data into props for SetProfile component', async () => {
    // Call the function directly instead of rendering it as JSX
    const result = await SetProfilePage({ 
      params: Promise.resolve({ 
        userId: 'test-user-id',
        date: '2025-04-01',
        sessionId: 'session-1',
        setId: 'set-1'
      }) 
    });

    // Ensure a valid React element is returned
    if (!React.isValidElement(result)) {
      throw new Error('Component did not return valid React element');
    }

    // Render the component using testing library
    const { findByTestId } = render(result);
    
    // Wait for SetProfile component to finish rendering
    await findByTestId('set-profile-component');

    // Check that SetProfile was called
    expect(SetProfile).toHaveBeenCalledTimes(1);

    // Get props passed to SetProfile
    const setProfileProps = (SetProfile as jest.Mock).mock.calls[0][0] as SetProfileProps;
    
    // Verify basic props
    expect(setProfileProps.userId).toBe('test-user-id');
    expect(setProfileProps.date).toBe('2025-04-01');
    expect(setProfileProps.sessionId).toBe('session-1');
    expect(setProfileProps.setId).toBe('set-1');
    
    // Verify initialData exists
    expect(setProfileProps.initialData).toBeDefined();
    
    // Extract initialData for cleaner test code
    const { initialData } = setProfileProps;
    
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
    
    // Verify set info transformation
    expect(initialData.setInfo).toBeDefined();
    expect(initialData.setInfo).toEqual(expect.objectContaining({
      id: 'set-1',
      displayId: 'Set 1',
      index: 1,
      sessionId: 'session-1',
      sessionIndex: 1,
      duration: expect.any(Number),
      breaths: 10,
      breathsTarget: mockPrescription.exhalesPerSet,
      startTime: expect.any(Date),
      endTime: expect.any(Date)
    }));
    
    // Verify breaths data is processed correctly 
    expect(initialData.breathsData).toBeDefined();
    expect(initialData.breathsData.length).toBeGreaterThan(0);
    
    // Check exhale data
    const exhale = initialData.breathsData.find((b: any) => b.isGap === false);
    expect(exhale).toBeDefined();
    expect(exhale).toEqual(expect.objectContaining({
      uid: expect.any(String),
      setId: 'set-1',
      sessionId: 'session-1',
      userId: 'test-user-id',
      sequenceType: 'exhale',
      isGap: false
    }));

    // Check gap data
    const gap = initialData.breathsData.find((b: any) => b.isGap === true);
    expect(gap).toBeDefined();
    expect(gap).toEqual(expect.objectContaining({
      uid: expect.any(String),
      setId: 'set-1',
      sessionId: 'session-1',
      userId: 'test-user-id',
      sequenceType: 'gap',
      isGap: true,
      sequenceNumber: expect.any(Number)
    }));
    
    // Verify breaths list contains processed exhales
    expect(initialData.breathsList).toBeDefined();
    expect(initialData.breathsList.length).toBeGreaterThan(0);
    expect(initialData.breathsList[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      index: expect.any(Number),
      displayId: expect.stringContaining('Breath '),
      duration: expect.any(Number),
      durationTarget: mockPrescription.exhaleDuration,
      pressure: expect.any(Number),
      pressureTarget: mockPrescription.exhaleTargetPressure,
      pressureTargetRange: mockPrescription.exhaleTargetRange,
      startTime: expect.any(Date),
      endTime: expect.any(Date)
    }));
  });

  test('handles API errors gracefully', async () => {
    // Clear previous mocks
    jest.clearAllMocks();
    
    // Override server handlers to simulate all API request failures
    server.use(
      // Consolidated API request failure
      http.get('*/api/treatments/:userId/sessions/:date', () => {
        return new HttpResponse(null, { status: 500 });
      }),
      
      // User data request failure
      http.get('*/api/users/:userId', () => {
        return new HttpResponse(null, { status: 500 });
      }),
      
      // Prescription data request failure
      http.get('*/api/prescriptions/user/:userId', () => {
        return new HttpResponse(null, { status: 500 });
      }),
      
      // Session data request failure
      http.get('*/api/treatments/session/:sessionId', () => {
        return new HttpResponse(null, { status: 500 });
      }),
      
      // Set data request failure
      http.get('*/api/treatments/set/:setId', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    
    // Directly call the component function
    const result = await SetProfilePage({ 
      params: Promise.resolve({ 
        userId: 'test-user-id',
        date: '2025-04-01',
        sessionId: 'session-1',
        setId: 'set-1'
      }) 
    });
    
    // Ensure a valid React element is returned
    if (!React.isValidElement(result)) {
      throw new Error('Component did not return valid React element');
    }
    
    // Render the component
    const { findByTestId } = render(result);
    
    // Wait for SetProfile component to finish rendering
    await findByTestId('set-profile-component');
    
    // Verify SetProfile component was called
    expect(SetProfile).toHaveBeenCalledTimes(1);
    
    // Get props passed to SetProfile
    const setProfileProps = (SetProfile as jest.Mock).mock.calls[0][0] as SetProfileProps;
    
    // Verify basic props still work despite API failures
    expect(setProfileProps.userId).toBe('test-user-id');
    expect(setProfileProps.date).toBe('2025-04-01');
    expect(setProfileProps.sessionId).toBe('session-1');
    expect(setProfileProps.setId).toBe('set-1');
    
    // Verify initialData exists
    expect(setProfileProps.initialData).toBeDefined();
    
    // Extract initialData for testing
    const { initialData } = setProfileProps;
    
    // Verify fallback values are used for user data
    expect(initialData.participantInfo).toEqual({
      username: "NaN",
      trialStage: "NaN",
      deviceMode: "NaN",
      lastSeen: expect.any(Date),
      lastACT: expect.any(Date)
    });
    
    // Verify fallback set info is created
    expect(initialData.setInfo).toBeDefined();
    expect(initialData.setInfo).toEqual(expect.objectContaining({
      id: 'set-1',
      displayId: 'Set 1',
      index: 1,
      sessionId: 'session-1',
      sessionIndex: expect.any(Number),
      duration: 120, // Default fallback value
      breaths: 18, // Default fallback value
      startTime: expect.any(Date),
      endTime: expect.any(Date)
    }));
    
    // Verify empty arrays for breath data
    expect(initialData.breathsData).toEqual([]);
    expect(initialData.breathsList).toEqual([]);
  });

  test('correctly calculates average pressure from buffer data', async () => {
    // Create mock data with known buffer values
    const mockBufferData = [
      {
        uid: 'session-test',
        prescriptionId: 'prescription-1',
        treatmentSets: [
          {
            uid: 'set-test',
            duration: 600000,
            totalExhales: 1,
            treatmentExhales: [
              {
                uid: 'exhale-test',
                sequenceNumber: 1,
                duration: 3000,
                values: {
                  // Create a buffer with known float32 values (here we're using an array that will produce predictable results)
                  // These values are encoded to represent specific float32 numbers
                  data: [
                    0, 0, 160, 65, // This should decode to approximately 20.0 in float32
                    0, 0, 32, 66,  // This should decode to approximately 40.0 in float32
                    0, 0, 160, 66  // This should decode to approximately 80.0 in float32
                  ]
                }
              }
            ],
            treatmentExhaleGaps: []
          }
        ]
      }
    ];

    // Override the consolidated data endpoint to return our special test data
    server.use(
      http.get('*/api/treatments/:userId/sessions/:date', () => {
        return HttpResponse.json(mockBufferData);
      })
    );

    // Call the function directly
    const result = await SetProfilePage({ 
      params: Promise.resolve({ 
        userId: 'test-user-id',
        date: '2025-04-01',
        sessionId: 'session-test',
        setId: 'set-test'
      }) 
    });

    // Render the component
    const { findByTestId } = render(result);
    await findByTestId('set-profile-component');

    // Get props passed to SetProfile
    const setProfileProps = (SetProfile as jest.Mock).mock.calls[0][0] as SetProfileProps;
    const { initialData } = setProfileProps;

    // Get the processed breath from breathsList
    expect(initialData.breathsList.length).toBe(1);
    const breath = initialData.breathsList[0];

    // Verify pressure calculation is working correctly
    // The average of 20, 40, and 80 would be approximately 46.67
    // But we're using a loose comparison due to potential floating-point differences
    expect(breath.pressure).toBeGreaterThan(40); 
    expect(breath.pressure).toBeLessThan(50);
  });
});