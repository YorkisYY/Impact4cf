// src/views/forms/components/BasicInfo/__tests__/BasicInfoForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BasicInfoForm from '../BasicInfoForm';
import { useRouter as useRouterMock } from 'next/navigation';
import Cookies from 'js-cookie';
import useAuth from '@/hooks/useAuth';
import { Roles } from '@/utils/constants';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));
jest.mock('js-cookie', () => ({
  get: jest.fn()
}));
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

  const renderForm = (userData: any = { uid: 'u1', deviceMode: 'Record', trialStage: 0, name: 'Bob' }) => {
    render(<BasicInfoForm userData={userData} userId="u1" />);
  };

  test('fields are disabled for no-permission user', () => {
    renderForm();

    const nameInput = screen.getByDisplayValue('Bob');
    expect(nameInput).toBeDisabled();


    const pwdInput = screen.getByDisplayValue('');
    expect(pwdInput).toBeDisabled();
  });

  test('fields editable for admin user', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    renderForm();
    const nameInput = screen.getByDisplayValue('Bob');
    expect(nameInput).not.toBeDisabled();

    const pwdInput = screen.getByDisplayValue('');
    expect(pwdInput).not.toBeDisabled();
  });

  test('password length check triggers alert', () => {
    window.alert = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    renderForm();

    const inputs = screen.getAllByRole('textbox');
    const pwdInput = inputs[1];
    fireEvent.change(pwdInput, { target: { value: '123' } });
    fireEvent.click(screen.getByText('Save'));

    expect(window.alert).toHaveBeenCalledWith('Password must be at least 6 characters.');
  });

  test('missing token shows error alert', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    renderForm();

    const inputs = screen.getAllByRole('textbox');
    const pwdInput = inputs[1];
    fireEvent.change(pwdInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No token found. Please login again.'
      );
    });
  });

  test('successful save calls fetch and navigates', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    (Cookies.get as jest.Mock).mockReturnValue('token123');

    renderForm();
    const inputs = screen.getAllByRole('textbox');
    const pwdInput = inputs[1];
    fireEvent.change(pwdInput, { target: { value: 'abcdef' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/users-list?success=true');
    });
  });

  test('server error shows error message', async () => {
    const badJson = { message: 'Invalid data' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(badJson)
    });
    (useAuth as jest.Mock).mockReturnValue({ user: { role: Roles.ADMIN } });
    (Cookies.get as jest.Mock).mockReturnValue('token456');

    renderForm();
    const inputs = screen.getAllByRole('textbox');
    const pwdInput = inputs[1];
    fireEvent.change(pwdInput, { target: { value: 'abcdef' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid data');
    });
  });
});
