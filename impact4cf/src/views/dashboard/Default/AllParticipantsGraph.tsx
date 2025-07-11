'use client';

import React, { useState, useEffect, Suspense } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third party
import dynamic from 'next/dynamic';

// project imports
import MainCard from '../../../ui-component/cards/MainCard';
import SkeletonTotalGrowthBarChart from '../../../ui-component/cards/Skeleton/TotalGrowthBarChart';
import { gridSpacing } from '../../../store/constant';

// Dynamically import the Chart component with no SSR
const Chart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <SkeletonTotalGrowthBarChart />
});

const treatmentOptions = [
  { value: 'sessions', label: 'ACT sessions' },
  { value: 'sets', label: 'Sets' },
  { value: 'breaths', label: 'Breaths' }
];

interface ChartProps {
  isLoading: boolean;
  dateRange: { startDate: Date; endDate: Date };
  participantsDaily: Array<{
    date: string;
    data: {
      sessions: number;
      sets: number;
      breaths: number;
    }
  }>;
  averagePrescribed: {
    sessions: number;
    sets: number;
    breaths: number;
  };
}

export function AllParticipantsGraph({ isLoading, dateRange, participantsDaily, averagePrescribed }: ChartProps) {
  const theme = useTheme();
  const [selectedMetric, setSelectedMetric] = useState('sessions');
  const [data, setData] = useState<number[]>([]);
  // const [isClient, setIsClient] = useState(false); 

  // // Only need to track client-side rendering
  // useEffect(() => {
  //   setIsClient(true);
  // }, [setIsClient]); // Added missing dependency

  // Process the data when metric changes or data changes
  useEffect(() => {
    if (participantsDaily && participantsDaily.length > 0) {
      // Initialize 7-day array with zeros (Mon-Sun)
      const mappedData = new Array(7).fill(0);
      
      participantsDaily.forEach(day => {
        const dayDate = new Date(day.date);
        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        let dayOfWeek = dayDate.getDay();
        // Convert to our array index (0 = Monday, 6 = Sunday)
        dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        const metric = selectedMetric as keyof typeof day.data;
        mappedData[dayOfWeek] = day.data[metric];
      });
      
      setData(mappedData);
    }
  }, [selectedMetric, participantsDaily]);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getPrescribedValue = () => {
    if (selectedMetric === 'sessions') {
      return averagePrescribed.sessions;
    } else if (selectedMetric === 'sets') {
      return averagePrescribed.sets;
    } else {
      return averagePrescribed.breaths;
    }
  };

  const chartData = {
    options: {
      chart: {
        type: 'bar' as const,
        height: 350,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '60%'
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: [0, 2],
        colors: ['transparent', theme.palette.secondary.main]
      },
      grid: {
        show: true,
        borderColor: theme.palette.divider,
        xaxis: {
          lines: {
            show: false
          }
        }
      },
      colors: [theme.palette.primary[200], theme.palette.secondary.main],
      xaxis: {
        categories: days,
        axisBorder: {
          show: true,
          color: theme.palette.divider
        },
        axisTicks: {
          show: true,
          color: theme.palette.divider
        }
      },
      yaxis: {
        title: {
          text: `Number of ${treatmentOptions.find((opt) => opt.value === selectedMetric)?.label || ''}`
        },
        min: 0,
        tickAmount: 4,
        labels: {
          formatter: (value: number) => Math.floor(value).toString()
        }
      },
      tooltip: {
        theme: theme.palette.mode,
        shared: true,
        intersect: false,
        fixed: {
          enabled: true,
          position: 'topRight'
        },
        y: [
          {
            formatter: (value: number) => `${Math.floor(value)}`
          },
          {
            formatter: (value: number) => `${Math.floor(value)}`
          }
        ]
      },
      legend: {
        show: true,
        labels: {
          colors: theme.palette.mode === 'dark' ? '#fff' : '#000'
        }
      }
    },
    series: [
      {
        name: 'Done',
        type: 'column',
        data: data
      },
      {
        name: 'Prescribed',
        type: 'line',
        data: Array(7).fill(getPrescribedValue())
      }
    ]
  };

  if (isLoading) {
    return <SkeletonTotalGrowthBarChart />;
  }

  return (
    <MainCard>
      <Grid container spacing={gridSpacing} key="all-participants-main">
        <Grid key="controls-container" size={12}>
          <Grid container alignItems="center" justifyContent="flex-start" spacing={2} key="controls-grid">
            <Grid key="metric-selector">
              <TextField
                select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                sx={{
                  minWidth: 150
                }}
              >
                {treatmentOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid key="title">
              <Typography
                variant="h4"
                sx={{
                  fontSize: '1.1rem',
                  fontWeight: 500
                }}
              >
                All Participants
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid key="chart-container" size={12}>
          <Suspense fallback={<SkeletonTotalGrowthBarChart />}>
            <Chart options={chartData.options} series={chartData.series} type="bar" height={350} />
          </Suspense>
        </Grid>
      </Grid>
    </MainCard>
  );
}