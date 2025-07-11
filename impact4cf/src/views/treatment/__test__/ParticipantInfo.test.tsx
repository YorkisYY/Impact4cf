import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import ParticipantInfo from '../ParticipantInfo';
import { Roles } from '@/utils/constants';
import dayjs from 'dayjs';
import { useRouter as useRouterMock } from 'next/navigation';
import useAuthMock from '@/hooks/useAuth';

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

describe('ParticipantInfo Component', () => {
  const mockRouter = { push: jest.fn() };

  const defaultProps = {
    isLoading: false,
    participantInfo: {
      username: 'John Doe',
      trialStage: 'Stage 1',
      deviceMode: 'Active',
      lastSeen: '2023-05-15T10:00:00Z',
      lastACT: '2023-05-15T09:00:00Z',
    },
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

    // Mock useAuth
    (useAuthMock as jest.Mock).mockReturnValue({
      user: { role: 'USER' },
    });

    // Mock dayjs for consistent testing of time calculations
    jest.useFakeTimers().setSystemTime(new Date('2023-05-15T12:00:00Z'));
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  test('renders participant information correctly', () => {
    render(<ParticipantInfo {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/Trial stage:/)).toBeInTheDocument();
    expect(screen.getByText(/Stage 1/)).toBeInTheDocument();
    expect(screen.getByText(/Device Mode:/)).toBeInTheDocument();
    expect(screen.getByText(/Active/)).toBeInTheDocument();
  });

  test('displays initials in avatar correctly for full name', () => {
    render(<ParticipantInfo {...defaultProps} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  test('displays initials correctly for single name', () => {
    const props = {
      ...defaultProps,
      participantInfo: {
        ...defaultProps.participantInfo,
        username: 'Madonna',
      },
    };
    render(<ParticipantInfo {...props} />);
    expect(screen.getByText('MA')).toBeInTheDocument();
  });

  test('navigates to user details page when button is clicked', () => {
    render(<ParticipantInfo {...defaultProps} />);
    const button = screen.getByText('View Details');
    fireEvent.click(button);
    expect(mockRouter.push).toHaveBeenCalledWith('/users/123/basicinfo');
  });

  test('displays "just now" for very recent activity', () => {
    const props = {
      ...defaultProps,
      participantInfo: {
        ...defaultProps.participantInfo,
        lastACT: dayjs().format(),
      },
    };
    render(<ParticipantInfo {...props} />);
    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  test('displays "1 day ago" for activity from yesterday', () => {
    const props = {
      ...defaultProps,
      participantInfo: {
        ...defaultProps.participantInfo,
        lastACT: dayjs().subtract(1, 'day').format(),
      },
    };
    render(<ParticipantInfo {...props} />);
    expect(screen.getByText('1 day ago')).toBeInTheDocument();
  });

  test('shows "View & Edit Details" button for admin users', () => {
    (useAuthMock as jest.Mock).mockReturnValue({
      user: { role: Roles.ADMIN },
    });
    render(<ParticipantInfo {...defaultProps} />);
    expect(screen.getByText('View & Edit Details')).toBeInTheDocument();
  });

  test('shows "View Details" button for regular users', () => {
    (useAuthMock as jest.Mock).mockReturnValue({
      user: { role: 'USER' },
    });
    render(<ParticipantInfo {...defaultProps} />);
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });
});