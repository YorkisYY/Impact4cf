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
    show: false // Hide legend as there's only one series
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
  data: any[];
  isLoading: boolean;
  prescribedPressureMaximum: number;
  prescribedPressureMinimum: number;
}

const BreathPressureChartPerBreath = ({ data, isLoading, prescribedPressureMaximum, prescribedPressureMinimum }: BreathPressureChartProps) => {
  const theme = useTheme();
  const { mode } = useConfig();

  const { primary } = theme.palette.text;
  const divider = theme.palette.divider;
  const primaryMain = theme.palette.primary.main;
  const secondaryMain = theme.palette.secondary.main;
  const successMain = theme.palette.success.main;
  const warningMain = theme.palette.warning.main;
  const infoMain = theme.palette.info.main;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [options, setOptions] = useState<any>(areaChartOptions);

  // Function to convert buffer data to pressure values
  const convertBufferToValues = (buffer: any, breathData: any): { dataPoints: { x: number; y: number; }[]; } | [] => {
    // Check if buffer data is available
    if (!buffer || !buffer.data || !Array.isArray(buffer.data)) {
      console.log("Buffer data is invalid");
      return [];
    }
    
    try {
      // First count the number of valid data points we expect
      const validDataPointCount = Math.floor(buffer.data.length / 4);
      if (validDataPointCount === 0) {
        return [];
      }
      
      // Use the duration directly from the API data
      // Convert from milliseconds to seconds for display
      const breathDurationSec = breathData.duration / 1000;
      console.log(`Breath duration from API: ${breathDurationSec}s`);
      
      // Calculate the time step based on the actual duration and number of samples
      const timeStep = breathDurationSec / validDataPointCount;
      console.log(`Calculated time step: ${timeStep}s based on duration ${breathDurationSec}s and ${validDataPointCount} points`);
      
      const pressureValues: number[] = [];
      const timeValues: number[] = [];

      // Start at time 0 for this single breath
      let currentTime = 0;
      
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
          pressureValues.push(Math.max(0, value)); // Ensure non-negative values
          timeValues.push(currentTime);
          
          // Use the calculated time step based on actual breath duration
          currentTime += timeStep;
        }
      }
      
      if (pressureValues.length === 0) {
        return [];
      }
      
      // Ensure our visualization spans the full breath duration
      const dataPoints = [];
      
      // Add a starting point at zero pressure
      dataPoints.push({ x: 0, y: 0 });
      
      // Add all the pressure readings
      pressureValues.forEach((value, index) => {
        dataPoints.push({
          x: timeValues[index],
          y: value
        });
      });
      
      // Add a final point returning to 0 pressure at the exact breath duration
      dataPoints.push({ x: breathDurationSec, y: 0 });
      
      // Verify that our chart covers the full breath duration
      const lastPoint = dataPoints[dataPoints.length - 1];
      console.log(`Chart end time: ${lastPoint.x}s, should match breath duration: ${breathDurationSec}s`);
      
      return { dataPoints };
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
      
      // For breath view, we expect a single breath's data
      const breath = data[0]; // Use the first breath if multiple are provided
      
      if (!breath) {
        setError("Breath data is missing");
        setLoading(false);
        return;
      }
      
      // Check for values from the consolidated API
      if (!breath.values) {
        setError("Breath data is missing pressure values");
        setLoading(false);
        return;
      }
      
      // Pass the entire breath object to get duration and other properties
      const result = convertBufferToValues(breath.values, breath);
      
      if (result && Array.isArray(result) === false && result.dataPoints && result.dataPoints.length > 0) {
        // Create a single series for this breath
        const breathSeries = [{
          name: "Breath Pressure",
          data: result.dataPoints,
          color: primaryMain
        }];
        
        setSeries(breathSeries);
        console.log(`Breath chart created with ${result.dataPoints.length} data points`);
      } else {
        setError("No valid pressure data found for this breath");
      }
    } catch (err) {
      console.error("Error processing breath data for chart:", err);
      setError(`Error processing breath data: ${(err as Error).message}`);
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
      colors: [primaryMain],
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
        // min: 0,
        // max: Math.max(prescribedPressureMaximum * 1.2, 20), // Set max to be 10% higher than the prescribed maximum
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
          {error || "No breath data available"}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <div id="breath-pressure-chart">
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

export default BreathPressureChartPerBreath;