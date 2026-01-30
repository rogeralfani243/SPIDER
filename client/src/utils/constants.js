import React from 'react';
import {
  Language as LanguageIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  YouTube as YouTubeIcon,
  Link as LinkIcon,
} from '@mui/icons-material';

export const PLATFORM_OPTIONS = [
  { value: 'website', label: 'Website', icon: <LanguageIcon /> },
  { value: 'github', label: 'GitHub', icon: <GitHubIcon /> },
  { value: 'linkedin', label: 'LinkedIn', icon: <LinkedInIcon /> },
  { value: 'twitter', label: 'Twitter', icon: <TwitterIcon /> },
  { value: 'instagram', label: 'Instagram', icon: <InstagramIcon /> },
  { value: 'facebook', label: 'Facebook', icon: <FacebookIcon /> },
  { value: 'youtube', label: 'YouTube', icon: <YouTubeIcon /> },
  { value: 'other', label: 'Other', icon: <LinkIcon /> }
];

export const getPlatformIcon = (platform) => {
  const option = PLATFORM_OPTIONS.find(opt => opt.value === platform);
  return option ? option.icon : <LinkIcon />;
};

export const getPlatformLabel = (platform) => {
  const option = PLATFORM_OPTIONS.find(opt => opt.value === platform);
  return option ? option.label : platform;
};

export const parseSocialLinks = (socialLinksData) => {
  if (!socialLinksData) return [];
  
  if (Array.isArray(socialLinksData)) {
    return socialLinksData;
  }
  
  if (typeof socialLinksData === 'string') {
    try {
      const parsed = JSON.parse(socialLinksData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to parse social_links JSON:', error);
      return [];
    }
  }
  
  return [];
};

export const STEPS = ['Personal Info', 'Social Links', 'Professional Details', 'Location', 'Review'];