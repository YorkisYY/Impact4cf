import { setupAllMocks } from '@/test/mocks/setupTestMocks';
setupAllMocks();

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AllParticipantsGraph } from '../AllParticipantsGraph';
// import SkeletonTotalGrowthBarChart from 'ui-component/cards/Skeleton/TotalGrowthBarChart';
import Chart from 'react-apexcharts';

jest.mock('hooks/useConfig', () => ({
    __esModule: true,
    default: () => ({
      onChangeMenuType: jest.fn(),
      menuOrientation: 'vertical',
      onChangeMode: jest.fn(),
      mode: 'light',
      themeDirection: 'ltr' 
    })
}), { virtual: true });

jest.mock('ui-component/cards/Skeleton/TotalGrowthBarChart', () => {
  return jest.fn(() => <div data-testid="skeleton-loader" />);
});

jest.mock('react-apexcharts', () => {
  return jest.fn(() => <div data-testid="chart" />);
});

describe('AllParticipantsGraph Component', () => {
  const defaultProps = {
    isLoading: false,
    dateRange: {
      startDate: new Date('2025-03-03'),
      endDate: new Date('2025-03-09'),
    },
  };

  test('displays skeleton loader when isLoading is true', () => {
    render(<AllParticipantsGraph {...defaultProps} isLoading={true} />);
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  test('renders chart with correct data when isLoading is false', () => {
    render(<AllParticipantsGraph {...defaultProps} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(Chart).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          xaxis: expect.objectContaining({
            categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], // Days of the week
          }),
        }),
        series: expect.arrayContaining([
          expect.objectContaining({
            name: 'Done',
            data: [6, 7, 7, 7, 5, 6, 6], // Dummy data for "sessions"
          }),
        ]),
      }),
      {}
    );
  });
});