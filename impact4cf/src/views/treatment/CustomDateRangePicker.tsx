'use client';
import { useState, useCallback } from 'react';
import { DatePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb'; 
import utc from 'dayjs/plugin/utc';
import updateLocale from 'dayjs/plugin/updateLocale';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

dayjs.extend(updateLocale);
dayjs.extend(utc);
dayjs.locale('en-gb');
dayjs.updateLocale('en-gb', {
  weekStart: 1,
});
const { RangePicker } = DatePicker;

interface CustomDateRangePickerProps {
  onDateRangeChange: (dateRange: { startDate: Date; endDate: Date } | null) => void;
  initialDateRange: { startDate: Date; endDate: Date };
}

const CustomDateRangePicker = ({ onDateRangeChange, initialDateRange }: CustomDateRangePickerProps) => {

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs.utc(initialDateRange.startDate), 
    dayjs.utc(initialDateRange.endDate)
  ]);

  const handleDateChange = useCallback((dates: any, dateStrings: [string, string]) => {
    if (dates) {
      const [start, end] = dates as [dayjs.Dayjs, dayjs.Dayjs];
      setDateRange([start.utc(), end.utc()]);
      onDateRangeChange({
        startDate: start.utc().toDate(),
        endDate: end.utc().toDate()
      });
    } else {
      onDateRangeChange(null);
    }
  }, [onDateRangeChange]);

  const handlePreviousWeek = () => {
    // Get the Monday of the current week being displayed
    const currentMonday = dateRange[0].utc();
    
    // Calculate previous week's Monday and Sunday
    const previousMonday = currentMonday.subtract(7, 'day');
    const previousSunday = previousMonday.add(6, 'day'); // Sunday is Monday + 6 days
    
    setDateRange([previousMonday, previousSunday]);
    onDateRangeChange({
      startDate: previousMonday.toDate(),
      endDate: previousSunday.toDate()
    });
  };

  const handleNextWeek = () => {
    // Get the Monday of the current week being displayed
    const currentMonday = dateRange[0].utc();
    
    // Calculate next week's Monday and Sunday
    const nextMonday = currentMonday.add(7, 'day');
    const nextSunday = nextMonday.add(6, 'day'); // Sunday is Monday + 6 days
    
    // Don't allow selecting dates in the future past today
    const today = dayjs.utc();
    let endDate = nextSunday;
    
    if (nextSunday.isAfter(today)) {
      // If next Sunday is in the future, cap at today
      endDate = today;
    }
    
    setDateRange([nextMonday, endDate]);
    onDateRangeChange({
      startDate: nextMonday.toDate(),
      endDate: endDate.toDate()
    });
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          DatePicker: {
            cellHeight: 20,
            cellWidth: 20,
            fontSize: 12,
            controlHeight: 28,
            controlItemBgActive: '#e8f4ff',
          }
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 0.5,
        maxWidth: '240px',
        width: '100%',
        height: '42px'
      }}>
        <IconButton 
          onClick={handlePreviousWeek}
          size="small"
          sx={{ flexShrink: 0 }}
          aria-label="Previous Week" 
        >
          <ArrowBackIosNewIcon sx={{ fontSize: '0.5rem' }} />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }}>
          <RangePicker
            value={[dateRange[0], dateRange[1]]}
            onChange={handleDateChange}
            format="DD-MM-YYYY"
            allowClear={false}
            disabledDate={(current) => {
              // disable date after today
              return current && current > dayjs.utc().endOf('day');
            }}
            size="small"
            style={{ width: '100%', fontSize: '12px',height: '38px' }}
            popupStyle={{ zIndex: 1300 }} // to display above modal
            placeholder={['Start Date', 'End Date']}
          />
        </Box>
        
        <IconButton 
          onClick={handleNextWeek}
          size="small"
          sx={{ flexShrink: 0 }}
          // Disable next button if we're already showing the current week
          disabled={dateRange[1].isAfter(dayjs().subtract(1, 'day'))}
          aria-label="Next Week" 
        >
          <ArrowForwardIosIcon sx={{ fontSize: '0.5rem' }} />
        </IconButton>
      </Box>
    </ConfigProvider>
  );
};

export default CustomDateRangePicker;