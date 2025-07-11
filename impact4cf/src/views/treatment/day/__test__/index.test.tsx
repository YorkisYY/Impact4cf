// Set up all mocks 
import { setupAllMocks } from '@/test/mocks/setupTestMocks';
setupAllMocks();
import { cleanup } from '@testing-library/react';
import { jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'
import "@testing-library/jest-dom/jest-globals"
import Profile from '../index';
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { act } from 'react-dom/test-utils';
import { beforeAll, afterAll, afterEach, describe, test, expect } from '@jest/globals';
import dayjs from 'dayjs';
import { DayInfoProps } from '../DayInfo';
import { SessionsListProps } from '../SessionsList';
import { ParticipantInfoProps } from '../../ParticipantInfo';
import { PrescriptionInfoProps } from '../../PrescriptionInfo';
// Define a type for the authFetcherWithRedirect function mock
type AuthFetcherType = (url: string) => Promise<any>;

// Mock dependencies
jest.mock('@/utils/withAuthRedirect', () => ({
  authFetcherWithRedirect: jest.fn<AuthFetcherType>()
}));

// Mock child components
jest.mock('../DayInfo', () => {
  return {
    __esModule: true,
    default: jest.fn<React.FC<DayInfoProps>>().mockImplementation((props) => (
      <div data-testid="day-info">
        <div data-testid="day-info-loading">{String(props.isLoading)}</div>
        <div data-testid="day-info-sessions">{props.treatmentInfo?.actSessions || 0}</div>
        <div data-testid="day-info-sets">{props.treatmentInfo?.sets || 0}</div>
        <div data-testid="day-info-breaths">{props.treatmentInfo?.breaths || 0}</div>
        <div data-testid="day-info-breath-data-loading">{String(props.isLoadingBreathData)}</div>
      </div>
    ))
  };
});

jest.mock('../SessionsList', () => {
  return {
    __esModule: true,
    default: jest.fn<React.FC<SessionsListProps>>().mockImplementation((props) => (
      <div data-testid="sessions-list">
        <div data-testid="sessions-list-loading">{String(props.isLoading)}</div>
        <div data-testid="sessions-list-count">{props.sessionInfo.length}</div>
      </div>
    ))
  };
});

jest.mock('../../ParticipantInfo', () => {
  return {
    __esModule: true, 
    default: jest.fn<React.FC<ParticipantInfoProps>>().mockImplementation((participantInfo) => (
      <div data-testid="participant-info">
        <div data-testid="participant-username">{participantInfo.participantInfo.username}</div>
      </div>
    ))
  };
});

jest.mock('../../PrescriptionInfo', () => {
    return {
      __esModule: true,
      default: jest.fn<React.FC<PrescriptionInfoProps>>().mockImplementation((props) => {
        const prescription = Array.isArray(props.PrescriptionInfo)
          ? props.PrescriptionInfo[0]
          : props.PrescriptionInfo;
        return (
          <div data-testid="prescription-info">
            <div data-testid="prescription-target">{prescription.breathPressureTarget}</div>
          </div>
        );
      })
    };
  });
  

// Mock DatePicker
jest.mock('antd', () => {
  const original = jest.requireActual('antd') as object;
  return {
    ...original,
    DatePicker: ({ value, onChange }: { value: any; onChange: (date: any) => void }) => (
      <div data-testid="date-picker">
        <span data-testid="current-date">{value.format('YYYY-MM-DD')}</span>
        <button 
          data-testid="change-date-button" 
          onClick={() => onChange(dayjs('2025-04-02'))}
        >
          Change Date
        </button>
      </div>
    ),
    ConfigProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
  };
});

// Sample mock data
const mockInitialData = {
  participantInfo: {
    username: 'Test User',
    trialStage: 'Active',
    deviceMode: 'Standard',
    lastSeen: '2025-04-01T12:00:00Z',
    lastACT: '2025-04-01T10:00:00Z'
  },
  prescriptionInfo: {
    username: 'Test User',
    actSessionsPerDay: 3,
    setsPerACTSession: 2,
    breathsPerSet: 10,
    breathLength: 3,
    breathPressureTarget: 20,
    breathPressureRange: 5
  },
  participantTreatmentInfo: [
    {
      date: '2025-04-01',
      actSessions: 2,
      sets: 4,
      breaths: 40
    }
  ],
  sessionInfo: [
    {
      id: 'session-1',
      displayId: 'Session 1',
      index: 1,
      duration: 1200,
      sets: 2,
      breaths: 20,
      startTime: new Date('2025-04-01T10:00:00Z'),
      endTime: new Date('2025-04-01T10:20:00Z')
    }
  ],
  breathData: [],
  date: new Date('2025-04-01')
};

const initialDataWithBreath = {
    ...mockInitialData,
    breathData: new Array(10).fill({ dummy: true })
};
// Mock API response data
const mockUserData = {
  name: 'Updated User',
  trialStage: 'Active',
  deviceMode: 'Standard',
  lastActive: '2025-04-02T12:00:00Z',
  lastTreatment: '2025-04-02T10:00:00Z'
};

const mockDayData = {
  totalSessions: 3,
  totalSets: 6,
  totalExhales: 60,
  treatmentSessions: [
    {
      uid: 'session-1',
      prescriptionId: 'prescription-1',
      startTime: '2025-04-02T10:00:00Z',
      endTime: '2025-04-02T10:20:00Z',
      duration: 1200000,
      totalSets: 2,
      totalExhales: 20,
      treatmentSets: [
        {
          uid: 'set-1',
          sessionId: 'session-1',
          startTime: '2025-04-02T10:00:00Z',
          endTime: '2025-04-02T10:10:00Z',
          duration: 600000,
          treatmentExhales: [
            {
              uid: 'exhale-1',
              sequenceNumber: 1,
              startTime: '2025-04-02T10:00:10Z',
              endTime: '2025-04-02T10:00:13Z',
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
  exhaleTargetRange: 5
};

// Set up MSW server for API mocking
const server = setupServer(
  // User data endpoint
  http.get('*/api/users/:userId', () => {
    return HttpResponse.json(mockUserData);
  }),
  
  // Day data endpoint
  http.get('*/api/treatments/:userId/days/:date', () => {
    return HttpResponse.json(mockDayData);
  }),
  
  // Prescription endpoint
  http.get('*/api/prescriptions/:prescriptionId', () => {
    return HttpResponse.json(mockPrescription);
  }),
  
  // User prescription endpoint
  http.get('*/api/prescriptions/user/:userId', () => {
    return HttpResponse.json(mockPrescription);
  })
);

describe('Day Profile Component', () => {
  // Set up and tear down MSW server
  beforeAll(() => server.listen());
  afterEach(() => {
    cleanup();
    server.resetHandlers();
    jest.clearAllMocks();
  });
  afterAll(() => server.close());

  test('renders correctly with initial data', () => {
    render(
      <Profile
        initialData={mockInitialData}
        userId="test-user-id"
        date="2025-04-01"
      />
    );

    // Check component structure
    expect(screen.getByTestId('day-info')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-list')).toBeInTheDocument();
    expect(screen.getByTestId('participant-info')).toBeInTheDocument();
    expect(screen.getByTestId('prescription-info')).toBeInTheDocument();
    
    // Verify data is passed correctly to child components
    expect(screen.getByTestId('participant-username')).toHaveTextContent('Test User');
    expect(screen.getByTestId('day-info-sessions')).toHaveTextContent('2');
    expect(screen.getByTestId('day-info-sets')).toHaveTextContent('4');
    expect(screen.getByTestId('day-info-breaths')).toHaveTextContent('40');
    expect(screen.getByTestId('sessions-list-count')).toHaveTextContent('1');
  });

  test('fetches new data when date changes', async () => {
    // Mock API responses
    (authFetcherWithRedirect as jest.MockedFunction<AuthFetcherType>).mockImplementation((url: string) => {
      if (url.includes('api/users/')) {
        return Promise.resolve(mockUserData);
      }
      if (url.includes('api/treatments/') && url.includes('/days/2025-04-02')) {
        return Promise.resolve(mockDayData);
      }
      if (url.includes('api/prescriptions/prescription-1')) {
        return Promise.resolve(mockPrescription);
      }
      if (url.includes('api/prescriptions/user/')) {
        return Promise.resolve(mockPrescription);
      }
    //   return Promise.reject(new Error('Unknown URL'));
      return Promise.resolve({});
    });

    // render(
    //   <Profile
    //     initialData={mockInitialData}
    //     userId="test-user-id"
    //     date="2025-04-01"
    //   />
    // );
    const { unmount } = render(
        <Profile
          initialData={initialDataWithBreath} 
          userId="test-user-id"
          date="2025-04-01"
        />
    );

    // Initially not loading
    // expect(screen.getByTestId('day-info-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('current-date')).toHaveTextContent('2025-04-01');

    // Trigger date change
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-date-button'));
      await Promise.resolve();
    });

    // Wait for loading to finish
    // await waitFor(() => {
    //     expect(screen.getByTestId('day-info-loading')).toHaveTextContent('false');
    // });

    // Verify API calls
    expect(authFetcherWithRedirect).toHaveBeenCalledWith(
      expect.stringContaining('api/users/test-user-id')
    );
    expect(authFetcherWithRedirect).toHaveBeenCalledWith(
      expect.stringContaining('api/treatments/test-user-id/days/2025-04-02')
    );
    // Additional assertions for updated component state would go here
    unmount();
  }, 20000);

  test('handles API errors gracefully', async () => {
    // Override server handlers to simulate API failures
    server.use(
      http.get('*/api/users/:userId', () => {
        return new HttpResponse(null, { status: 500 });
      }),
      
      http.get('*/api/treatments/:userId/days/:date', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    // Mock console.error to avoid test output noise
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const { unmount } = render(
      <Profile
        initialData={initialDataWithBreath}
        userId="test-user-id"
        date="2025-04-01"
      />
    );

    // Trigger date change
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-date-button'));
      await Promise.resolve();
    });

    // Wait for loading to finish
    // await waitFor(() => {
    //     expect(screen.getByTestId('day-info-loading')).toHaveTextContent('false');
    // });

    // Should still render without crashing even after API errors
    expect(screen.getByTestId('day-info')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-list')).toBeInTheDocument();
    expect(screen.getByTestId('participant-info')).toBeInTheDocument();
    expect(screen.getByTestId('prescription-info')).toBeInTheDocument();

    // Restore console.error
    console.error = originalConsoleError;
    unmount()
  }, 10000);

  test('processes breath data correctly', async () => {
    // Create mock data with breath values
    const mockBreathData = {
      ...mockDayData,
      treatmentSessions: [
        {
          ...mockDayData.treatmentSessions[0],
          treatmentSets: [
            {
              ...mockDayData.treatmentSessions[0].treatmentSets[0],
              treatmentExhales: [
                {
                  uid: 'exhale-1',
                  sequenceNumber: 1,
                  startTime: '2025-04-02T10:00:10Z',
                  endTime: '2025-04-02T10:00:13Z',
                  duration: 3000,
                  values: {
                    data: [0, 0, 0, 0, 65, 66, 10, 65, 0, 0, 0, 0] // Float32 representation
                  }
                }
              ]
            }
          ]
        }
      ]
    };

    // Mock the API response with breath data
    (authFetcherWithRedirect as jest.MockedFunction<AuthFetcherType>).mockImplementation((url: string) => {
      if (url.includes('api/users/')) {
        return Promise.resolve(mockUserData);
      }
      if (url.includes('api/treatments/') && url.includes('/days/2025-04-02')) {
        return Promise.resolve(mockBreathData);
      }
      if (url.includes('api/prescriptions/prescription-1')) {
        return Promise.resolve(mockPrescription);
      }
      if (url.includes('api/prescriptions/user/')) {
        return Promise.resolve(mockPrescription);
      }
    //   return Promise.reject(new Error('Unknown URL'));
      return Promise.resolve({});
    });

    const { unmount } = render(
      <Profile
        initialData={{
          ...mockInitialData,
          breathData: [] // Empty initial breath data
        }}
        userId="test-user-id"
        date="2025-04-01"
      />
    );

    // Initially should be loading breath data
    expect(screen.getByTestId('day-info-breath-data-loading')).toHaveTextContent('true');

    // Change date to trigger loading new breath data
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-date-button'));
      await Promise.resolve();
    });

    // Wait for breath data loading to finish
    await waitFor(() => {
      expect(screen.getByTestId('day-info-breath-data-loading')).toHaveTextContent('false');
    });

    // Verify breath data was processed
    expect(authFetcherWithRedirect).toHaveBeenCalledWith(
      expect.stringMatching(/api\/treatments\/test-user-id\/days\/2025-04-02/)
    );
    unmount()
  }, 20000);

  test('falls back to user prescription when session prescription is unavailable', async () => {
    // Create mock with missing prescription ID
    const mockDataWithoutPrescription = {
      ...mockDayData,
      treatmentSessions: [
        {
          ...mockDayData.treatmentSessions[0],
          prescriptionId: undefined // Remove prescription ID
        }
      ]
    };

    // Mock API responses
    (authFetcherWithRedirect as jest.MockedFunction<AuthFetcherType>).mockImplementation((url: string) => {
      if (url.includes('api/users/')) {
        return Promise.resolve(mockUserData);
      }
      if (url.includes('api/treatments/') && url.includes('/days/2025-04-02')) {
        return Promise.resolve(mockDataWithoutPrescription);
      }
      if (url.includes('api/prescriptions/user/')) {
        return Promise.resolve(mockPrescription); // User prescription as fallback
      }
        //   return Promise.reject(new Error('Unknown URL'));
      return Promise.resolve({});
    });

    const { unmount } = render(
        <Profile
          initialData={mockInitialData}
          userId="test-user-id"
          date="2025-04-01"
        />
    );

    // Change date to trigger loading new data
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-date-button'));
      await Promise.resolve();
    });

    // Wait for loading to finish
    // await waitFor(() => {
    //     expect(screen.getByTestId('day-info-loading')).toHaveTextContent('false');
    // });

    // Verify fallback to user prescription
    expect(authFetcherWithRedirect).toHaveBeenCalledWith(
      expect.stringContaining('api/prescriptions/user/test-user-id')
    );
    
    // Verify prescription info is displayed correctly
    expect(screen.getByTestId('prescription-target')).toHaveTextContent('20');
    unmount()
  }, 10000);
});