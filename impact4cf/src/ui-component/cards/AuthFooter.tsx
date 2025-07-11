// material-ui
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// ==============================|| FOOTER - AUTHENTICATION 2 & 3 ||================================ //

export default function AuthFooter() {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
      <Typography variant="caption">
        &copy; UCL Great Ormond Street Institute of Child Health
      </Typography>
    </Stack>
  );
}
