// material-ui
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useFormik } from 'formik';
import * as yup from 'yup';
import SubCard from 'ui-component/cards/SubCard';
import AnimateButton from 'ui-component/extended/AnimateButton';
import { gridSpacing } from 'store/constant';
import { useState } from 'react';
import { UpdatePasswordPayload } from '@/types/payloads';
import updateUserPassword from '@/app/actions/updateUserPassword';
import { Alert, Tooltip } from '@mui/material';



const validationSchema = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
    confirm_password: yup
    .string()
    .required('Confirm Password is required')
    .min(6, 'Confirmed Password must be at least 6 characters')
    .oneOf([yup.ref('password')], 'Passwords must match')
});


export default function ChangePasswordTab() {

    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);



    const formik = useFormik({
        initialValues: {
          password: '',
          confirm_password: '',
        },
        validationSchema,
        onSubmit: async (values) => {
          setFormError(null);
          setFormSuccess(null);
          try {
    
            const payload: UpdatePasswordPayload = {'password': values.password}
            await updateUserPassword(payload);
            setFormSuccess("Successfully Changed Password")
    
          
            console.log("clicked change password");
    
          } catch (error: any) {
            if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
            // console.error('Error changing password:', error);
            setFormError('Could not change password. Please try again later.');
          } 
    
        }
      });


    return (  
        
        <>
            {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {formError}
                </Alert>
            )}
        
        
            {formSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {formSuccess}
                </Alert>
            )}
            <Grid container spacing={gridSpacing} justifyContent='center'>
                <Grid size={{ sm: 6, md: 8 }}>
                    <Grid container spacing={gridSpacing}  justifyContent='center'>
                        <form onSubmit={formik.handleSubmit} noValidate>
                            <Grid size={12}>
                                <SubCard title="Change Password" sx={{ maxWidth: '700px', margin: '0 auto' }} >
                                    <Grid container spacing={gridSpacing}>
                                        <Grid size={6}>
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
                                        <Grid size={6}>
                                            <TextField
                                                fullWidth
                                                type="password"
                                                label="Confirm Password"
                                                name="confirm_password"
                                                value={formik.values.confirm_password}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                error={formik.touched.confirm_password && Boolean(formik.errors.confirm_password)}
                                                helperText={formik.touched.confirm_password && formik.errors.confirm_password}
                                                autoComplete="new-password"
                                            />
                                        </Grid>
                                        <Grid size={12}>
                                        <Stack direction="row" justifyContent='center'>
                                            <AnimateButton>
                                                <Tooltip title={!formik.isValid || !formik.dirty || formik.isSubmitting ? 'Choose a valid password' : ''}>
                                                    <span>
                                                        <Button
                                                            variant="contained"
                                                            type="submit"
                                                            disabled={!formik.isValid || !formik.dirty || formik.isSubmitting}>
                                                            Change Password
                                                        </Button>
                                                    </span>
                                                </Tooltip>  
                                            </AnimateButton>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </SubCard>
                            </Grid>
                        </form>
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
}
