'use client';

import React, { useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Typography, CircularProgress } from '@mui/material';

// third party
import ReactApexChart from 'react-apexcharts';

// project imports
import useConfig from 'hooks/useConfig';

// ==============================|| BREATH PRESSURE AREA CHART ||============================== //

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
    forceNiceScale: true  },
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

interface BreathPressureChartProps {
  breathData: any[];
  prescribedPressureMaximum: number;
  prescribedPressureMinimum: number;
}

export default function BreathPressureChart({ breathData, prescribedPressureMaximum, prescribedPressureMinimum }: BreathPressureChartProps) {
  const theme = useTheme();
  const { mode } = useConfig();

  const { primary } = theme.palette.text;
  const divider = theme.palette.divider;
  const primaryMain = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const successMain = theme.palette.success.main;
  const warningMain = theme.palette.warning.main;
  const infoMain = theme.palette.info.main;
  const errorMain = theme.palette.error.main;
  const grey600 = theme.palette.grey[600];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [options, setOptions] = useState<any>(areaChartOptions);
  const [, setSessionInfo] = useState<Map<string, {color: string, sessionNumber: number}>>(new Map());

  // Function to convert buffer data to pressure values
  const convertBufferToValues = (buffer: any, timeOffset: number, breathStartTime: Date, breathEndTime: Date, isPlaceholder: boolean = false, isGap: boolean = false): { dataPoints: { x: number; y: number; }[]; endTime: number; } | [] => {
    // Handle placeholder data with minimal values to ensure visibility
    if (isPlaceholder) {
      return {
        dataPoints: [
          { x: timeOffset, y: 0.1 },
          { x: timeOffset + 0.1, y: 0.2 },
          { x: timeOffset + 0.2, y: 0.1 }
        ],
        endTime: timeOffset + 0.3
      };
    }
    
    // Regular data processing
    if (!buffer || !buffer.data || !Array.isArray(buffer.data)) {
      console.log("Buffer data is invalid");
      return [];
    }
    
    // Check if this might be a placeholder (very small data array with only zeros)
    if (buffer.data.length <= 4 && buffer.data.every((val: number) => val === 0)) {
      return {
        dataPoints: [
          { x: timeOffset, y: 0.1 },
          { x: timeOffset + 0.1, y: 0.2 },
          { x: timeOffset + 0.2, y: 0.1 }
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
          pressureValues.push(value);
        }
      }
      
      if (pressureValues.length === 0) {
        return [];
      }
      
      // Calculate actual breath duration in seconds
      const actualDurationMs = breathEndTime.getTime() - breathStartTime.getTime();
      const actualDurationSec = actualDurationMs / 1000;
      
      // Map each pressure value to a time point, spreading them evenly across the actual duration
      const timeStep = actualDurationSec / (pressureValues.length - 1 || 1); // Avoid division by zero
      
      // For gaps, we can use a slightly different visualization style (dashed line or different color)
      const dataPoints = pressureValues.map((value, index) => ({
        x: timeOffset + (index * timeStep), // timeOffset is where this breath should start on the x-axis
        y: value 
      }));
      
      return {
        dataPoints: dataPoints,
        endTime: timeOffset + actualDurationSec // Return the end time based on actual duration
      };
    } catch (err) {
      console.error("Error converting buffer data:", err);
      return [];
    }
  };

  // Process breath data when it changes
  useEffect(() => {
    if (!breathData || breathData.length === 0) {
      setLoading(false);
      setError("No breath data available");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Processing all ${breathData.length} items for chart visualization`);
      
      // Extract unique sessions first
      const uniqueSessionIds = Array.from(new Set(
        breathData.map(item => item.sessionId).filter(Boolean)
      )).sort();
      
      console.log(`Found ${uniqueSessionIds.length} unique sessions`);
      
      // IMPORTANT FIX: Find the truly earliest timestamp across ALL breaths first
      let earliestTimestamp = Number.MAX_SAFE_INTEGER;
      breathData.forEach(item => {
        if (item.startTime) {
          const startTime = new Date(item.startTime).getTime();
          if (startTime < earliestTimestamp) {
            earliestTimestamp = startTime;
          }
        }
      });
      
      // If no valid timestamps found, use a fallback
      if (earliestTimestamp === Number.MAX_SAFE_INTEGER) {
        earliestTimestamp = Date.now();
      }
      
      // Sort all breath events (both exhales and gaps) by session, set, and sequence
      const sortedBreathEvents = [...breathData].sort((a, b) => {
        // First sort by sessionId if available
        if (a.sessionId && b.sessionId && a.sessionId !== b.sessionId) {
          return uniqueSessionIds.indexOf(a.sessionId) - uniqueSessionIds.indexOf(b.sessionId);
        }
        
        // Then sort by setId if available
        if (a.setId && b.setId && a.setId !== b.setId) {
          return a.setId.localeCompare(b.setId);
        }
        
        // Then sort by sequence number/num
        const seqA = a.isGap ? (a.sequenceNum || 0) : (a.sequenceNumber || 0);
        const seqB = b.isGap ? (b.sequenceNum || 0) : (b.sequenceNumber || 0);
        if (seqA !== seqB) {
          return seqA - seqB;
        }
        
        // Finally sort by startTime as a last resort
        const timeA = new Date(a.startTime || 0).getTime();
        const timeB = new Date(b.startTime || 0).getTime();
        return timeA - timeB;
      });
      
      // Use the truly earliest timestamp as reference point (0 seconds)
      const firstBreathStartTime = earliestTimestamp;
      
      // Create a continuous time series with all breaths
      let allDataPoints: { x: number; y: number }[] = [];
      // let lastEndTime = 0;
      
      // Colors for different sessions
      const colors = [
        primaryMain, secondary, successMain, warningMain, infoMain,
        errorMain, grey600, '#8884d8', '#82ca9d', '#ffc658'
      ];
      
      // Create session info map with consistent numbering (1-based)
      const sessionInfoMap = new Map<string, {color: string, sessionNumber: number}>();
      uniqueSessionIds.forEach((sessionId, index) => {
        sessionInfoMap.set(sessionId, {
          color: colors[index % colors.length],
          sessionNumber: index + 1 // Sessions are 1-based
        });
      });
      
      // Track exhales and gaps by set for proper visualization
      const setExhales = new Map<string, any[]>();
      const setGaps = new Map<string, any[]>();
      
      // Group exhales and gaps by set
      sortedBreathEvents.forEach(event => {
        if (event.setId) {
          if (event.isGap) {
            if (!setGaps.has(event.setId)) {
              setGaps.set(event.setId, []);
            }
            setGaps.get(event.setId)?.push(event);
          } else if (!event.isPlaceholder) {
            if (!setExhales.has(event.setId)) {
              setExhales.set(event.setId, []);
            }
            setExhales.get(event.setId)?.push(event);
          }
        }
      });
      
      // Now create series data for each breath event in sequence
      for (let i = 0; i < sortedBreathEvents.length; i++) {
        const event = sortedBreathEvents[i];
        
        // Skip placeholder breaths (they're for UI clarity but shouldn't be in the main chart)
        if (event.isPlaceholder && i > 0) {
          continue;
        }
        
        // Calculate time offset in seconds from the first breath
        const breathStartTime = new Date(event.startTime || 0);
        const breathEndTime = new Date(event.endTime || event.startTime || 0); // Fallback to startTime if no endTime
        const timeOffsetSeconds = (breathStartTime.getTime() - firstBreathStartTime) / 1000;
        
        // // Add zeros at the end of previous breath and start of this breath if needed
        // if (i > 0 && timeOffsetSeconds > lastEndTime + 0.5) { // If more than 0.5 seconds gap, add zero points
        //   // Add zero point right at the end of last breath (if not already added)
        //   if (allDataPoints.length > 0 && allDataPoints[allDataPoints.length - 1].y !== 0) {
        //     allDataPoints.push({ x: lastEndTime, y: 0 });
        //   }
          
        //   // Add zero point right before this breath starts
        //   allDataPoints.push({ x: timeOffsetSeconds - 0.001, y: 0 });
        // }
        
        // Handle data with the calculated time offset
        const result = convertBufferToValues(
          event.values, 
          timeOffsetSeconds,
          breathStartTime,
          breathEndTime,
          event.isPlaceholder === true,
          event.isGap === true
        );
        
        if (result && Array.isArray(result) === false && result.dataPoints && result.dataPoints.length > 0) {
          // Add this breath event's data points to the combined array
          allDataPoints = [...allDataPoints, ...result.dataPoints];
          
          // Update the last end time
          // lastEndTime = result.endTime;
          
          // Add a zero point immediately after the breath ends for exhales, but not for gaps
          // This creates a clearer visualization of the breathing cycle
          // if (!event.isGap && result.dataPoints[result.dataPoints.length - 1].y !== 0) {
          //   allDataPoints.push({ x: lastEndTime, y: 0 });
          // }
        }
      }
      
      // Sort all data points by x value (time) to ensure proper order
      allDataPoints.sort((a, b) => a.x - b.x);
      
      if (allDataPoints.length === 0) {
        setError("No valid breath data found");
        setSeries([]);
      } else {
        // Create a single series with all data points
        const combinedSeries = [
          {
            name: 'All Breaths',
            data: allDataPoints,
            color: primaryMain
          }
        ];
        
        console.log(`Generated combined series with ${allDataPoints.length} data points`);
        setSeries(combinedSeries);
        setSessionInfo(sessionInfoMap);
      }
    } catch (err) {
      console.error("Error processing breath data for chart:", err);
      setError("Error processing breath data");
    } finally {
      setLoading(false);
    }
  }, [
    breathData, 
    primaryMain, 
    secondary, 
    successMain, 
    warningMain, 
    infoMain,
    errorMain,
    grey600
  ]);

  // Update chart options based on theme
  useEffect(() => {
    setOptions((prevState: any) => ({
      ...prevState,
      chart: {
        ...prevState.chart,
        toolbar: {
          show: true
        }
      },
      colors: [primaryMain, secondary, successMain, warningMain, infoMain],
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
  }, [mode, primary, divider, primaryMain, secondary, successMain, warningMain, infoMain, prescribedPressureMaximum, prescribedPressureMinimum]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, height: 150, alignItems: 'center' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error" variant="body2">{error}</Typography>
      </Box>
    );
  }

  if (series.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2">No breath data available</Typography>
      </Box>
    );
  }

  return (
    <div id="breath-pressure-chart">
      <ReactApexChart 
        options={options} 
        series={series} 
        type="area" 
        height={240}
      />
    </div>
  );
}