import { jest } from '@jest/globals';
import PrescriptionPage from '../page';
import React from 'react';
import PrescriptionPageClient from '@/views/forms/components/Prescription/PrescriptionPageClient';
import { render } from '@testing-library/react';
import { describe, test, expect } from '@jest/globals';
import '@testing-library/jest-dom';

// Define PrescriptionPageClient Props type to resolve the red underline issue
type PrescriptionPageClientProps = {
  userData: {
    uid: string;
    name: string;
    email?: string;
  };
  allPrescriptions: Array<{
    uid: string;
    name: string;
    isCurrentPrescription: boolean;
    sessionsPerDay?: number;
    setsPerSession?: number;
    exhalesPerSet?: number;
  }>;
  currentPrescription: {
    uid: string;
    name: string;
    isCurrentPrescription: boolean;
    sessionsPerDay?: number;
    setsPerSession?: number;
    exhalesPerSet?: number;
  } | null;
};

// Mock Next.js modules
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => ({ name, value: 'mock-token' }),
    getAll: () => [],
  }),
}));

// Mock the PrescriptionPageClient component
jest.mock('@/views/forms/components/Prescription/PrescriptionPageClient', () => {
  return {
    __esModule: true,
    // @ts-ignore
    default: jest.fn().mockImplementation((props: PrescriptionPageClientProps) => {
      return (
        <div data-testid="prescription-page-client">
          <div data-testid="user-data">{JSON.stringify(props.userData)}</div>
          <div data-testid="all-prescriptions">{JSON.stringify(props.allPrescriptions)}</div>
          <div data-testid="current-prescription">{JSON.stringify(props.currentPrescription)}</div>
        </div>
      );
    }),
  };
});

// Mock API data
const mockUserData = {
  uid: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
};

const mockPrescriptions = [
  {
    uid: 'prescription-1',
    name: 'Prescription 1',
    isCurrentPrescription: true,
    sessionsPerDay: 3,
    setsPerSession: 2,
    exhalesPerSet: 10,
  },
  {
    uid: 'prescription-2',
    name: 'Prescription 2',
    isCurrentPrescription: false,
    sessionsPerDay: 2,
    setsPerSession: 3,
    exhalesPerSet: 8,
  },
];

// Fixed mock function with more precise path matching
jest.mock('@/utils/withAuthRedirect', () => ({
  authFetcherWithRedirect: jest.fn((url) => {
    if (url === 'api/users/test-user-id') {
      return Promise.resolve(mockUserData);
    }
    if (url === 'api/prescriptions/user/test-user-id/all') {
      return Promise.resolve(mockPrescriptions);
    }
    console.log('Unexpected URL called:', url);
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  }),
}));

describe('PrescriptionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the implementation of mock functions
    const { authFetcherWithRedirect } = require('@/utils/withAuthRedirect');
    (authFetcherWithRedirect as jest.Mock).mockImplementation((url) => {
      if (url === 'api/users/test-user-id') {
        return Promise.resolve(mockUserData);
      }
      if (url === 'api/prescriptions/user/test-user-id/all') {
        return Promise.resolve(mockPrescriptions);
      }
      console.log('Unexpected URL called:', url);
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  test('correctly transforms API data into props for PrescriptionPageClient component', async () => {
    // Call the page component
    const result = await PrescriptionPage({ params: { userId: 'test-user-id' } });
    
    // Ensure a valid React element is returned
    if (!React.isValidElement(result)) {
      throw new Error('Component did not return valid React element');
    }
    
    // Render the component using testing library
    const { findByTestId } = render(result);
    
    // Verify the client component is rendered
    await findByTestId('prescription-page-client');
    
    // Check that PrescriptionPageClient was called with correct props
    expect(PrescriptionPageClient).toHaveBeenCalledTimes(1);
    
    // Get the props passed to PrescriptionPageClient and specify type
    const clientProps = (PrescriptionPageClient as jest.Mock).mock.calls[0][0] as PrescriptionPageClientProps;
    
    // Verify userData prop
    expect(clientProps.userData).toEqual(mockUserData);
    
    // Verify allPrescriptions prop
    expect(clientProps.allPrescriptions).toEqual(mockPrescriptions);
    
    // Verify currentPrescription prop (should be the one with isCurrentPrescription=true)
    expect(clientProps.currentPrescription).toEqual(mockPrescriptions[0]);
  });

  test('handles API errors gracefully', async () => {
    // Re-mock authFetcherWithRedirect to return an error
    const { authFetcherWithRedirect } = require('@/utils/withAuthRedirect');
    (authFetcherWithRedirect as jest.Mock).mockImplementation((url) => {
      return Promise.reject(new Error('API Error'));
    });
    
    // Call the page component
    const result = await PrescriptionPage({ params: { userId: 'test-user-id' } });
    
    // Render the component
    const { findByTestId } = render(result);
    
    // Verify the client component is rendered
    await findByTestId('prescription-page-client');
    
    // Check that PrescriptionPageClient was called
    expect(PrescriptionPageClient).toHaveBeenCalledTimes(1);
    
    // Get the props passed to client component and specify type
    const clientProps = (PrescriptionPageClient as jest.Mock).mock.calls[0][0] as PrescriptionPageClientProps;
    
    // Verify fallback user data is used
    expect(clientProps.userData).toEqual({
      uid: 'test-user-id',
      name: 'Fallback User'
    });
    
    // Verify empty prescriptions array is used
    expect(clientProps.allPrescriptions).toEqual([]);
    
    // Verify currentPrescription is null when no prescriptions are available
    expect(clientProps.currentPrescription).toBeNull();
  });

  test('selects correct current prescription', async () => {
    // Create mock prescriptions with different current status
    const prescriptionsWithMixedStatus = [
      {
        uid: 'prescription-1',
        name: 'Not Current',
        isCurrentPrescription: false
      },
      {
        uid: 'prescription-2',
        name: 'Current One',
        isCurrentPrescription: true
      },
      {
        uid: 'prescription-3',
        name: 'Also Not Current',
        isCurrentPrescription: false
      }
    ];
    
    // Re-mock authFetcherWithRedirect
    const { authFetcherWithRedirect } = require('@/utils/withAuthRedirect');
    (authFetcherWithRedirect as jest.Mock).mockImplementation((url) => {
      if (url === 'api/users/test-user-id') {
        return Promise.resolve(mockUserData);
      }
      if (url === 'api/prescriptions/user/test-user-id/all') {
        return Promise.resolve(prescriptionsWithMixedStatus);
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
    
    // Call the page component
    const result = await PrescriptionPage({ params: { userId: 'test-user-id' } });
    
    // Render the component
    const { findByTestId } = render(result);
    
    // Verify the client component is rendered
    await findByTestId('prescription-page-client');
    
    // Get the props passed to client component and specify type
    const clientProps = (PrescriptionPageClient as jest.Mock).mock.calls[0][0] as PrescriptionPageClientProps;
    
    // Verify the correct current prescription is selected
    expect(clientProps.currentPrescription).toEqual(prescriptionsWithMixedStatus[1]);
  });

  test('selects first prescription as current when none is marked as current', async () => {
    // Create mock prescriptions with no current prescription
    const prescriptionsWithNoCurrentFlag = [
      {
        uid: 'prescription-1',
        name: 'First Prescription',
        isCurrentPrescription: false
      },
      {
        uid: 'prescription-2',
        name: 'Second Prescription',
        isCurrentPrescription: false
      }
    ];
    
    // Re-mock authFetcherWithRedirect
    const { authFetcherWithRedirect } = require('@/utils/withAuthRedirect');
    (authFetcherWithRedirect as jest.Mock).mockImplementation((url) => {
      if (url === 'api/users/test-user-id') {
        return Promise.resolve(mockUserData);
      }
      if (url === 'api/prescriptions/user/test-user-id/all') {
        return Promise.resolve(prescriptionsWithNoCurrentFlag);
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
    
    // Call the page component
    const result = await PrescriptionPage({ params: { userId: 'test-user-id' } });
    
    // Render the component
    const { findByTestId } = render(result);
    
    // Verify the client component is rendered
    await findByTestId('prescription-page-client');
    
    // Get the props passed to client component and specify type
    const clientProps = (PrescriptionPageClient as jest.Mock).mock.calls[0][0] as PrescriptionPageClientProps;
    
    // Verify the first prescription is selected as current
    expect(clientProps.currentPrescription).toEqual(prescriptionsWithNoCurrentFlag[0]);
  });
});