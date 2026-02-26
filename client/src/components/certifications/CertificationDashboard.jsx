// components/CertificationDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Grid,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { certificationService } from '../services/certificationService';
import PremiumTab from './tabs/PremiumTab';
import InfluencerTab from './tabs/InfluencerTab';
import VerificationTab from './tabs/verificationTab';
import FireTab from './tabs/FireTab';
import Sidebar from './tabs/Sidebar';
import '../../styles/certification-dashboard.css';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedIcon from '@mui/icons-material/Verified';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CreditCardIcon from '@mui/icons-material/CreditCard';
// Ajoutez cette ligne avec les autres imports
import SubscriptionManagement from './tabs/SubscriptionManagement';
// Styled Components
const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3,
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    marginRight: theme.spacing(2),
    '&.Mui-selected': {
      color: theme.palette.primary.main,
    },
  },
}));

const CertificationDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [userStats, setUserStats] = useState(null);
  const [fireEligibility, setFireEligibility] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const tabs = [
  {
    id: 'premium',
    label: 'Premium',
    icon: EmojiEventsIcon,
    color: '#FFD700',
  },
  {
    id: 'influencer',
    label: 'Influencer',
    icon: TrendingUpIcon,
    color: '#9C27B0',
  },
  {
    id: 'verified',
    label: 'Verified',
    icon: VerifiedIcon,
    color: '#2196F3',
  },
  {
    id: 'fire',
    label: 'Fire',
    icon: WhatshotIcon,
    color: '#FF5722',
  },
 /* {
    id: 'subscription',
    label: 'Subscription',
    icon: CreditCardIcon,
    color: '#4CAF50',
 }, */
];

  // Fetch data
  const fetchUserStats = async () => {
    try {
      const response = await certificationService.getUserStats();
      setUserStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const response = await certificationService.getVerificationStatus();
      setVerificationStatus(response.data);
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  // Update verification status
  const updateVerificationStatus = (status) => {
    setVerificationStatus(status);
  };

  // Update fire eligibility
  const updateFireEligibility = (data) => {
    setFireEligibility(data);
  };

  // Handle messages
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  useEffect(() => {
    fetchUserStats();
    checkVerificationStatus();
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <PremiumTab
            loading={loading}
            setLoading={setLoading}
            showMessage={showMessage}
          />
        );
      case 1:
        return (
          <InfluencerTab
            userStats={userStats}
            loading={loading}
            setLoading={setLoading}
            showMessage={showMessage}
          />
        );
      case 2:
        return (
          <VerificationTab
            verificationStatus={verificationStatus}
            loading={loading}
            setLoading={setLoading}
            showMessage={showMessage}
            updateVerificationStatus={updateVerificationStatus}
          />
        );
      case 3:
        return (
          <FireTab
            fireEligibility={fireEligibility}
            loading={loading}
            setLoading={setLoading}
            showMessage={showMessage}
            updateFireEligibility={updateFireEligibility}
          />
        );
         case 4: // Nouveau cas pour l'onglet Subscription
      return (
        <SubscriptionManagement />
      );
      default:
        return null;
    }
  };

  return (
    <Box className="certification-dashboard">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Certification Center
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Obtain and manage certifications to unlock new features
          </Typography>
        </Box>

        {/* Message Alert */}
        {message.text && (
          <Alert 
            severity={message.type || 'info'} 
            sx={{ mb: 4 }}
            onClose={() => setMessage({ type: '', text: '' })}
          >
            {message.text}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}>
          <StyledTabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            {tabs.map((tab, index) => (
             <Tab
  key={tab.id}
  icon={
    <tab.icon
      sx={{
        fontSize: '1.2rem',
        color: activeTab === index ? tab.color : 'inherit',
      }}
    />
  }
  label={tab.label}
  sx={{
    color: activeTab === index ? tab.color : 'inherit',
    minHeight: 48,
  }}
/>

            ))}
          </StyledTabs>
        </Box>

        {/* Main Content */}
        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            {renderTabContent()}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Sidebar
              verificationStatus={verificationStatus}
              fireEligibility={fireEligibility}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CertificationDashboard;