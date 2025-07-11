'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Box from '@mui/material/Box';
import {
  TextField,
  Button,
  Grid,
  Alert,
  MenuItem,
  Typography
} from '@mui/material';
import useAuth from '@/hooks/useAuth';
import { Roles } from '@/utils/constants';

interface BasicInfoProps {
  userData: any; 
  userId: string;
}

export default function BasicInfoForm({ userData, userId }: BasicInfoProps) {
  const router = useRouter();
  const { user } = useAuth();
  const hasEditPermission = user?.role === Roles.SUPER_USER || user?.role === Roles.ADMIN;

  const fallbackUserData = userData || {
    uid: '',
    deviceMode: 'Record',
    trialStage: 0,
    name: 'failed'
  };

  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    deviceMode: fallbackUserData.deviceMode ?? '',
    trialStage: fallbackUserData.trialStage?.toString() ?? '0',
    name: fallbackUserData.name ?? '',
    password: '' 
  });

  useEffect(() => {
    setFormData({
      deviceMode: fallbackUserData.deviceMode ?? '',
      trialStage: fallbackUserData.trialStage?.toString() ?? '0',
      name: fallbackUserData.name ?? '',
      password: ''
    });
  }, [userData]);

  const handleChange = (field: string, value: string) => {
    if (!hasEditPermission) return; 
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!hasEditPermission) {
      setFormError('You do not have permission to edit this information.');
      return;
    }
    
    setFormError(null);

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    const trialStageNum = parseInt(formData.trialStage, 10) || 0;
    const payload: any = {
      deviceMode: formData.deviceMode,
      trialStage: trialStageNum,
      password: formData.password
    };
   
    if (formData.name.trim() !== '') {
      payload.name = formData.name.trim();
    }

    const serviceToken = Cookies.get('serviceToken');
    if (!serviceToken) {
      setFormError('No token found. Please login again.');
      return;
    }

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}api/users/${fallbackUserData.uid}`;
      console.log('Making PUT request to:', apiUrl, 'with payload:', payload);

      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errMsg = 'Failed to save basic information!';
        try {
          const errorData = await res.json();
          errMsg = errorData?.message || errMsg;
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('No error details available.');
        }
        setFormError(errMsg);
        return;
      }

      alert('Basic information saved successfully!');
      router.push('/users-list?success=true');
    } catch (error) {
      console.error('Error saving user data:', error);
      setFormError('Something went wrong. Please try again.');
    }
  };

  const handleCancel = () => {
    router.back();
  };


  const disabledFieldStyle = {
    '& .MuiInputBase-root.Mui-disabled': {
      color: 'rgba(0, 0, 0, 0.87)', 
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.23) !important', 
      },
      '& .MuiInputBase-input': {
        WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
        opacity: 1,
      },
      '& .MuiSelect-icon': {
        color: 'rgba(0, 0, 0, 0.54)', 
      }
    }
  };

  return (
    <Box sx={{ p: 3.5 }}>
      {formError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {formError}
        </Alert>
      )}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Name
          </Typography>
          <TextField
            fullWidth
            name="username"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: false }}
            label=""
            disabled={!hasEditPermission}
            sx={disabledFieldStyle}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Password
          </Typography>
          <TextField
            fullWidth
            name="password"
            type="text"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: false }}
            label=""
            disabled={!hasEditPermission}
            sx={disabledFieldStyle}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Device Mode
          </Typography>
          <TextField
            fullWidth
            select
            name="deviceType"
            value={formData.deviceMode}
            onChange={(e) => handleChange('deviceMode', e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: false }}
            label=""
            disabled={!hasEditPermission}
            sx={disabledFieldStyle}
          >
            <MenuItem value="Record">Record</MenuItem>
            <MenuItem value="Count">Count</MenuItem>
            <MenuItem value="Graph">Graph</MenuItem>
            <MenuItem value="Coach">Coach</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Trial Stage
          </Typography>
          <TextField
            fullWidth
            name="trialMode"
            value={formData.trialStage}
            onChange={(e) => handleChange('trialStage', e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: false }}
            label=""
            disabled={!hasEditPermission}
            sx={disabledFieldStyle}
          />
        </Grid>
      </Grid>


      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
        <Button variant="outlined" onClick={handleCancel}>
          Cancel
        </Button>
        {hasEditPermission && (
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        )}
      </Box>
    </Box>
  );
}