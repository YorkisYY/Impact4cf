import React, { useState, useEffect, Suspense } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

// third party
import dynamic from 'next/dynamic';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SkeletonTotalGrowthBarChart from 'ui-component/cards/Skeleton/TotalGrowthBarChart';
import { gridSpacing } from 'store/constant';

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
  users: any[]; 
  selectedParticipant: any;
  participantData: {
    days: Array<{
      date: string;
      data: {
        sessions: number;
        sets: number;
        breaths: number;
      }
    }>;
    prescription: any;
  };
  onParticipantChange: (participant: any, onComplete?: () => void) => void;
}

// Separate client-side only chart component
// const ChartSection = ({ data, options }: { data: any; options: any }) => {
//   const [isMounted, setIsMounted] = useState(false);

//   useEffect(() => {
//     setIsMounted(true);
//   }, []);

//   if (!isMounted) return <SkeletonTotalGrowthBarChart />;

//   return <Chart options={options} series={data} type="bar" height={350} />;
// };

export function IndividualParticipantGraph({ 
  isLoading, 
  dateRange, 
  users, 
  selectedParticipant, 
  participantData, 
  onParticipantChange 
}: ChartProps) {
  const theme = useTheme();
  const [selectedMetric, setSelectedMetric] = useState('sessions');
  const [data, setData] = useState<number[]>([]);
  const [prescribedData, setPrescribedData] = useState<number>(0);
  const [localLoading] = useState(false); // 添加本地加载状态

  useEffect(() => {
    // Process the participant's daily data when metric or participant changes
    if (participantData && participantData.days && participantData.days.length > 0) {
      // Align data with days of week
      const mappedData = new Array(7).fill(0);
      
      participantData.days.forEach(day => {
        const dayDate = new Date(day.date);
        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        let dayOfWeek = dayDate.getDay();
        // Convert to our array index (0 = Monday, 6 = Sunday)
        dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        const metric = selectedMetric as keyof typeof day.data;
        mappedData[dayOfWeek] = day.data[metric];
      });
      
      setData(mappedData);
    } else {
      setData(Array(7).fill(0));
    }
    
    // Get prescribed data from participant's prescription
    if (participantData && participantData.prescription) {
      const metric = selectedMetric === 'sessions' ? 'sessionsPerDay' : 
                    selectedMetric === 'sets' ? 'setsPerSession' : 'exhalesPerSet';
      setPrescribedData(participantData.prescription[metric] || 0);
    } else {
      setPrescribedData(0);
    }
  }, [selectedMetric, participantData]);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
          position: 'right',
          offsetX: 0,
          offsetY: 0
        },
        y: {
          formatter: (value: number) => Math.floor(value).toString()
        }
      },
      legend: {
        show: true,
        labels: {
          colors: theme.palette.text.primary
        }
      }
    },
    series: [
      {
        name: 'Done',
        type: 'bar',
        data: data
      },
      {
        name: 'Prescribed',
        type: 'line',
        data: Array(7).fill(prescribedData)
      }
    ]
  };

  if (isLoading || localLoading) {
    return <SkeletonTotalGrowthBarChart />;
  }

  return (
    <MainCard>
      <Grid container spacing={gridSpacing} key="individual-participant-main">
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
            <Grid key="participant-selector">
              <TextField
                select
                value={selectedParticipant?.uid || ''}
                onChange={(e) => {
                  const participant = users.find(user => user.uid === e.target.value);
                  if (participant) {
                    onParticipantChange(participant);
                  }
                }}
                sx={{
                  minWidth: 150
                }}
              >
                {users.map((participant) => (
                  <MenuItem key={participant.uid} value={participant.uid}>
                    {participant.name || 'User'}
                  </MenuItem>
                ))}
              </TextField>
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