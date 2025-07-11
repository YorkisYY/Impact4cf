// material-ui
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Skeleton from '@mui/material/Skeleton';

// project imports
import { gridSpacing } from 'store/constant';

// ==============================|| SKELETON TOTAL GROWTH BAR CHART ||============================== //

export default function TotalGrowthBarChart() {
  return (
    <Card>
      <CardContent>
        <Grid container spacing={gridSpacing} key="skeleton-main">
          <Grid size={12} key="skeleton-header">
            <Grid
              container
              spacing={gridSpacing}
              sx={{ alignItems: 'center', justifyContent: 'space-between' }}
              key="skeleton-header-content"
            >
              <Grid size="grow" key="skeleton-title">
                <Grid container spacing={1} key="skeleton-title-container">
                  <Grid size={12} key="skeleton-text">
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid size={12} key="skeleton-rect-small">
                    <Skeleton variant="rectangular" height={20} />
                  </Grid>
                </Grid>
              </Grid>
              <Grid key="skeleton-side">
                <Skeleton variant="rectangular" height={50} width={80} />
              </Grid>
            </Grid>
          </Grid>
          <Grid size={12} key="skeleton-chart">
            <Skeleton variant="rectangular" height={530} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
