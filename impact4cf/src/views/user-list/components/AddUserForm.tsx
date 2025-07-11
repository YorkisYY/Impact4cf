'use client';

import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import Cookies from 'js-cookie';
import {
  Grid,
  TextField,
  Button,
  MenuItem,
  Box,
  Paper,
  Alert,
  Typography
} from '@mui/material';
import { useRouter } from 'next/navigation';



const validationSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  name: yup.string().required('Name is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  trialStage: yup
    .number()
    .oneOf([0, 1], 'Must be in the range 0-1')
    .required('Trial stage is required'),
  deviceMode: yup
    .string()
    .oneOf(['Record', 'Coach'], 'Must be either "Record" or "Coach"')
    .required('Device mode is required'),
  deviceRecordingMode: yup
    .string()
    .oneOf(['Breaths', 'Time'], 'Must be either "Breaths" or "Time"')
    .required('Device recording mode is required'),
  role: yup
    .string()
    .oneOf(['admin', 'patient', 'researcher'], 'Invalid role')
    .required('Role is required')
});

export default function AddUserForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      email: '',
      name: '',
      password: '',
      trialStage: 0,
      deviceMode: 'Record',
      deviceRecordingMode: 'Breaths',
      role: 'patient'
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setFormError(null);
      try {
        const serviceToken = Cookies.get('serviceToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceToken}`
          },
          body: JSON.stringify(values)
        });

        if (response.status === 409) {
          setFormError('A user with this email already exists.');
          return;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setFormError(data?.message || 'Failed to add user. Please try again.');
          return;
        }


        router.push('/users-list/?success=true');
      } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
        console.error('Error adding user:', error);
        setFormError('Something went wrong. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <Paper elevation={3} sx={{ padding: 4, maxWidth: '100%', margin: '0 auto' }}>
      <Typography variant="h5" gutterBottom>
        Add New User
      </Typography>

      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit} noValidate>
        <Grid container spacing={3}>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              autoComplete="off"
            />
          </Grid>


          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              autoComplete="off"
            />
          </Grid>


          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="password"
              label="Password"
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              autoComplete="new-password"
            />
          </Grid>


          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Trial Stage"
              name="trialStage"
              type="number"
              value={formik.values.trialStage}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.trialStage && Boolean(formik.errors.trialStage)}
              helperText={formik.touched.trialStage && formik.errors.trialStage}
            > 
                <MenuItem value={0}>0</MenuItem>
                <MenuItem value={1}>1</MenuItem>
            
            
            </TextField>
          </Grid>


          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Device Mode"
              name="deviceMode"
              value={formik.values.deviceMode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.deviceMode && Boolean(formik.errors.deviceMode)}
              helperText={formik.touched.deviceMode && formik.errors.deviceMode}
            >
              <MenuItem value="Record">Record</MenuItem>
              <MenuItem value="Coach">Coach</MenuItem>
            </TextField>
          </Grid>


          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Device Recording Mode"
              name="deviceRecordingMode"
              value={formik.values.deviceRecordingMode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.deviceRecordingMode &&
                Boolean(formik.errors.deviceRecordingMode)
              }
              helperText={
                formik.touched.deviceRecordingMode &&
                formik.errors.deviceRecordingMode
              }
            >
              <MenuItem value="Breaths">Breaths</MenuItem>
              <MenuItem value="Time">Time</MenuItem>
            </TextField>
          </Grid>


          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Role"
              name="role"
              value={formik.values.role}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.role && Boolean(formik.errors.role)}
              helperText={formik.touched.role && formik.errors.role}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="patient">Patient</MenuItem>
              <MenuItem value="researcher">Researcher</MenuItem>
            </TextField>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                type="submit"
                disabled={formik.isSubmitting}
              >
                Add User
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
