'use client';

// material-ui
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third party
import Chart, { Props as ChartProps } from 'react-apexcharts';

// project imports
import MainCard from 'ui-component/cards/MainCard';

// assets
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

// =========================|| CONVERSIONS CHART CARD ||========================= //

export default function ConversionsChartCard({ chartData }: { chartData: ChartProps }) {
  return (
    <MainCard content={false}>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={1} alignItems="center">
          <Grid>
            <Typography variant="subtitle1">New Stock</Typography>
          </Grid>
          <Grid>
            <Typography variant="caption">(Purchased)</Typography>
          </Grid>
        </Grid>
        <Grid container spacing={2.5} alignItems="center">
          <Grid>
            <Typography variant="h4">0.85%</Typography>
          </Grid>
          <Grid>
            <Grid container spacing={0.5} alignItems="center" sx={{ color: 'info.main' }}>
              <ArrowUpwardIcon color="inherit" sx={{ fontSize: '1.25rem' }} />
              <Typography variant="h4" sx={{ color: 'inherit' }}>
                0.50%
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      <Chart {...chartData} />
    </MainCard>
  );
}
