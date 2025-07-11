// src/views/forms/components/BasicInfo/__tests__/BasicInfoForm.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BasicInfoForm from '../BasicInfoForm';
import { useRouter as useRouterMock } from 'next/navigation';
import Cookies from 'js-cookie';
import useAuth from '@/hooks/useAuth';
import { Roles } from '@/utils/constants';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn()
}));

// Mock our auth hook
jest.mock('@/hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('BasicInfoForm', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.USER } });
    (useRouterMock as jest.Mock).mockReturnValue({ push: mockPush, back: jest.fn() });
  });

  const renderForm = (userData: any = {
    uid: 'u1',
    deviceMode: 'Record',
    trialStage: 0,
    name: 'Bob'
  }) => {
    render(<BasicInfoForm userData={userData} userId="u1" />);
  };

  test('should disable all fields for user without edit permission', () => {
    renderForm();
    // MUI TextField elements have role="textbox"
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(3); // name, password, trialStage
    inputs.forEach(input => {
      expect(input).toBeDisabled();
    });
  });

  test('should not render Save button for user without edit permission', () => {
    renderForm();
    // Save button should be hidden for non-admin users
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  test('should enable fields for admin users', () => {
    // Simulate admin role
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    renderForm();
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      expect(input).not.toBeDisabled();
    });
  });

  test('should alert if password is too short', () => {
    window.alert = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    renderForm();
    const inputs = screen.getAllByRole('textbox');
    const passwordInput = inputs[1]; // second textbox is password
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(screen.getByText('Save'));
    expect(window.alert).toHaveBeenCalledWith('Password must be at least 6 characters.');
  });

  test('should show error alert when no service token is available', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    renderForm();
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[1], { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No token found. Please login again.'
      );
    });
  });

  test('should call fetch and navigate on successful save', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    (Cookies.get as jest.Mock).mockReturnValue('token123');

    renderForm();
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[1], { target: { value: 'abcdef' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/users-list?success=true');
    });
  });

  test('should display server error message on API failure', async () => {
    const errorResponse = { message: 'Invalid data' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(errorResponse)
    });
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    (Cookies.get as jest.Mock).mockReturnValue('token456');

    renderForm();
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[1], { target: { value: 'abcdef' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid data');
    });
  });
});
