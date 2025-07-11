import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock MUI components to avoid theme errors
jest.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="box">{children}</div>
}));
jest.mock('@mui/material/Tabs', () => ({
  __esModule: true,
  default: ({ children, onChange, ...props }: any) => (
    <div data-testid="tabs" {...props}>
      {React.Children.map(children, (child: any, index: number) =>
        React.cloneElement(child, {
          onClick: (event: any) => onChange && onChange(event, index)
        })
      )}
    </div>
  )
}));
jest.mock('@mui/material/Tab', () => ({
  __esModule: true,
  default: ({ label, ...props }: any) => <button role="tab" {...props}>{label}</button>
}));

// Mock MainCard wrapper
jest.mock('ui-component/cards/MainCard', () => ({
  __esModule: true,
  default: ({ title, children }: any) => (
    <div data-testid="maincard">
      <h1>{title}</h1>
      {children}
    </div>
  )
}));

// Mock sub-tabs
jest.mock('../ProfileTab', () => ({ __esModule: true, default: ({ userData }: any) => (
  <div data-testid="profile-tab">ProfileTab: {userData?.name}</div>
)}));
jest.mock('../ChangePasswordTab', () => ({ __esModule: true, default: () => (
  <div data-testid="change-password-tab">ChangePasswordTab</div>
)}));

// Mock theme and config
jest.mock('@mui/material/styles', () => ({ useTheme: jest.fn() }));
jest.mock('config', () => ({ ThemeMode: { DARK: 'dark', LIGHT: 'light' } }));
jest.mock('store/constant', () => ({ gridSpacing: 2 }), { virtual: true });

// Component under test
import UserInfoView from '../UserInfoView';
import { useTheme } from '@mui/material/styles';
import { ThemeMode } from 'config';
import { BasicUser } from '@/types/user-list-data';

describe('UserInfoView', () => {
  const mockUseTheme = useTheme as jest.Mock;
  const userData: BasicUser = {
    id: 'u1',
    name: 'Alice',
    email: 'alice@example.com',
    role: 'Admin',
    deviceMode: 'Mobile'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.mockReturnValue({ palette: { mode: ThemeMode.LIGHT } });
  });

  it('renders MainCard with title and default ProfileTab', () => {
    render(<UserInfoView userData={userData} />);
    expect(screen.getByTestId('maincard')).toBeInTheDocument();
    expect(screen.getByText('My Account')).toBeInTheDocument();
    expect(screen.getByTestId('profile-tab')).toBeVisible();
    expect(screen.queryByTestId('change-password-tab')).toBeNull();
  });

  it('switches to ChangePasswordTab when its tab is clicked', () => {
    render(<UserInfoView userData={userData} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Change Password' }));
    expect(screen.getByTestId('change-password-tab')).toBeVisible();
    expect(screen.queryByTestId('profile-tab')).toBeNull();
  });
});
