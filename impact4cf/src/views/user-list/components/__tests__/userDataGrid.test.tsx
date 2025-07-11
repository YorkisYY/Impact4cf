import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import * as NextNavigation from 'next/navigation';
import UserDataGrid from '../userDataGrid';
import { CombinedUserData } from '@/types/user-list-data';

// Mocks
jest.mock('next/font/google', () => ({
  Roboto: (_opts: any) => ({ className: 'roboto-mock', style: { fontFamily: 'roboto-mock' } })
}));
jest.mock('next/navigation', () => ({ useRouter: jest.fn(), useSearchParams: jest.fn(), usePathname: jest.fn() }));
jest.mock('../userListToolBar', () => () => <div data-testid="toolbar" />);
jest.mock('@/ui-component/extended/CustomBreadcrumbs', () => () => <div data-testid="breadcrumbs" />);

const theme = createTheme();
const renderWithTheme = (ui: React.ReactElement) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('UserDataGrid', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    jest.clearAllMocks();
    (NextNavigation.useRouter as jest.Mock).mockReturnValue({ push: mockPush, replace: jest.fn() });
    (NextNavigation.usePathname as jest.Mock).mockReturnValue('/current-path');
    (NextNavigation.useSearchParams as jest.Mock).mockReturnValue({ get: (_: string) => null });
  });

  it('renders columns and cells properly', () => {
    const rows: CombinedUserData[] = [{
      id: '1', email: 'x@y.com', role: 'researcher', lastActive: '2025-01-01T00:00:00Z',
      lastTreatment: '2025-02-02T00:00:00Z', trialStage: 0, deviceMode: 'Coach', totalSessions: 2, totalBreaths: 50, deviceRecordingMode: 'Time'
    }];
    renderWithTheme(<UserDataGrid rows={rows} />);

    ['Username','User Role','Last Seen','Last ACT','Trial Stage','Device Mode','Total Sessions','Total Breaths']
      .forEach(title => expect(
        screen.getByRole('columnheader', { name: new RegExp(title, 'i') })
      ).toBeInTheDocument());
    expect(screen.getByRole('gridcell', { name: /x@y\.com/i })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: /Researcher/i })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: '2025-01-01' })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: '2025-02-02' })).toBeInTheDocument();
  });
  
  it('navigates on row click', async () => {
    const rows: CombinedUserData[] = [{
      id: 'abc', email: 'a@b.com', role: 'patient', lastActive: null,
      lastTreatment: null, trialStage: 1, deviceMode: 'Record', totalSessions: 0, totalBreaths: 0, deviceRecordingMode: 'Breaths'
    }];
    renderWithTheme(<UserDataGrid rows={rows} />);
    fireEvent.click(screen.getByTitle('a@b.com'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/abc/all'));
  });
});
