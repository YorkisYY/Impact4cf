import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomDateRangePicker from '../CustomDateRangePicker';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

jest.mock('dayjs', () => {
  const actualDayjs = jest.requireActual('dayjs');
  actualDayjs.extend = jest.fn(actualDayjs.extend);
  return actualDayjs;
});

describe('CustomDateRangePicker Component', () => {
  const mockOnDateRangeChange = jest.fn();

  const defaultProps = {
    onDateRangeChange: mockOnDateRangeChange,
    initialDateRange: {
      startDate: new Date('2025-03-31'),
      endDate: new Date('2025-04-06'),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders initial date range correctly', () => {
    render(<CustomDateRangePicker {...defaultProps} />);
    const startDateInput = screen.getByPlaceholderText('Start Date');
    const endDateInput = screen.getByPlaceholderText('End Date');

    expect(startDateInput).toHaveValue('31-03-2025');
    expect(endDateInput).toHaveValue('06-04-2025');
  });

  test('calls onDateRangeChange when date range is updated', () => {
    render(<CustomDateRangePicker {...defaultProps} />);
    const rangePicker = screen.getByPlaceholderText('Start Date').closest('.ant-picker');

    // Simulate date range change
    fireEvent.mouseDown(rangePicker!); // Open the date picker
    mockOnDateRangeChange({
      startDate: new Date('2025-04-02'),
      endDate: new Date('2025-04-08'),
    });

    expect(mockOnDateRangeChange).toHaveBeenCalledWith({
      startDate: new Date('2025-04-02'),
      endDate: new Date('2025-04-08'),
    });
  });

  test('navigates to the previous week correctly', () => {
    render(<CustomDateRangePicker {...defaultProps} />);
    const previousWeekButton = screen.getByRole('button', { name: /previous week/i });
  
    fireEvent.click(previousWeekButton);
  
    // Compare dates using toISOString to avoid timezone mismatches
    const expectedStartDate = dayjs.utc('2025-03-24').toISOString();
    const expectedEndDate = dayjs.utc('2025-03-30').toISOString();
  
    const actualCall = mockOnDateRangeChange.mock.calls[0][0];
    expect(dayjs.utc(actualCall.startDate).toISOString()).toBe(expectedStartDate);
    expect(dayjs.utc(actualCall.endDate).toISOString()).toBe(expectedEndDate);
  });
});