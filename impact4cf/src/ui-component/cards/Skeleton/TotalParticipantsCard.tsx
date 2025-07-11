// material-ui
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Skeleton from '@mui/material/Skeleton';

// ==============================|| SKELETON - EARNING CARD ||============================== //

export default function TotalParticipantsCard() {
  return (
    <Card>
      <CardContent>
        <Grid container direction="column" spacing={2}>
          <Grid>
            <Skeleton variant="text" width="60%" height={20} />
          </Grid>
          <Grid>
            <Skeleton variant="text" width="40%" height={40} />
          </Grid>
          <Grid>
            <Skeleton variant="text" width="80%" height={20} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
