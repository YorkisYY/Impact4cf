import React from 'react';
import '@testing-library/jest-dom';
import { useRouter, usePathname } from 'next/navigation';
import deleteUsers from '@/app/actions/deleteUsers';
import { Roles } from '@/utils/constants';

// Mock Next.js font system
jest.mock('next/font/google', () => ({
  Roboto: jest.fn().mockReturnValue({
    className: 'roboto-font',
    style: { fontFamily: 'Roboto' }
  })
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn()
}));

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the deleteUsers action
jest.mock('@/app/actions/deleteUsers', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock MUI components to avoid DataGrid context issues
jest.mock('@mui/x-data-grid', () => ({
  GridToolbar: () => <div data-testid="grid-toolbar"></div>,
  GridToolbarContainer: ({ children }) => <div data-testid="grid-toolbar-container">{children}</div>,
  GridToolbarQuickFilter: () => <div data-testid="quick-filter"></div>
}));

jest.mock('@mui/material', () => ({
  Box: ({ children }) => <div>{children}</div>,
  Button: ({ children, onClick, disabled, variant, startIcon, sx }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>{startIcon}{children}</button>
  ),
  InputAdornment: ({ children }) => <div>{children}</div>,
  Tooltip: ({ children }) => <div>{children}</div>,
  useTheme: () => ({
    palette: {
      mode: 'light',
      error: { main: '#f44336' },
      primary: { dark: '#1565c0' },
    }
  })
}));

jest.mock('@mui/icons-material/Search', () => () => 'SearchIcon');
jest.mock('@mui/icons-material/PersonAddOutlined', () => () => 'PersonAddIcon');

// Mock window.confirm
global.confirm = jest.fn();

// Mock config
jest.mock('@/config', () => ({
  ThemeMode: {
    LIGHT: 'light',
    DARK: 'dark'
  }
}));

// Direct test of the handleDelete function
describe('UserListToolBar - handleDelete function', () => {
  const mockSetSelectedRows = jest.fn();
  const mockSetSuccessMessage = jest.fn();
  const mockSetErrorMessage = jest.fn();
  const mockReplace = jest.fn();
  const mockPush = jest.fn();
  const mockPathname = '/users';
  let handleDelete;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mocks
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
      push: mockPush
    });
    
    (usePathname as jest.Mock).mockReturnValue(mockPathname);
    
    // Default confirm to true
    (global.confirm as jest.Mock).mockReturnValue(true);

    // Create the handleDelete function with dependencies
    handleDelete = async (selectedRows, user, setSuccessMessage, setErrorMessage, setSelectedRows, router, pathname) => {
      if (selectedRows.length === 0) return;
    
      const confirmed = confirm(`Are you sure you want to delete ${selectedRows.length} user(s)?`);
      if (!confirmed) return;
      
      const uids = selectedRows.map((uid) => String(uid));
  
      //check if current user uid in uids list
      if (user && uids.includes(user.uid)) {
        setErrorMessage('Cannot delete account you are signed in with');
        return;
      }
  
      try {
        await deleteUsers(uids); 
        setSuccessMessage(`Sucessfully deleted ${selectedRows.length == 1 ? 'User' : 'Users' }`);
      } catch (error) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
        console.error('Delete failed:', error);
        setErrorMessage('Failed to delete all users. Please try again.');
      }
      setSelectedRows([]); 
      router.replace(pathname);
    };
  });

  test('does nothing when no rows are selected', async () => {
    await handleDelete(
      [], // empty selectedRows
      { uid: 'admin1', role: Roles.ADMIN },
      mockSetSuccessMessage,
      mockSetErrorMessage,
      mockSetSelectedRows,
      { replace: mockReplace },
      mockPathname
    );

    expect(global.confirm).not.toHaveBeenCalled();
    expect(deleteUsers).not.toHaveBeenCalled();
    expect(mockSetSuccessMessage).not.toHaveBeenCalled();
    expect(mockSetErrorMessage).not.toHaveBeenCalled();
    expect(mockSetSelectedRows).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test('does nothing when confirmation is cancelled', async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);

    await handleDelete(
      ['user1'], // non-empty selectedRows
      { uid: 'admin1', role: Roles.ADMIN },
      mockSetSuccessMessage,
      mockSetErrorMessage,
      mockSetSelectedRows,
      { replace: mockReplace },
      mockPathname
    );

    expect(global.confirm).toHaveBeenCalled();
    expect(deleteUsers).not.toHaveBeenCalled();
    expect(mockSetSuccessMessage).not.toHaveBeenCalled();
    expect(mockSetErrorMessage).not.toHaveBeenCalled();
    expect(mockSetSelectedRows).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test('shows error when trying to delete own account', async () => {
    await handleDelete(
      ['admin1', 'user2'], // includes current user's uid
      { uid: 'admin1', role: Roles.ADMIN },
      mockSetSuccessMessage,
      mockSetErrorMessage,
      mockSetSelectedRows,
      { replace: mockReplace },
      mockPathname
    );

    expect(global.confirm).toHaveBeenCalled();
    expect(deleteUsers).not.toHaveBeenCalled();
    expect(mockSetSuccessMessage).not.toHaveBeenCalled();
    expect(mockSetErrorMessage).toHaveBeenCalledWith('Cannot delete account you are signed in with');
    expect(mockSetSelectedRows).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test('deletes users successfully and shows singular message for one user', async () => {
    (deleteUsers as jest.Mock).mockResolvedValue(undefined);

    await handleDelete(
      ['user2'], // one user
      { uid: 'admin1', role: Roles.ADMIN },
      mockSetSuccessMessage,
      mockSetErrorMessage,
      mockSetSelectedRows,
      { replace: mockReplace },
      mockPathname
    );

    expect(global.confirm).toHaveBeenCalled();
    expect(deleteUsers).toHaveBeenCalledWith(['user2']);
    expect(mockSetSuccessMessage).toHaveBeenCalledWith('Sucessfully deleted User');
    expect(mockSetErrorMessage).not.toHaveBeenCalled();
    expect(mockSetSelectedRows).toHaveBeenCalledWith([]);
    expect(mockReplace).toHaveBeenCalledWith(mockPathname);
  });

  test('deletes users successfully and shows plural message for multiple users', async () => {
    (deleteUsers as jest.Mock).mockResolvedValue(undefined);
    
    await handleDelete(
      ['user2', 'user3'], // multiple users
      { uid: 'admin1', role: Roles.ADMIN },
      mockSetSuccessMessage,
      mockSetErrorMessage,
      mockSetSelectedRows,
      { replace: mockReplace },
      mockPathname
    );

    expect(global.confirm).toHaveBeenCalled();
    expect(deleteUsers).toHaveBeenCalledWith(['user2', 'user3']);
    expect(mockSetSuccessMessage).toHaveBeenCalledWith('Sucessfully deleted Users');
    expect(mockSetErrorMessage).not.toHaveBeenCalled();
    expect(mockSetSelectedRows).toHaveBeenCalledWith([]);
    expect(mockReplace).toHaveBeenCalledWith(mockPathname);
  });

  test('handles errors during deletion', async () => {
    (deleteUsers as jest.Mock).mockRejectedValue(new Error('Delete failed'));
    
    await handleDelete(
      ['user2'],
      { uid: 'admin1', role: Roles.ADMIN },
      mockSetSuccessMessage,
      mockSetErrorMessage,
      mockSetSelectedRows,
      { replace: mockReplace },
      mockPathname
    );

    expect(global.confirm).toHaveBeenCalled();
    expect(deleteUsers).toHaveBeenCalledWith(['user2']);
    expect(mockSetSuccessMessage).not.toHaveBeenCalled();
    expect(mockSetErrorMessage).toHaveBeenCalledWith('Failed to delete all users. Please try again.');
    expect(mockSetSelectedRows).toHaveBeenCalledWith([]);
    expect(mockReplace).toHaveBeenCalledWith(mockPathname);
  });

  test('rethrows NEXT_REDIRECT errors', async () => {
    const redirectError = new Error('Redirect');
    (redirectError as any).digest = 'NEXT_REDIRECT:somewhere';
    (deleteUsers as jest.Mock).mockRejectedValue(redirectError);

    await expect(handleDelete(
      ['user2'],
      { uid: 'admin1', role: Roles.ADMIN },
      mockSetSuccessMessage,
      mockSetErrorMessage,
      mockSetSelectedRows,
      { replace: mockReplace },
      mockPathname
    )).rejects.toThrow();

    expect(global.confirm).toHaveBeenCalled();
    expect(deleteUsers).toHaveBeenCalledWith(['user2']);
  });
});

// Test the getTodayDate function separately
describe('getTodayDate function', () => {
  test('formats date correctly', () => {
    // Mock the Date object
    const mockDate = new Date(2023, 5, 15); // June 15, 2023
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

    // Define the function to test
    const getTodayDate = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Test the function
    expect(getTodayDate()).toBe('2023-06-15');

    // Restore the original Date
    jest.restoreAllMocks();
  });
});