import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileTab from '../ProfileTab';
import { BasicUser } from '@/types/user-list-data';

// Mock external UI component
jest.mock('ui-component/cards/SubCard', () => ({ title, children }: any) => (
  <div data-testid="subcard">
    <h2>{title}</h2>
    {children}
  </div>
));

// Virtual mock for store constant
jest.mock('store/constant', () => ({
  gridSpacing: 2
}), { virtual: true });

describe('ProfileTab', () => {
  const mockUser: BasicUser = {
    id: '1',
    name: 'Alice',
    email: 'alice@example.com',
    role: 'Admin',
    deviceMode: 'Mobile'
  };

  it('renders all fields with correct labels and values', () => {
    render(<ProfileTab userData={mockUser} />);

    // Check SubCard title
    expect(screen.getByTestId('subcard')).toBeInTheDocument();
    expect(screen.getByText('Edit Account Details')).toBeInTheDocument();

    // Name field
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue(mockUser.name);
    expect(nameInput).toBeDisabled();

    // Email field
    const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveValue(mockUser.email);
    expect(emailInput).toBeDisabled();

    // Role field
    const roleInput = screen.getByLabelText('Role') as HTMLInputElement;
    expect(roleInput).toBeInTheDocument();
    expect(roleInput).toHaveValue(mockUser.role);
    expect(roleInput).toBeDisabled();

    // Device Mode field
    const deviceInput = screen.getByLabelText('Device Mode') as HTMLInputElement;
    expect(deviceInput).toBeInTheDocument();
    expect(deviceInput).toHaveValue(mockUser.deviceMode);
    expect(deviceInput).toBeDisabled();
  });

  it('falls back to Unknown when data is missing', () => {
    const incompleteUser: BasicUser = {
      id: '2',
      name: undefined as any,
      email: undefined as any,
      role: undefined as any,
      deviceMode: undefined as any
    };

    render(<ProfileTab userData={incompleteUser} />);

    expect((screen.getByLabelText('Name') as HTMLInputElement)).toHaveValue('Unknown');
    expect((screen.getByLabelText('Email address') as HTMLInputElement)).toHaveValue('Unknown');
    expect((screen.getByLabelText('Role') as HTMLInputElement)).toHaveValue('Unknown');
    expect((screen.getByLabelText('Device Mode') as HTMLInputElement)).toHaveValue('Unknown');
  });
});