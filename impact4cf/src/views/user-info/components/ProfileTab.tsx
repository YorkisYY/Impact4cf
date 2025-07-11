'use client';


import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';

import SubCard from 'ui-component/cards/SubCard';
import { gridSpacing } from 'store/constant';
import { BasicUser } from '@/types/user-list-data';


export default function ProfileTab({ userData }: { userData: BasicUser }) {

    const {name, email, role, deviceMode} = userData;

  return (
    <Grid container spacing={gridSpacing} justifyContent="center">
      <Grid size={{ sm: 6, md: 8 }}>
        <SubCard title="Edit Account Details" sx={{ maxWidth: '700px', margin: '0 auto' }} >
          <Grid container spacing={gridSpacing}>
            <Grid size={12}>
              <TextField id="outlined-basic1" fullWidth label="Name" defaultValue={name ?? 'Unknown'} disabled/>
            </Grid>
            <Grid size={12}>
              <TextField id="outlined-basic6" fullWidth label="Email address" defaultValue={email ?? 'Unknown'} disabled  />
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <TextField id="outlined-basic4" fullWidth label="Role" defaultValue={role ?? 'Unknown'} disabled />
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <TextField id="outlined-basic5" fullWidth label="Device Mode" defaultValue={deviceMode ?? 'Unknown'} disabled />
            </Grid>
          </Grid>
        </SubCard>
      </Grid>
    </Grid>
  );
}
