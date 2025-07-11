'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { DatePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb'; 
import updateLocale from 'dayjs/plugin/updateLocale';
import isoWeek from 'dayjs/plugin/isoWeek'; // Import isoWeek plugin for week calculation
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// Extend dayjs plugins
dayjs.extend(updateLocale);
dayjs.extend(isoWeek);
dayjs.updateLocale('en-gb', {
  weekStart: 1, // Set Monday as the first day of the week
});
const { RangePicker } = DatePicker;

interface CustomDateRangePickerProps {
  onDateRangeChange: (dateRange: { startDate: Date; endDate: Date } | null) => void;
  initialDateRange: { startDate: Date; endDate: Date };
}

const CustomDateRangePicker = ({ onDateRangeChange, initialDateRange }: CustomDateRangePickerProps) => {
  // Initialize date range to current week (Monday to Sunday)
  const initializeWeekRange = (): [dayjs.Dayjs, dayjs.Dayjs] => {
    // If initial date range is provided, check if it's valid (if it's start and end of a week)
    if (initialDateRange) {
      const startDate = dayjs(initialDateRange.startDate);
      const endDate = dayjs(initialDateRange.endDate);
      
      // Check if start date is Monday and end date is Sunday with 6 days difference
      if (startDate.day() === 1 && endDate.day() === 0 && endDate.diff(startDate, 'days') === 6) {
        return [startDate, endDate] as [dayjs.Dayjs, dayjs.Dayjs];
      }
    }
    
    // Default or invalid initial range, use current week
    const today = dayjs();
    const monday = today.startOf('isoWeek');
    const sunday = today.endOf('isoWeek');
    return [monday, sunday] as [dayjs.Dayjs, dayjs.Dayjs];
  };

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(initializeWeekRange());

  // When component mounts, notify parent component of the correct date range
  useEffect(() => {
    onDateRangeChange({
      startDate: dateRange[0].toDate(),
      endDate: dateRange[1].toDate()
    });
  }, []);

  // Ensure dates can only be selected from Monday to Sunday for a complete week
  const disabledDate = (current: dayjs.Dayjs) => {
    // Cannot select dates after today
    if (current && current > dayjs().endOf('day')) {
      return true;
    }
    
    // Must be either Monday or Sunday
    return current.day() !== 1 && current.day() !== 0;
  };

  // Custom date selection handler to ensure always selecting a complete week
  const handleDateChange = useCallback((dates: any, dateStrings: [string, string]) => {
    if (!dates || !dates[0]) return;

    const [start] = dates as [dayjs.Dayjs, dayjs.Dayjs];
    let weekStart, weekEnd;

    // If selected day is Monday, use this week's Monday to Sunday
    if (start.day() === 1) {
      weekStart = start;
      weekEnd = start.add(6, 'days');
    } 
    // If selected day is Sunday, use last Monday to this Sunday
    else if (start.day() === 0) {
      weekEnd = start;
      weekStart = start.subtract(6, 'days');
    }
    // Other cases should not happen (because disabledDate will prevent it)
    else {
      return;
    }
    
    setDateRange([weekStart, weekEnd]);
    onDateRangeChange({
      startDate: weekStart.toDate(),
      endDate: weekEnd.toDate()
    });
  }, [onDateRangeChange]);

  // Handle "Previous Week" button click
  const handlePreviousWeek = () => {
    const newStartDate = dateRange[0].subtract(7, 'day');
    const newEndDate = dateRange[1].subtract(7, 'day');
    
    setDateRange([newStartDate, newEndDate]);
    onDateRangeChange({
      startDate: newStartDate.toDate(),
      endDate: newEndDate.toDate()
    });
  };

  // Handle "Next Week" button click - ensure cannot select future weeks
  const handleNextWeek = () => {
    const newStartDate = dateRange[0].add(7, 'day');
    const newEndDate = dateRange[1].add(7, 'day');
    
    // Do not allow if exceeds current date
    if (newEndDate > dayjs().endOf('day')) {
      return;
    }
    
    setDateRange([newStartDate, newEndDate]);
    onDateRangeChange({
      startDate: newStartDate.toDate(),
      endDate: newEndDate.toDate()
    });
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          DatePicker: {
            cellHeight: 24,
            cellWidth: 24,
            fontSize: 14,
            controlHeight: 38,
            controlItemBgActive: '#e8f4ff',
          }
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        maxWidth: '300px',
        width: '100%',
        height: '42px'
      }}>
        <IconButton 
          onClick={handlePreviousWeek}
          size="small"
          sx={{ 
            flexShrink: 0,
            width: '32px',
            height: '32px',
          }}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: '0.75rem' }} />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }}>
          <RangePicker
            value={[dateRange[0], dateRange[1]]}
            onChange={handleDateChange}
            format="DD-MM-YYYY"
            allowClear={false}
            disabledDate={disabledDate}
            size="middle"
            style={{ 
              width: '100%', 
              fontSize: '14px',
              height: '38px' 
            }}
            popupStyle={{ zIndex: 1300 }}
            placeholder={['Start Date (Mon)', 'End Date (Sun)']}
            renderExtraFooter={() => (
              <div style={{ padding: '8px 0', textAlign: 'center' }}>
                Please choose from Monday to Sunday
              </div>
            )}
          />
        </Box>
        
        <IconButton 
          onClick={handleNextWeek}
          size="small"
          sx={{ 
            flexShrink: 0,
            width: '32px',
            height: '32px',
          }}
        >
          <ArrowForwardIosIcon sx={{ fontSize: '0.75rem' }} />
        </IconButton>
      </Box>
    </ConfigProvider>
  );
};

export default CustomDateRangePicker;