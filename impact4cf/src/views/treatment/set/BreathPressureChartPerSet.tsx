'use client';

import React, { useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

// third party
import ReactApexChart from 'react-apexcharts';

// project imports
import useConfig from 'hooks/useConfig';
import { ExhaleWithContext } from 'types';

// Initial chart options
const areaChartOptions = {
  chart: {
    height: 250,
    type: 'area',
    toolbar: {
      show: true, // Enable toolbar with zoom functionality
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true
      },
      autoSelected: 'zoom' // Default selection is zoom tool
    },
    animations: {
      enabled: true, // Enable animations for better UX
      easing: 'easeinout',
      speed: 300
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth',
    width: 1.5
  },
  grid: {
    strokeDashArray: 0
  },
  xaxis: {
    type: 'numeric',
    title: {
      text: 'Time (seconds)',
      style: {
        fontSize: '12px',
        fontWeight: 500
      }
    },
    tickAmount: 10,
    labels: {
      formatter: function(value: number) {
        return value.toFixed(1);
      }
    }
  },
  yaxis: {
    title: {
      text: 'Pressure (cm/H₂O)',
      style: {
        fontSize: '12px',
        fontWeight: 500
      }
    },
    labels: {
      formatter: function(val: number) {
        return val.toFixed(1); // Format with 1 decimal place
      }
    },
    forceNiceScale: true
  },
  tooltip: {
    x: {
      formatter: function(val: number) {
        return val.toFixed(1) + ' s';
      }
    },
    y: {
      formatter: function(val: number) {
        return val.toFixed(1) + ' cm/H₂O'; // Format with 1 decimal place
      }
    }
  },
  legend: {
    show: false // Hide legend as there are too many entries
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.5,
      opacityTo: 0.05,
      stops: [0, 90, 100]
    }
  }
};

// types
interface BreathPressureChartProps {
  data: ExhaleWithContext[];
  isLoading: boolean;
  prescribedPressureMaximum: number;
  prescribedPressureMinimum: number;
}

const BreathPressureChartPerSet = ({ data, isLoading, prescribedPressureMaximum, prescribedPressureMinimum }: BreathPressureChartProps) => {
  const theme = useTheme();
  const { mode } = useConfig();

  const { primary } = theme.palette.text;
  const divider = theme.palette.divider;
  const primaryMain = theme.palette.primary.main;
  const secondaryMain = theme.palette.secondary.main;
  const successMain = theme.palette.success.main;
  const warningMain = theme.palette.warning.main;
  const infoMain = theme.palette.info.main;
  // const errorMain = theme.palette.error.main;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [options, setOptions] = useState<any>(areaChartOptions);

  // Function to convert buffer data to pressure values - updated to handle both exhales and gaps
  const convertBufferToValues = (
    buffer: any, 
    timeOffset: number, 
    breathStartTime: Date, 
    breathEndTime: Date, 
    isGap: boolean = false
  ): { dataPoints: { x: number; y: number; }[]; endTime: number; } | [] => {
    // Regular data processing
    if (!buffer || !buffer.data || !Array.isArray(buffer.data)) {
      console.log("Buffer data is invalid");
      return [];
    }
    
    // Check if this might be an empty buffer (very small data array with only zeros)
    if (buffer.data.length <= 4 && buffer.data.every((val: number) => val === 0)) {
      // For empty buffers, just return a few minimal data points to indicate the gap
      return {
        dataPoints: [
          { x: timeOffset, y: 0.05 },
          { x: timeOffset + 0.1, y: 0.1 },
          { x: timeOffset + 0.2, y: 0.05 }
        ],
        endTime: timeOffset + 0.3
      };
    }
    
    try {
      const pressureValues: number[] = [];
      
      // Process 4 bytes at a time to get float values
      for (let i = 0; i < buffer.data.length - 3; i += 4) {
        // Create a buffer to hold 4 bytes
        const bytes = new Uint8Array(4);
        for (let j = 0; j < 4; j++) {
          bytes[j] = buffer.data[i + j];
        }
        
        // Convert to float32 (little-endian)
        const view = new DataView(bytes.buffer);
        const value = view.getFloat32(0, true); // true for little-endian
        
        // Sanity check for the value (prevent invalid values from being added)
        if (!isNaN(value) && isFinite(value)) {
          // For gaps, we might want to transform values differently
          // For example, using absolute value for negative values to better visualize
          pressureValues.push(value);
        }
      }
      
      if (pressureValues.length === 0) {
        return [];
      }
      
      // Calculate actual breath duration in seconds
      const actualDurationMs = breathEndTime.getTime() - breathStartTime.getTime();
      const actualDurationSec = Math.max(0.1, actualDurationMs / 1000); // At least 0.1s to avoid division by zero
      
      // Map each pressure value to a time point, spreading them evenly across the actual duration
      const timeStep = actualDurationSec / (pressureValues.length || 1);
      const dataPoints = pressureValues.map((value, index) => ({
        x: timeOffset + (index * timeStep),
        y: value
      }));
      
      return {
        dataPoints: dataPoints,
        endTime: timeOffset + actualDurationSec
      };
    } catch (err) {
      console.error("Error converting buffer data:", err);
      return [];
    }
  };

  // Process breath data when it changes
  useEffect(() => {
    if (!data || data.length === 0) {
      setLoading(false);
      setError("No breath data available");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Processing ${data.length} breath items for set chart visualization`);
      
      // Filter out any items without startTime to avoid errors
      const validItems = data.filter(item => item.startTime);
      
      if (validItems.length === 0) {
        setError("No valid breath data with timestamps");
        setLoading(false);
        return;
      }
      
      // Sort all events (exhales and gaps) by sequence number
      const sortedBreathEvents = [...validItems].sort((a, b) => {
        // First by sequence number/num (exhales use sequenceNumber, gaps use sequenceNum)
        const seqA = a.isGap ? (a.sequenceNum || 0) : (a.sequenceNumber || 0);
        const seqB = b.isGap ? (b.sequenceNum || 0) : (b.sequenceNumber || 0);
        
        if (seqA !== seqB) {
          return seqA - seqB;
        }
        
        // If sequence numbers are the same, sort by timestamp
        const timeA = new Date(a.startTime || 0).getTime();
        const timeB = new Date(b.startTime || 0).getTime();
        return timeA - timeB;
      });
      
      // Calculate the earliest start time to use as reference point (0 seconds)
      const firstBreathStartTime = new Date(sortedBreathEvents[0].startTime).getTime();
      
      // Create a single combined series with all breath data points
      let allDataPoints: { x: number; y: number }[] = [];
      // let lastEndTime = 0;
      
      // Process all breath events (both exhales and gaps)
      for (let i = 0; i < sortedBreathEvents.length; i++) {
        const breath = sortedBreathEvents[i];
        
        // Calculate time offset in seconds from the first breath
        const breathStartTime = new Date(breath.startTime);
        const breathEndTime = new Date(breath.endTime || breath.startTime);
        const timeOffsetSeconds = (breathStartTime.getTime() - firstBreathStartTime) / 1000;
        
        // // Add zeros at the end of previous breath and start of this breath if needed
        // if (i > 0 && timeOffsetSeconds > lastEndTime + 0.1) { // If gap is significant
        //   // Add zero point right at the end of last breath (if not already added)
        //   if (allDataPoints.length > 0 && allDataPoints[allDataPoints.length - 1].y !== 0) {
        //     allDataPoints.push({ x: lastEndTime, y: 0 });
        //   }
          
        //   // Add zero point right before this breath starts
        //   allDataPoints.push({ x: timeOffsetSeconds - 0.001, y: 0 });
        // }
        
        // Handle the event data with the calculated time offset
        const result = convertBufferToValues(
          breath.values, 
          timeOffsetSeconds,
          breathStartTime,
          breathEndTime,
          breath.isGap === true
        );
        
        if (result && Array.isArray(result) === false && result.dataPoints && result.dataPoints.length > 0) {
          // Add this breath's data points to the combined array
          allDataPoints = [...allDataPoints, ...result.dataPoints];
          
          // // Update the last end time
          // lastEndTime = result.endTime;
          
          // // Add a zero point immediately after the breath ends for exhales, but not for gaps
          // if (!breath.isGap && result.dataPoints[result.dataPoints.length - 1].y !== 0) {
          //   allDataPoints.push({ x: lastEndTime, y: 0 });
          // }
        }
      }
      
      // Sort all data points by x value (time) to ensure proper order
      allDataPoints.sort((a, b) => a.x - b.x);
      
      if (allDataPoints.length === 0) {
        setError("No valid breath data points found");
      } else {
        // Create a single series with all breath data points
        const combinedSeries = [
          {
            name: 'Set Breathing Pattern',
            data: allDataPoints,
            color: primaryMain
          }
        ];
        
        console.log(`Generated combined series with ${allDataPoints.length} data points`);
        setSeries(combinedSeries);
      }
    } catch (err) {
      console.error("Error processing breath data for chart:", err);
      setError("Error processing breath data");
    } finally {
      setLoading(false);
    }
  }, [
    data,
    primaryMain
  ]);

  // Update chart options based on theme and prescribed pressure
  useEffect(() => {
    setOptions((prevState: any) => ({
      ...prevState,
      chart: {
        ...prevState.chart,
        toolbar: {
          show: true
        }
      },
      colors: [primaryMain, secondaryMain, successMain, warningMain, infoMain],
      xaxis: {
        ...prevState.xaxis,
        labels: {
          ...prevState.xaxis.labels,
          style: {
            colors: primary
          }
        }
      },
      yaxis: {
        ...prevState.yaxis,
        // min: -10,
        // max: Math.max(prescribedPressureMaximum * 1.5, 20), // Set max to be 10% higher than the prescribed maximum
        labels: {
          ...prevState.yaxis.labels,
          style: {
            colors: primary
          }
        }
      },
      grid: {
        borderColor: divider
      },
      tooltip: {
        theme: mode === 'dark' ? 'dark' : 'light'
      },
      annotations: {
        yaxis: [
          {
            y: prescribedPressureMaximum,
            borderColor: '#FFA500',
            strokeDashArray: 0,
            borderWidth: 2,
            label: {
              text: `Maximum Target: ${prescribedPressureMaximum} cm/H₂O`,
              style: {
                background: '#FFA500',
                color: '#fff'
              },
              offsetX: 20
            }
          },
          {
            y: prescribedPressureMinimum,
            borderColor: '#FFA500',
            strokeDashArray: 0,
            borderWidth: 2,
            label: {
              text: `Minimum Target: ${prescribedPressureMinimum} cm/H₂O`,
              style: {
                background: '#FFA500',
                color: '#fff'
              },
              offsetX: 20
            }
          }
        ]
      }
    }));
  }, [mode, primary, divider, primaryMain, secondaryMain, successMain, warningMain, infoMain, prescribedPressureMaximum, prescribedPressureMinimum]);

  if (isLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
        <Typography variant="body1" color="textSecondary">
          {error || "No breath data available for this set"}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <div id="breath-pressure-chart-per-set">
        <ReactApexChart 
          options={options} 
          series={series} 
          type="area" 
          height={280} 
        />
      </div>
    </>
  );
};

export default BreathPressureChartPerSet;