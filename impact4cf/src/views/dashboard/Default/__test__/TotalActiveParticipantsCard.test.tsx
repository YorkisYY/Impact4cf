import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TotalActiveParticipantsCard from '../TotalActiveParticipantsCard';
// import SkeletonTotalParticipantsCard from '@/ui-component/cards/Skeleton/TotalParticipantsCard';

jest.mock('@/ui-component/cards/Skeleton/TotalParticipantsCard', () => {
  return jest.fn(() => <div data-testid="skeleton-loader" />);
});

jest.mock('config', () => ({
    ThemeMode: {
    LIGHT: 'light',
    DARK: 'dark'
    },
    ThemeDirection: {
    LTR: 'ltr',
    RTL: 'rtl'
    },
    MenuOrientation: {
    VERTICAL: 'vertical',
    HORIZONTAL: 'horizontal'
    },
    default: {
    fontFamily: 'Roboto, sans-serif',
    borderRadius: 8,
    outlinedFilled: true,
    mode: 'light',
    presetColor: 'default',
    i18n: 'en',
    themeDirection: 'ltr',
    container: true
    }
}), { virtual: true });

jest.mock('ui-component/cards/MainCard', () => {
    return {
      __esModule: true,
      default: ({ children, title }: { children: React.ReactNode; title?: string }) => (
        <div data-testid="main-card" data-title={title}>
          {children}
        </div>
      ),
    };
});

describe('TotalActiveParticipantsCard Component', () => {
  const defaultProps = {
    isLoading: false,
    totalActiveUsers: 25,
    dateRange: {
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-04-07'),
    },
    change: 5,
  };

  test('displays skeleton loader when isLoading is true', () => {
    render(<TotalActiveParticipantsCard {...defaultProps} isLoading={true} />);
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  test('displays total active users correctly', () => {
    render(<TotalActiveParticipantsCard {...defaultProps} />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  test('formats change value correctly for positive change', () => {
    render(<TotalActiveParticipantsCard {...defaultProps} change={5} />);
    expect(screen.getByText('+5 this week')).toBeInTheDocument();
  });

  test('formats change value correctly for negative change', () => {
    render(<TotalActiveParticipantsCard {...defaultProps} change={-3} />);
    expect(screen.getByText('-3 this week')).toBeInTheDocument();
  });

  test('formats change value correctly for no change', () => {
    render(<TotalActiveParticipantsCard {...defaultProps} change={0} />);
    expect(screen.getByText('+0 this week')).toBeInTheDocument();
  });

  test('displays correct colour for positive change', () => {
    render(<TotalActiveParticipantsCard {...defaultProps} change={5} />);
    const changeText = screen.getByText('+5 this week');
    expect(changeText).toHaveStyle('color: #1EFF00'); // Green for positive change
  });

  test('displays correct colour for negative change', () => {
    render(<TotalActiveParticipantsCard {...defaultProps} change={-3} />);
    const changeText = screen.getByText('-3 this week');
    expect(changeText).toHaveStyle('color: #FFAE00'); // Red for negative change
  });

  test('displays correct colour for no change', () => {
    render(<TotalActiveParticipantsCard {...defaultProps} change={0} />);
    const changeText = screen.getByText('+0 this week');
    expect(changeText).toHaveStyle('color: #FFAE00'); // Orange for no change
  });
});