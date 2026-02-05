import {
  Alert,
  AlertTitle,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import usePWAInstall from '../../utils/useInstall';

const PWAInstallBanner = () => {
  const {
    showBanner,
    installApp,
    isIOS,
    hasPrompt,
    closeBanner,
  } = usePWAInstall();

  if (!showBanner) return null;

  const handleInstallClick = async () => {
    if (!isIOS && hasPrompt) {
      await installApp(); // 🚀 prompt natif direct
      closeBanner();
    }
  };

  return (
    <Alert
      severity="info"
      icon={<PhoneIphoneIcon />}
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 1300,
        borderRadius: 3,
        boxShadow: 4,
      }}
      action={
        <Stack direction="row" spacing={1}>
          {hasPrompt && (
            <Button
              color="inherit"
              size="small"
              onClick={handleInstallClick}
            >
              Install
            </Button>
          )}

          {isIOS && (
            <Typography variant="caption">
              Use Share → Add to Home Screen
            </Typography>
          )}

          <Button
            color="inherit"
            size="small"
            onClick={closeBanner}
          >
            Later
          </Button>
        </Stack>
      }
    >
      <AlertTitle>Install the app</AlertTitle>
      Get faster access and a better experience.
    </Alert>
  );
};

export default PWAInstallBanner;
