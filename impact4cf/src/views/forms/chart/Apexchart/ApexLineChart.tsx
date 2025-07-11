'use client';

import React, { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';

// third party
import ReactApexChart, { Props as ChartProps } from 'react-apexcharts';

// project imports
import useConfig from 'hooks/useConfig';

// chart options
const lineChartOptions = {
  chart: {
    height: 350,
    type: 'line',
    zoom: {
      enabled: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'straight'
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  }
};

// ==============================|| LINE CHART ||============================== //

export default function ApexLineChart() {
  const theme = useTheme();
  const { mode } = useConfig();

  const { primary } = theme.palette.text;
  const darkLight = theme.palette.dark.light;
  const divider = theme.palette.divider;
  const secondary = theme.palette.secondary.main;

  const [series] = useState([
    {
      name: 'Desktops',
      data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
    }
  ]);

  const [options, setOptions] = useState<ChartProps>(lineChartOptions);

  React.useEffect(() => {
    setOptions((prevState) => ({
      ...prevState,
      colors: [secondary],
      xaxis: {
        labels: {
          style: {
            colors: [primary, primary, primary, primary, primary, primary, primary, primary, primary]
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: [primary]
          }
        }
      },
      grid: {
        borderColor: divider
      },
      tooltip: {
        theme: mode
      }
    }));
  }, [mode, primary, darkLight, divider, secondary]);
  return (
    <div id="chart">
      <ReactApexChart options={options} series={series} type="line" height={350} />
    </div>
  );
}
