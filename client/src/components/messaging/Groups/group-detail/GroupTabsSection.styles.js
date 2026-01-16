// src/components/groups/GroupTabsSection.styles.js
import { useTheme } from '@mui/material/styles';
const primaryGradient = 'linear-gradient(135deg, rgb(10, 10, 10), rgb(60, 10, 10), rgb(180, 20, 20), rgb(255, 0, 80))';
const colorText ='#a80e0eff';
const colorIcon ='#610c0cff';
const useGroupTabsStyles = () => {
  const theme = useTheme();

  return {
    card: {
      mb: 3,
      borderRadius: 2
    },
    tabs: {
      borderBottom: 1,
      borderColor: 'divider'
    },
    tabLabel: {
      display: 'flex',
      alignItems: 'center'
    },
    tabIcon: {
      mr: 1,
      fontSize: 20
    },
    badge: {
      ml: 1
    },
    cardContent: {
      minHeight: 300
    },
    infoPaper: {
      color:colorText,
      p: 2,
      borderRadius: 2
    },
    infoHeader: {
      display: 'flex',
      alignItems: 'center',
      mb: 1
    },
    infoIcon: {
         color:colorIcon,
      mr: 1,
   
    },
    categoryDescription: {
      mt: 1
    },
    availableSpots: {
      ml: 1
    },
    groupTypeDescription: {
      mt: 1
    },
    reviewsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 3
    },
    feedbackPaper: {
      p: 2,
      borderRadius: 2
    },
    feedbackHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      mb: 1
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center'
    },
    avatar: {
      mr: 2,
      width: 40,
      height: 40,
      cursor :'pointer'
    },
    feedbackComment: {
      mt: 1
    },
    viewAllContainer: {
      textAlign: 'center',
      mt: 2
    },
    noReviewsContainer: {
      textAlign: 'center',
      py: 8
    },
    noReviewsIcon: {
      fontSize: 60,
      color: 'text.disabled',
      mb: 2
    },
    writeReviewButton: {
      mt: 2
    },
    memberRequiredText: {
      mt: 1
    },
    rulesPaper: {
      p: 3,
      borderRadius: 2,
      whiteSpace: 'pre-line'
    }
  };
};

export default useGroupTabsStyles;