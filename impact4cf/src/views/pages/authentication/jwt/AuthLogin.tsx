'use client';

// next
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MouseEvent, useState, useEffect, useRef } from 'react';

// material‑ui
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Alert } from '@mui/material';

// third‑party
import * as Yup from 'yup';
import { Formik, FormikProps } from 'formik';

// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
import useAuth from 'hooks/useAuth';
import useScriptRef from 'hooks/useScriptRef';

// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

interface LoginValues {
  email: string;
  password: string;
  submit: string | null;
}

export default function JWTLogin({ ...others }) {
  const theme = useTheme();
  const { login, isLoggedIn } = useAuth();
  const scriptedRef = useScriptRef();

  const [checked, setChecked] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (e: MouseEvent) => e.preventDefault();

  const searchParams = useSearchParams();
  const authParam = searchParams.get('auth');

  const formikRef = useRef<FormikProps<LoginValues>>(null);

  // sync possible browser‑autofill values into Formik after mount
  useEffect(() => {
    const emailEl = document.getElementById('outlined-adornment-email-login') as HTMLInputElement | null;
    const pwEl = document.getElementById('outlined-adornment-password-login') as HTMLInputElement | null;

    if (formikRef.current) {
      if (emailEl?.value && !formikRef.current.values.email) {
        formikRef.current.setFieldValue('email', emailEl.value, false);
      }
      if (pwEl?.value && !formikRef.current.values.password) {
        formikRef.current.setFieldValue('password', pwEl.value, false);
      }
    }
  }, []);

  return (
    <Formik<LoginValues>
      innerRef={formikRef}
      initialValues={{ email: '', password: '', submit: null }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
        password: Yup.string()
          .required('Password is required')
          .test('no-leading-trailing-whitespace', 'Password can not start or end with spaces', v => v === v.trim())
          .max(10, 'Password must be less than 10 characters')
      })}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        try {
          await login?.(values.email.trim(), values.password, checked);
          if (scriptedRef.current) {
            setStatus({ success: true });
            setSubmitting(false);
          }
        } catch (err: any) {
          console.error(err);
          if (scriptedRef.current) {
            setStatus({ success: false });
            setSubmitting(false);
            const message = err?.error ?? 'Something went wrong...';
            setErrors({ submit: message });
          }
        }
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit} {...others}>
          {/* email */}
          <FormControl
            fullWidth
            error={Boolean(touched.email && errors.email)}
            sx={{ ...theme.typography.customInput }}
          >
            <InputLabel htmlFor="outlined-adornment-email-login">
              Email Address
            </InputLabel>
            <OutlinedInput
              id="outlined-adornment-email-login"
              type="email"
              name="email"
              value={values.email}
              onBlur={handleBlur}
              onChange={handleChange}
              label="Email Address"
              placeholder="Add Email"
              inputProps={{ autoComplete: 'username' }}
            />
            {touched.email && errors.email && (
              <FormHelperText error id="email-helper">
                {errors.email}
              </FormHelperText>
            )}
          </FormControl>

          {/* password */}
          <FormControl
            fullWidth
            error={Boolean(touched.password && errors.password)}
            sx={{ ...theme.typography.customInput }}
          >
            <InputLabel htmlFor="outlined-adornment-password-login">
              Password
            </InputLabel>
            <OutlinedInput
              id="outlined-adornment-password-login"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={values.password}
              onBlur={handleBlur}
              onChange={handleChange}
              label="Password"
              placeholder="Add Password"
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    size="large"
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              }
              inputProps={{ autoComplete: 'new-password' }}
            />
            {touched.password && errors.password && (
              <FormHelperText error id="password-helper">
                {errors.password}
              </FormHelperText>
            )}
          </FormControl>

          {/* keep logged in / forgot‑password */}
          <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Grid>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checked}
                    onChange={e => setChecked(e.target.checked)}
                    name="checked"
                    color="primary"
                  />
                }
                label="Keep me logged in"
              />
            </Grid>
            <Grid>
              <Typography
                variant="subtitle1"
                component={Link}
                href={
                  isLoggedIn
                    ? '/pages/forgot-password/forgot-password3'
                    : authParam
                    ? `/forgot-password?auth=${authParam}`
                    : '/forgot-password'
                }
                color="secondary"
                sx={{ textDecoration: 'none' }}
              >
                Forgot Password?
              </Typography>
            </Grid>
          </Grid>

          {/* submit error */}
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.submit}
            </Alert>
          )}

          {/* sign‑in button */}
          <Box sx={{ mt: 2 }}>
            <AnimateButton>
              <Button
                color="secondary"
                disabled={isSubmitting}
                fullWidth
                size="large"
                type="submit"
                variant="contained"
              >
                Sign In
              </Button>
            </AnimateButton>
          </Box>
        </form>
      )}
    </Formik>
  );
}
