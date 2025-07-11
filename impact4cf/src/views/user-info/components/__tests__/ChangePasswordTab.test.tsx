import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChangePasswordTab from '../ChangePasswordTab';
import updateUserPassword from '@/app/actions/updateUserPassword';

// 1. Mock updateUserPassword
jest.mock('@/app/actions/updateUserPassword', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('ui-component/cards/SubCard', () => {
  return ({ title, children }: any) => (
    <div data-testid="subcard">
      <h2>{title}</h2>
      {children}
    </div>
  );
});
jest.mock('ui-component/extended/AnimateButton', () => {
  return ({ children }: any) => <div data-testid="animate-button">{children}</div>;
});

// 3. Virtual mock for store/constant
jest.mock('store/constant', () => ({
  gridSpacing: 2,
}), { virtual: true });

describe('ChangePasswordTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getPasswordInput = () =>
    screen.getByLabelText(/^Password$/i) as HTMLInputElement;
  const getConfirmInput = () =>
    screen.getByLabelText(/^Confirm Password$/i) as HTMLInputElement;

  it('intiial stage', () => {
    render(<ChangePasswordTab />);
    expect(getPasswordInput()).toBeInTheDocument();
    expect(getConfirmInput()).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Change Password/i });
    expect(btn).toBeDisabled();
  });

  it('password', async () => {
    render(<ChangePasswordTab />);
    const pw = getPasswordInput();
    fireEvent.change(pw, { target: { value: '123' } });
    fireEvent.blur(pw);
    expect(
      await screen.findByText(/Password must be at least 6 characters/i)
    ).toBeInTheDocument();
  });

  it('「Passwords must match」', async () => {
    render(<ChangePasswordTab />);
    const pw = getPasswordInput();
    const cpw = getConfirmInput();
    fireEvent.change(pw, { target: { value: 'password123' } });
    fireEvent.change(cpw, { target: { value: 'password456' } });
    fireEvent.blur(cpw);
    expect(
      await screen.findByText(/Passwords must match/i)
    ).toBeInTheDocument();
  });

  it('matched, then work', async () => {
    render(<ChangePasswordTab />);
    const pw = getPasswordInput();
    const cpw = getConfirmInput();
    fireEvent.change(pw, { target: { value: 'password123' } });
    fireEvent.change(cpw, { target: { value: 'password123' } });
    fireEvent.blur(cpw);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Change Password/i })
      ).toBeEnabled();
    });
  });

  it('successful submit then hint', async () => {
    (updateUserPassword as jest.Mock).mockResolvedValue(undefined);
    render(<ChangePasswordTab />);

    const pw = getPasswordInput();
    const cpw = getConfirmInput();
    fireEvent.change(pw, { target: { value: 'password123' } });
    fireEvent.change(cpw, { target: { value: 'password123' } });
    fireEvent.blur(cpw);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Change Password/i })
      ).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

    await waitFor(() => {
      expect(updateUserPassword).toHaveBeenCalledWith({ password: 'password123' });
    });
    expect(
      await screen.findByText(/Successfully Changed Password/i)
    ).toBeInTheDocument();
  });

  it('fail to submit', async () => {
    (updateUserPassword as jest.Mock).mockRejectedValue(new Error('API fail'));
    render(<ChangePasswordTab />);

    const pw = getPasswordInput();
    const cpw = getConfirmInput();
    fireEvent.change(pw, { target: { value: 'password123' } });
    fireEvent.change(cpw, { target: { value: 'password123' } });
    fireEvent.blur(cpw);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Change Password/i })
      ).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));
    expect(
      await screen.findByText(/Could not change password/i)
    ).toBeInTheDocument();
  });
});