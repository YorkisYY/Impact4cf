
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  Container,
  Box,
  Grid,
  TextField,
  Button,
  Alert,
  Typography,
  MenuItem,
  useTheme
} from '@mui/material';

import CustomBreadCrumbs from './CustomBreadcrumbs';
import MainCard from 'ui-component/cards/MainCard';
import PrescriptionHeader from './PrescriptionHeader';
import useAuth from '@/hooks/useAuth';
import { Roles } from '@/utils/constants';

interface PrescriptionData {
  uid: string;
  name: string;
  description: string;
  sessionsPerDay: number;
  daysPerWeek: number;
  setsPerSession: number;
  exhalesPerSet: number;
  exhaleDuration: number;
  exhaleTargetPressure: number;
  exhaleTargetRange: number;
  exhaleLeadInOutDuration: number;
  isCurrentPrescription?: boolean;
  deviceMode?: string;
  [key: string]: any;
}

interface PrescriptionPageClientProps {
  userData: any;
  allPrescriptions: PrescriptionData[];
  currentPrescription: PrescriptionData | null;
}

export default function PrescriptionPageClient({
  userData,
  allPrescriptions,
  currentPrescription,
}: PrescriptionPageClientProps) {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const hasEditPermission = user?.role === Roles.SUPER_USER || user?.role === Roles.ADMIN;

  // fallback prescription
  const fallbackPrescription: PrescriptionData = currentPrescription || {
    uid: '',
    name: 'Unnamed User',
    description: 'Default prescription for fall back situation',
    sessionsPerDay: 2,
    daysPerWeek: 7,
    setsPerSession: 3,
    exhalesPerSet: 10,
    exhaleDuration: 1.8,
    exhaleTargetPressure: 17,
    exhaleTargetRange: 1.4,
    exhaleLeadInOutDuration: 0.1,
    isCurrentPrescription: true,
    deviceMode: 'Record'
  };

  const [selectedId, setSelectedId] = useState<string>(fallbackPrescription.uid);

  const [formData, setFormData] = useState({
    deviceMode: userData.deviceMode || fallbackPrescription.deviceMode || '',
    sessionsPerDay: fallbackPrescription.sessionsPerDay.toString(),
    setsPerSession: fallbackPrescription.setsPerSession.toString(),
    exhalesPerSet: fallbackPrescription.exhalesPerSet.toString(),
    exhaleDuration: fallbackPrescription.exhaleDuration.toString(),
    exhaleTargetPressure: fallbackPrescription.exhaleTargetPressure.toString(),
    exhaleTargetRange: fallbackPrescription.exhaleTargetRange.toString(),
    description: fallbackPrescription.description
  });

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const pres = currentPrescription || fallbackPrescription;
    setSelectedId(pres.uid);
    setFormData({
      deviceMode: userData.deviceMode || pres.deviceMode || 'Record',
      sessionsPerDay: pres.sessionsPerDay.toString(),
      setsPerSession: pres.setsPerSession.toString(),
      exhalesPerSet: pres.exhalesPerSet.toString(),
      exhaleDuration: pres.exhaleDuration.toString(),
      exhaleTargetPressure: pres.exhaleTargetPressure.toString(),
      exhaleTargetRange: pres.exhaleTargetRange.toString(),
      description: pres.description
    });
  }, [currentPrescription]);

  const onLoadPrescription = (prescription: PrescriptionData) => {
    setSelectedId(prescription.uid);
    setFormData({
      deviceMode: prescription.deviceMode || 'Record',
      sessionsPerDay: prescription.sessionsPerDay.toString(),
      setsPerSession: prescription.setsPerSession.toString(),
      exhalesPerSet: prescription.exhalesPerSet.toString(),
      exhaleDuration: prescription.exhaleDuration.toString(),
      exhaleTargetPressure: prescription.exhaleTargetPressure.toString(),
      exhaleTargetRange: prescription.exhaleTargetRange.toString(),
      description: prescription.description
    });
  };

  const handleChange = (field: string, value: string) => {
    if (!hasEditPermission) return; 
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!hasEditPermission) {
      setFormError('You do not have permission to edit this information.');
      return;
    }

    setFormError(null);

    if (!selectedId) {
      setFormError('No prescription selected.');
      return;
    }
    const serviceToken = Cookies.get('serviceToken');
    if (!serviceToken) {
      setFormError('No token found. Please login again.');
      return;
    }

    const prescriptionPayload = {
      sessionsPerDay: parseInt(formData.sessionsPerDay, 10) || 1,
      setsPerSession: parseInt(formData.setsPerSession, 10) || 1,
      exhalesPerSet: parseInt(formData.exhalesPerSet, 10) || 0,
      exhaleDuration: parseFloat(formData.exhaleDuration) || 3,
      exhaleTargetPressure: parseFloat(formData.exhaleTargetPressure) || 0,
      exhaleTargetRange: parseFloat(formData.exhaleTargetRange) || 0,
      description: formData.description
    };

    const userPayload = {
      deviceMode: formData.deviceMode
    };

    try {
      const prescriptionApiUrl = `${process.env.NEXT_PUBLIC_API_URL}api/prescriptions/${selectedId}`;
      const presRes = await fetch(prescriptionApiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceToken}`
        },
        body: JSON.stringify(prescriptionPayload)
      });
      if (!presRes.ok) {
        let errMsg = 'Failed to save prescription!';
        try {
          const errorData = await presRes.json();
          errMsg = errorData?.message || errMsg;
        } catch (e) {}
        setFormError(errMsg);
        return;
      }

      const userApiUrl = `${process.env.NEXT_PUBLIC_API_URL}api/users/${userData.uid}`;
      const userRes = await fetch(userApiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceToken}`
        },
        body: JSON.stringify(userPayload)
      });
      if (!userRes.ok) {
        let errMsg = 'Failed to update device mode!';
        try {
          const errorData = await userRes.json();
          errMsg = errorData?.message || errMsg;
        } catch (e) {}
        setFormError(errMsg);
        return;
      }

      alert('Prescription and device mode updated successfully!');
      router.push('/users-list?success=true');
    } catch (error) {
      setFormError('Something went wrong. Please try again.');
    }
  };

  const breadcrumbLinks = [
    { title: 'Users', to: '/users-list' },
    { title: userData.name || 'Unnamed User', to: `/${userData.uid}/all` },
    { title: 'Prescription' }
  ];


  const titleContent = (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <span>Prescription</span>
      <PrescriptionHeader
      // @ts-ignore
        onLoadPrescription={onLoadPrescription}
        prescriptionHistory={allPrescriptions}
        currentPrescription={currentPrescription || fallbackPrescription}
      />
    </Box>
  );

  
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
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          bgcolor: theme.palette.background.paper,
          pt: 0.3,
          pb: 0.3,
          px: 2,
          borderRadius: 1,
          borderColor: theme.palette.divider,
          mt: -2,
          height: '46px',
        }}
      >
        <CustomBreadCrumbs
          custom={true}
          titleBottom
          card={false}
          sx={{ mb: '0px !important' }}
          links={breadcrumbLinks}
        />
      </Box>

      <MainCard title={titleContent} content={false}>
        <Box sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            {formError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {formError}
              </Alert>
            )}

            <Box sx={{ mb: 3, width: '49%' }}>
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
            </Box>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Sessions Per Day
                </Typography>
                <TextField
                  fullWidth
                  value={formData.sessionsPerDay}
                  onChange={(e) => handleChange('sessionsPerDay', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: false }}
                  label=""
                  disabled={!hasEditPermission}
                  sx={disabledFieldStyle}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Sets Per Session
                </Typography>
                <TextField
                  fullWidth
                  value={formData.setsPerSession}
                  onChange={(e) => handleChange('setsPerSession', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: false }}
                  label=""
                  disabled={!hasEditPermission}
                  sx={disabledFieldStyle}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Exhales Per Set
                </Typography>
                <TextField
                  fullWidth
                  value={formData.exhalesPerSet}
                  onChange={(e) => handleChange('exhalesPerSet', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: false }}
                  label=""
                  disabled={!hasEditPermission}
                  sx={disabledFieldStyle}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Exhale Duration
                </Typography>
                <TextField
                  fullWidth
                  value={formData.exhaleDuration}
                  onChange={(e) => handleChange('exhaleDuration', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: false }}
                  label=""
                  disabled={!hasEditPermission}
                  sx={disabledFieldStyle}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Exhale Target Pressure
                </Typography>
                <TextField
                  fullWidth
                  value={formData.exhaleTargetPressure}
                  onChange={(e) => handleChange('exhaleTargetPressure', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: false }}
                  label=""
                  disabled={!hasEditPermission}
                  sx={disabledFieldStyle}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Exhale Target Range
                </Typography>
                <TextField
                  fullWidth
                  value={formData.exhaleTargetRange}
                  onChange={(e) => handleChange('exhaleTargetRange', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: false }}
                  label=""
                  disabled={!hasEditPermission}
                  sx={disabledFieldStyle}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Description
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
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
        </Box>
      </MainCard>
    </Container>
  );
}