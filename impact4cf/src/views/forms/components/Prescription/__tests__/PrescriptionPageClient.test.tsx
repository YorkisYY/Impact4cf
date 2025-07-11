/**
 * @jest-environment jsdom
 */

import React from 'react';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
  within
} from '@testing-library/react';
import '@testing-library/jest-dom';


jest.mock('config', () => ({
  ThemeMode: { DARK: 'dark', LIGHT: 'light' },
  ThemeDirection: { LTR: 'ltr', RTL: 'rtl' }
}));
jest.mock('hooks/useConfig', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({ themeDirection: 'ltr' })
}));
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));
jest.mock('@/hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock('js-cookie', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockReturnValue('mock-token')
  }
}));
jest.mock('../CustomBreadcrumbs', () => ({
  __esModule: true,
  default: () => <div data-testid="breadcrumbs" />
}));
jest.mock('../PrescriptionHeader', () => ({
  __esModule: true,
  // @ts-ignore
  default: (props) => <div data-testid="header" onClick={() => props.onLoadPrescription && props.onLoadPrescription(props.prescriptionHistory[0])} />
}));

// Mock fetch
global.fetch = jest.fn();
global.alert = jest.fn();

import PrescriptionPageClient from '../PrescriptionPageClient';
import { useRouter as useRouterMock } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { Roles } from '@/utils/constants';

describe('<PrescriptionPageClient />', () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeAll(() => {
    (useRouterMock as jest.Mock).mockReturnValue({ 
      push: mockPush,
      back: mockBack
    });
    
    // Mock environment variables
    process.env.NEXT_PUBLIC_API_URL = 'http://test.api/';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'USER' } });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
  });

  const userData = {
    uid: 'u1',
    deviceMode: 'Record',
    name: 'Alice'
  };

  const fallbackPrescription = {
    uid: 'p1',
    name: 'One',
    description: 'Test description',
    isCurrentPrescription: true,
    sessionsPerDay: 1,
    daysPerWeek: 5,
    setsPerSession: 2,
    exhalesPerSet: 3,
    exhaleDuration: 4,
    exhaleTargetPressure: 5,
    exhaleTargetRange: 1.5,
    exhaleLeadInOutDuration: 0.2,
    deviceMode: 'Record'
  };
  
  const prescriptions = [fallbackPrescription];

  it('renders breadcrumbs and header', () => {
    render(
      <PrescriptionPageClient
        userData={userData}
        allPrescriptions={prescriptions}
        currentPrescription={fallbackPrescription}
      />
    );
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('disables all inputs for non-admin user', () => {
    render(
      <PrescriptionPageClient
        userData={userData}
        allPrescriptions={prescriptions}
        currentPrescription={fallbackPrescription}
      />
    );
    
    // Get all text fields
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => expect(input).toBeDisabled());
    
    // Check the select is disabled too
    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-disabled', 'true');
  });

  it('does NOT show Save button for non-admin user', () => {
    render(
      <PrescriptionPageClient
        userData={userData}
        allPrescriptions={prescriptions}
        currentPrescription={fallbackPrescription}
      />
    );
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('enables inputs and shows Save button for admin user', () => {
    // Mock admin user
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    
    render(
      <PrescriptionPageClient
        userData={userData}
        allPrescriptions={prescriptions}
        currentPrescription={fallbackPrescription}
      />
    );
    
    // Check inputs are not disabled
    screen.getAllByRole('textbox').forEach(input => 
      expect(input).not.toBeDisabled()
    );
    
    // Check save button is rendered
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('updates form data when admin changes input values', () => {
    // Mock admin user
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    
    render(
      <PrescriptionPageClient
        userData={userData}
        allPrescriptions={prescriptions}
        currentPrescription={fallbackPrescription}
      />
    );
    
    const container = screen.getByText('Sessions Per Day').closest('.MuiGrid-item');
    // @ts-ignore
    const sessionsInput = within(container).getByRole('textbox');
    
 
    fireEvent.change(sessionsInput, { target: { value: '3' } });
    
    // Check value was updated
    expect(sessionsInput).toHaveValue('3');
  });

  it('navigates back when Cancel button is clicked', () => {
    render(
      <PrescriptionPageClient
        userData={userData}
        allPrescriptions={prescriptions}
        currentPrescription={fallbackPrescription}
      />
    );
    
    // Click cancel button
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    
    // Check router.back was called
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('submits form data when Save button is clicked', async () => {
    // Mock admin user
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    
    render(
      <PrescriptionPageClient
        userData={userData}
        allPrescriptions={prescriptions}
        currentPrescription={fallbackPrescription}
      />
    );
    
    // Click save button
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Check that fetch was called twice (once for prescription, once for user)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, 
        'http://test.api/api/prescriptions/p1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          })
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(2, 
        'http://test.api/api/users/u1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
    
    // Check redirection happened
    expect(mockPush).toHaveBeenCalledWith('/users-list?success=true');
  });

  it('shows error message when prescription API request fails', async () => {
    // Mock admin user and a failed API response
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'API error occurred' })
    });
    
    render(
      <PrescriptionPageClient
        userData={userData}
        allPrescriptions={prescriptions}
        currentPrescription={fallbackPrescription}
      />
    );
    
    // Click save button
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Check error message is displayed
    await waitFor(() => {
      expect(screen.getByText('API error occurred')).toBeInTheDocument();
    });
  });


  it('loads prescription data when header component triggers onLoadPrescription', () => {
    // Create a new prescription to load
    const newPrescription = {
      ...fallbackPrescription,
      uid: 'p2',
      name: 'Two',
      sessionsPerDay: 5,
      description: 'New description'
    };
    
    const updatedPrescriptions = [newPrescription, fallbackPrescription];
    
    render(
      <PrescriptionPageClient
        userData={userData}
        allPrescriptions={updatedPrescriptions}
        currentPrescription={fallbackPrescription}
      />
    );
    
    // Trigger onLoadPrescription via header component click
    fireEvent.click(screen.getByTestId('header'));
    
    const sessionsContainer = screen.getByText('Sessions Per Day').closest('.MuiGrid-item');
    // @ts-ignore
    const sessionsInput = within(sessionsContainer).getByRole('textbox');
    expect(sessionsInput).toHaveValue('5');
    
    const descriptionContainer = screen.getByText('Description').closest('.MuiGrid-item');
    // @ts-ignore
    const descriptionInput = within(descriptionContainer).getByRole('textbox');
    expect(descriptionInput).toHaveValue('New description');
  });

  it('shows error when no service token is found', async () => {
    // Mock admin user and no token
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    jest.spyOn(require('js-cookie').default, 'get').mockReturnValueOnce(null);
    
    render(
      <PrescriptionPageClient
        userData={userData}
        allPrescriptions={prescriptions}
        currentPrescription={fallbackPrescription}
      />
    );
    
    // Click save button
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText('No token found. Please login again.')).toBeInTheDocument();
    });
  });
});