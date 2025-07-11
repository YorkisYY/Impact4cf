import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DayInfo from '../DayInfo';
import BreathPressureChart from '../BreathPressureChart';

jest.mock('../BreathPressureChart', () => {
  return jest.fn(() => <div data-testid="breath-pressure-chart" />);
});

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

describe('DayInfo Component', () => {
  const defaultProps = {
    isLoading: false,
    treatmentInfo: {
      date: '2025-04-01',
      actSessions: 2,
      sets: 4,
      breaths: 40,
    },
    prescriptionInfo: {
      username: 'John Doe',
      actSessionsPerDay: 3,
      setsPerACTSession: 5,
      breathsPerSet: 10,
      breathLength: 5,
      breathPressureTarget: 20,
      breathPressureRange: 5,
    },
    date: new Date('2025-04-01'),
    breathData: [],
    isLoadingBreathData: false,
  };

  test('formats and displays the date correctly in the title', () => {
    render(<DayInfo {...defaultProps} />);
    const mainCard = screen.getByTestId('main-card');
    expect(mainCard).toHaveAttribute('data-title', 'Tuesday 01 Apr 2025 - Day Summary');
  });

  test('renders treatment information correctly', () => {
    render(<DayInfo {...defaultProps} />);
    expect(screen.getByText('ACT Sessions:')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument(); // ACT sessions
    expect(screen.getByText('Sets:')).toBeInTheDocument();
    expect(screen.getByText('4/15')).toBeInTheDocument(); // Sets
    expect(screen.getByText('Breaths:')).toBeInTheDocument();
    expect(screen.getByText('40/150')).toBeInTheDocument(); // Breaths
  });

  test('displays loading breath data message when isLoadingBreathData is true', () => {
    render(<DayInfo {...defaultProps} isLoadingBreathData={true} />);
    expect(screen.getByText('Loading breath data...')).toBeInTheDocument();
  });

  test('renders BreathPressureChart with correct props when breath data is loaded', () => {
    render(<DayInfo {...defaultProps} />);
    expect(screen.getByTestId('breath-pressure-chart')).toBeInTheDocument();
    expect(BreathPressureChart).toHaveBeenCalledWith(
      {
        breathData: [],
        prescribedPressureMaximum: 22.5, // Target + Range/2
        prescribedPressureMinimum: 17.5, // Target - Range/2
      },
      {}
    );
  });
});