/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddUserForm from '../AddUserForm';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Cookies from 'js-cookie';
import * as NextNavigation from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const theme = createTheme();
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('AddUserForm', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    jest.clearAllMocks();

    // stub Cookies.get
    // @ts-ignore
    jest.spyOn(Cookies, 'get').mockReturnValue('token123');

    // useRouter  push
    (NextNavigation.useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    // stub fetch
    global.fetch = jest.fn();
  });


  async function fillAndSubmit() {
    await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/Password/i), 'abcdef');
    await userEvent.click(screen.getByRole('button', { name: /Add User/i }));
  }

  it('renders all form fields', () => {
    renderWithTheme(<AddUserForm />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Trial Stage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Device Mode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Device Recording Mode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
  });

  it('shows generic error on non-OK, non-409 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server down' }),
    });

    renderWithTheme(<AddUserForm />);
    await fillAndSubmit();

    expect(await screen.findByText(/Server down/i)).toBeInTheDocument();
  });

  it('shows conflict error on 409 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({}),
    });

    renderWithTheme(<AddUserForm />);
    await fillAndSubmit();

    expect(
      await screen.findByText(/A user with this email already exists\./i)
    ).toBeInTheDocument();
  });

  it('navigates to users-list on successful submit', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1 }),
    });

    renderWithTheme(<AddUserForm />);
    await fillAndSubmit();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/users-list/?success=true');
    });
  });
});