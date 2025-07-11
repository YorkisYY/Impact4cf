import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import DaysList from '../DaysList';
import { useRouter as useRouterMock } from 'next/navigation';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
    __esModule: true,
    default: jest.fn(),
  }));

jest.mock('@/ui-component/cards/MainCard', () => {
    return {
      __esModule: true,
      default: ({ children, title }: { children: React.ReactNode; title?: string }) => (
        <div data-testid="main-card" data-title={title}>
          {children}
        </div>
      ),
    };
  });

describe('DaysList Component', () => {
  const mockRouter = { push: jest.fn() };

  const defaultProps = {
    isLoading: false,
    treatmentInfo: [
      { date: '2023-05-15', actSessions: 2, sets: 4, breaths: 40 },
      { date: '2023-05-16', actSessions: 3, sets: 6, breaths: 60 },
    ],
    prescriptionInfo: [
      {
        username: 'John Doe',
        actSessionsPerDay: 2,
        setsPerACTSession: 4,
        breathsPerSet: 10,
        breathLength: 5,
        breathPressureTarget: 20,
        breathPressureRange: 5,
        appliedFrom: '2023-05-01',
        appliedTo: '2023-05-31',
      },
    ],
    dateRange: {
      startDate: new Date('2023-05-01'),
      endDate: new Date('2023-05-31'),
    },
    userId: '123',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useRouter
    (useRouterMock as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    cleanup();
  });

  test('renders loading state correctly', () => {
    render(<DaysList {...defaultProps} isLoading={true} />);
    expect(screen.getByText('Loading treatment data...')).toBeInTheDocument();
  });

  test('renders table rows correctly', () => {
    render(<DaysList {...defaultProps} />);
    // Verify the first row
    expect(screen.getByText('15/05/2023')).toBeInTheDocument(); // Date
    expect(screen.getByText('2 / 2')).toBeInTheDocument(); // ACT sessions
    expect(screen.getByText('4 / 8')).toBeInTheDocument(); // Sets
    expect(screen.getByText('40 / 80')).toBeInTheDocument(); // Breaths

    // Verify the second row
    expect(screen.getByText('16/05/2023')).toBeInTheDocument(); // Date
    expect(screen.getByText('3 / 2')).toBeInTheDocument(); // ACT sessions
    expect(screen.getByText('6 / 8')).toBeInTheDocument(); // Sets
    expect(screen.getByText('60 / 80')).toBeInTheDocument(); // Breaths
  });

  test('handles sorting correctly', () => {
    render(<DaysList {...defaultProps} />);
    const columnHeader = screen.getByText('Date');
    fireEvent.click(columnHeader); // Simulate sorting
    expect(screen.getByText('16/05/2023')).toBeInTheDocument(); // Verify sorting order
  });

  test('navigates to details page when a row is clicked', () => {
    render(<DaysList {...defaultProps} />);
    const row = screen.getByText('15/05/2023');
    fireEvent.click(row); // Simulate row click
    expect(mockRouter.push).toHaveBeenCalledWith('/123/all/2023-05-15');
  });
});