import React from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { STEPS } from '../../utils/constants';

const ProfileStepper = ({ activeStep }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Stepper 
      activeStep={activeStep} 
      sx={{ 
        mb: 4,
        '& .MuiStep-root': {
          padding: { xs: '8px 4px', sm: '16px' }
        },
        '& .MuiStepLabel-root': {
          flexDirection: { xs: 'column', sm: 'row' }
        },
        '& .MuiStepLabel-label': {
          mt: { xs: 1, sm: 0 },
          fontSize: { xs: '0.7rem', sm: '0.875rem' },
          textAlign: 'center'
        }
      }}
    >
      {STEPS.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export default ProfileStepper;