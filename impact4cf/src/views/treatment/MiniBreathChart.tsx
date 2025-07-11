import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import ReactApexChart from 'react-apexcharts';
import { ExhaleWithContext } from 'types';

interface MiniBreathChartProps {
  date: string;
  breathData: ExhaleWithContext[];
}

const MiniBreathChart: React.FC<MiniBreathChartProps> = ({ date, breathData }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const primaryMain = theme.palette.primary.main;
  
  // Mini chart options - simplified with single line
  const miniChartOptions = {
    chart: {
      type: 'area' as const,
      height: 30,
      sparkline: {
        enabled: true
      },
      animations: {
        enabled: false
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth' as const,
      width: 1.5
    },
    tooltip: {
      enabled: false
    },
    grid: {
      show: false
    },
    xaxis: {
      labels: {
        show: false
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        show: false
      }
    },
    legend: {
      show: false
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    }
  };

  // Function to convert buffer data to pressure values with extreme downsampling
  const convertBufferToValues = (buffer: any, timeOffset: number): { x: number; y: number; }[] => {
    if (!buffer || !buffer.data || !Array.isArray(buffer.data)) {
      return [];
    }
    
    try {
      const pressureValues: number[] = [];
      const timeValues: number[] = [];
      
      // Use provided time offset as starting point
      let currentTime = timeOffset;
      
      // Very aggressive downsampling for mini visualization
      const samplingFactor = 10; 
      const maxPoints = 10; 
      
      // Process 4 bytes at a time to get float values, with limit on total points
      for (let i = 0; i < buffer.data.length - 3 && pressureValues.length < maxPoints; i += 4 * samplingFactor) {
        // Create a buffer to hold 4 bytes
        const bytes = new Uint8Array(4);
        for (let j = 0; j < 4; j++) {
          bytes[j] = buffer.data[i + j];
        }
        
        // Convert to float32 (little-endian)
        const view = new DataView(bytes.buffer);
        const value = view.getFloat32(0, true); // true for little-endian
        
        // Sanity check for the value
        if (!isNaN(value) && isFinite(value)) {
          pressureValues.push(value);
          timeValues.push(currentTime);
          currentTime += 1;
        }
      }
      
      return pressureValues.map((value, index) => ({
        x: timeValues[index],
        y: value
      }));
    } catch (err) {
      console.error("Error converting buffer data:", err);
      return [];
    }
  };
  
  // Process breath data - Using single combined series approach like BreathPressureChart
  useEffect(() => {
    if (!breathData || breathData.length === 0) {
      setError("No breath data available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Filter to get only exhales (not gaps) and exclude placeholders
      const exhales = breathData.filter(breath => 
        !breath.isPlaceholder && 
        !breath.isGap && 
        breath.values && 
        breath.values.data && 
        breath.values.data.length > 0
      );
      
      if (exhales.length === 0) {
        setError("No exhale data available");
        setLoading(false);
        return;
      }
      
      // Find earliest timestamp
      let earliestTimestamp = Number.MAX_SAFE_INTEGER;
      exhales.forEach(item => {
        if (item.startTime) {
          const startTime = new Date(item.startTime).getTime();
          if (startTime < earliestTimestamp) {
            earliestTimestamp = startTime;
          }
        }
      });
      
      if (earliestTimestamp === Number.MAX_SAFE_INTEGER) {
        earliestTimestamp = Date.now();
      }
      
      // Sort exhales by time
      const sortedExhales = [...exhales].sort((a, b) => {
        const timeA = new Date(a.startTime || 0).getTime();
        const timeB = new Date(b.startTime || 0).getTime();
        return timeA - timeB;
      });
      
      // Create a single continuous data series (like BreathPressureChart)
      let allDataPoints: { x: number; y: number }[] = [];
      let currentTimeOffset = 0;
      let previousSessionId = '';
      
      for (let i = 0; i < sortedExhales.length; i++) {
        const exhale = sortedExhales[i];
        
        // Add a larger gap between different sessions
        if (exhale.sessionId && exhale.sessionId !== previousSessionId) {
          if (previousSessionId !== '') {
            // Add a gap between sessions (add null data point to create visual separation)
            allDataPoints.push({ x: currentTimeOffset, y: null as any });
            currentTimeOffset += 15; // Add 15-unit gap between sessions
          }
          previousSessionId = exhale.sessionId;
        }
        
        if (exhale.values) {
          const dataPoints = convertBufferToValues(exhale.values, currentTimeOffset);
          
          if (dataPoints.length > 0) {
            // Add zero point before breath if not first breath in a session
            if (i > 0 && allDataPoints.length > 0 && allDataPoints[allDataPoints.length - 1].y !== null) {
              allDataPoints.push({ x: currentTimeOffset - 0.5, y: 0 });
            }
            
            // Add this exhale's data points
            allDataPoints = [...allDataPoints, ...dataPoints];
            
            // Update time offset for next exhale
            const lastPoint = dataPoints[dataPoints.length - 1];
            currentTimeOffset = lastPoint.x + 1;
            
            // Add zero point after breath
            allDataPoints.push({ x: currentTimeOffset - 0.5, y: 0 });
          }
        }
      }
      
      if (allDataPoints.length === 0) {
        setError("No valid breath data found");
      } else {
        // Create a single series with all data
        const combinedSeries = [{
          name: 'Breaths',
          data: allDataPoints,
          color: primaryMain
        }];
        
        setData(combinedSeries);
      }
      
    } catch (err) {
      console.error(`Error processing breath data for day ${date}:`, err);
      setError("Error processing breath data");
    } finally {
      setLoading(false);
    }
  }, [breathData, primaryMain, date]);
  
  if (loading) {
    return (
      <Box sx={{ height: 30, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={15} />
      </Box>
    );
  }
  
  if (error || data.length === 0) {
    return (
      <Box sx={{ height: 30, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="caption" color="text.secondary">No data</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: 30, width: '100%', maxWidth: '150px', margin: '0 auto' }}>
      <ReactApexChart
        options={miniChartOptions}
        series={data}
        type="area"
        height={30}
        width="100%"
      />
    </Box>
  );
};

export default MiniBreathChart;