'use client';

import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Box from '@mui/material/Box';

// project imports
import { ThemeMode } from 'config';
import MainCard from 'ui-component/cards/MainCard';

// types
import { TabsProps } from 'types';
import { BasicUser } from '@/types/user-list-data';
import ProfileTab from './ProfileTab';
import ChangePasswordTab from './ChangePasswordTab';

// tabs
function TabPanel({ children, value, index, ...other }: TabsProps) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}



export default function UserInfoView({ userData }: { userData: BasicUser }) {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <MainCard title="My Account">
      <div>
        <Tabs
          value={value}
          indicatorColor="primary"
          onChange={handleChange}
          sx={{
            mb: 3,
            minHeight: 'auto',
            '& button': {
              minWidth: 100
            },
            '& .MuiTab-root': {
              minHeight: 'auto',
              minWidth: 10,
              py: 1.5,
              px: 1,
              mr: 2.25,
              color: theme.palette.mode === ThemeMode.DARK ? 'grey.600' : 'grey.900'
            },
            '& .Mui-selected': {
              color: 'primary.main'
            }
          }}
          aria-label="simple tabs example"
          variant="scrollable"
        >
          <Tab label="Profile" {...a11yProps(0)} />
          <Tab label="Change Password" {...a11yProps(1)} />
        </Tabs>
        <TabPanel value={value} index={0}>
          <ProfileTab userData={userData}/>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <ChangePasswordTab />
        </TabPanel>
      </div>
    </MainCard>
  );
}
