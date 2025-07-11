// Set up all mocks 
import { setupAllMocks } from '@/test/mocks/setupTestMocks';
setupAllMocks();

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
import { DaysListProps } from '../DaysList';
import { ParticipantInfoProps } from '../ParticipantInfo';
import { PrescriptionInfoProps } from '../PrescriptionInfo';

// Define the type for the authFetcherWithRedirect function
type AuthFetcherType = (url: string) => Promise<any>;

// Mock dependencies
jest.mock('@/utils/withAuthRedirect', () => ({
  authFetcherWithRedirect: jest.fn<AuthFetcherType>()
}));

jest.mock('../CustomDateRangePicker', () => {
    return function DummyDatePicker({ 
      onDateRangeChange, 
      initialDateRange 
    }: { 
      onDateRangeChange: (dateRange: { startDate: Date; endDate: Date }) => void;
      initialDateRange: { startDate: Date; endDate: Date } 
    }) {
      return (
        <div data-testid="date-picker">
          <button 
            data-testid="change-date-button" 
            onClick={() => onDateRangeChange({
              startDate: new Date('2025-04-01'),
              endDate: new Date('2025-04-07')
            })}
          >
            Change Date
          </button>
          <span>Start: {initialDateRange.startDate.toISOString()}</span>
          <span>End: {initialDateRange.endDate.toISOString()}</span>
        </div>
      );
    };
  });

jest.mock('../DaysList', () => {
    return {
      __esModule: true,
      default: jest.fn<React.FC<DaysListProps>>().mockImplementation((props) => (
        <div data-testid="days-list">
          <div data-testid="days-list-loading">{String(props.isLoading)}</div>
          <div data-testid="days-list-days-count">{props.treatmentInfo.length}</div>
          <div data-testid="days-list-user-id">{props.userId}</div>
        </div>
      )),
    };
});

jest.mock('../ParticipantInfo', () => {
  return {
    __esModule: true, 
    default: jest.fn<React.FC<ParticipantInfoProps>>().mockImplementation((participantInfo) => (
      <div data-testid="participant-info">
        <div data-testid="participant-username">{participantInfo.participantInfo.username}</div>
      </div>
    )),
  };
});

jest.mock('../PrescriptionInfo', () => {
  return {
    __esModule: true,
    default: jest.fn<React.FC<PrescriptionInfoProps>>().mockImplementation((PrescriptionInfo) => (
      <div data-testid="prescription-info">
        <div data-testid="prescription-count">{Array.isArray(PrescriptionInfo) ? PrescriptionInfo.length : 0}</div>
      </div>
    )),
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
  prescriptionInfo: [
    {
      id: 'prescription-1',
      username: 'Test User',
      actSessionsPerDay: 3,
      setsPerACTSession: 2,
      breathsPerSet: 10,
      breathLength: 3,
      breathPressureTarget: 20,
      breathPressureRange: 5
    }
  ],
  participantTreatmentInfo: [
    {
      date: '2025-04-01',
      actSessions: 2,
      sets: 4,
      breaths: 40,
      breathData: []
    }
  ],
  dateRange: {
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-04-07')
  }
};

// Mock API response data
const mockUserData = {
  name: 'Updated User',
  trialStage: 'Active',
  deviceMode: 'Standard',
  lastActive: '2025-04-02T12:00:00Z',
  lastTreatment: '2025-04-02T10:00:00Z'
};

const mockDaysData = [
  {
    date: '2025-04-02T00:00:00Z',
    totalSessions: 3,
    totalSets: 6,
    totalExhales: 60
  }
];

const mockDayDetailsResponse = {
  totalSessions: 3,
  totalSets: 6,
  totalExhales: 60,
  treatmentSessions: [
    {
      uid: 'session-1',
      prescriptionId: 'prescription-1',
      treatmentSets: [
        {
          uid: 'set-1',
          treatmentExhales: [{ uid: 'exhale-1', sequenceNumber: 1 }],
          treatmentExhaleGaps: [{ uid: 'gap-1', sequenceNum: 2 }]
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
  
  // Days data endpoint
  http.get('*/api/treatments/:userId/days', () => {
    return HttpResponse.json(mockDaysData);
  }),
  
  // Day details endpoint
  http.get('*/api/treatments/:userId/days/:date', () => {
    return HttpResponse.json(mockDayDetailsResponse);
  }),
  
  // Prescription endpoint
  http.get('*/api/prescriptions/:prescriptionId', () => {
    return HttpResponse.json(mockPrescription);
  })
);

describe('Profile Component', () => {
  // Set up and tear down MSW server
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });
  afterAll(() => server.close());

  test('renders correctly with initial data', () => {
    render(
      <Profile
        initialData={mockInitialData}
        userId="test-user-id"
      />
    );

    // Check component structure
    expect(screen.getByTestId('days-list')).toBeInTheDocument();
    expect(screen.getByTestId('participant-info')).toBeInTheDocument();
    expect(screen.getByTestId('prescription-info')).toBeInTheDocument();
    
    // Verify data is passed correctly to child components
    expect(screen.getByTestId('participant-username')).toHaveTextContent('Test User');
    expect(screen.getByTestId('days-list-days-count')).toHaveTextContent('1');
    expect(screen.getByTestId('days-list-user-id')).toHaveTextContent('test-user-id');
  });

  test('handles date range changes and fetches new data', async () => {
    // Mock API responses
    (authFetcherWithRedirect as jest.MockedFunction<AuthFetcherType>).mockImplementation((url: string) => {
      if (url.includes('api/users/')) {
        return Promise.resolve(mockUserData);
      }
      if (url.includes('api/treatments/') && url.includes('/days?')) {
        return Promise.resolve(mockDaysData);
      }
      if (url.includes('api/treatments/') && url.includes('/days/')) {
        return Promise.resolve(mockDayDetailsResponse);
      }
      if (url.includes('api/prescriptions/')) {
        return Promise.resolve(mockPrescription);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <Profile
        initialData={mockInitialData}
        userId="test-user-id"
      />
    );

    // Initially not loading
    expect(screen.getByTestId('days-list-loading')).toHaveTextContent('false');

    // Trigger date change
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-date-button'));
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByTestId('days-list-loading')).toHaveTextContent('false');
    });

    // Verify API calls
    expect(authFetcherWithRedirect).toHaveBeenCalledWith(
      expect.stringContaining('api/users/test-user-id')
    );
    expect(authFetcherWithRedirect).toHaveBeenCalledWith(
      expect.stringContaining('api/treatments/test-user-id/days?startDate=2025-04-01&endDate=2025-04-07')
    );
    expect(authFetcherWithRedirect).toHaveBeenCalledWith(
      expect.stringMatching(/api\/treatments\/test-user-id\/days\/\d{4}-\d{2}-\d{2}/)
    );
  });

  test('handles API errors gracefully', async () => {
    // Override server handlers to simulate API failures
    server.use(
      http.get('*/api/users/:userId', () => {
        return new HttpResponse(null, { status: 500 });
      }),
      
      http.get('*/api/treatments/:userId/days', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    // Mock console.error to avoid test output noise
    const originalConsoleError = console.error;
    console.error = jest.fn();

    render(
      <Profile
        initialData={mockInitialData}
        userId="test-user-id"
      />
    );

    // Trigger date change
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-date-button'));
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByTestId('days-list-loading')).toHaveTextContent('false');
    });

    // Should still render without crashing even after API errors
    expect(screen.getByTestId('days-list')).toBeInTheDocument();
    expect(screen.getByTestId('participant-info')).toBeInTheDocument();
    expect(screen.getByTestId('prescription-info')).toBeInTheDocument();

    // Restore console.error
    console.error = originalConsoleError;
  });

  test('handles empty treatment days gracefully', async () => {
    // Mock empty days response
    (authFetcherWithRedirect as jest.MockedFunction<AuthFetcherType>).mockImplementation((url: string) => {
      if (url.includes('api/users/')) {
        return Promise.resolve(mockUserData);
      }
      if (url.includes('api/treatments/') && url.includes('/days?')) {
        return Promise.resolve([]);
      }
      if (url.includes('api/prescriptions/user/')) {
        return Promise.resolve(mockPrescription);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <Profile
        initialData={mockInitialData}
        userId="test-user-id"
      />
    );

    // Trigger date change
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-date-button'));
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByTestId('days-list-loading')).toHaveTextContent('false');
    });

    // Verify it fetches user's prescription when no treatment days are found
    expect(authFetcherWithRedirect).toHaveBeenCalledWith(
      expect.stringContaining('api/prescriptions/user/test-user-id')
    );

    // UI should still be intact
    expect(screen.getByTestId('days-list')).toBeInTheDocument();
    expect(screen.getByTestId('prescription-info')).toBeInTheDocument();
  });
});