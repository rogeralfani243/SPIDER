import React from 'react';
import { FaYoutube, FaInstagram, FaTiktok, FaLink } from 'react-icons/fa';

const PlatformLink = ({ url }) => {
  if (!url) return null;
  
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    let icon = <FaLink color="#007bff" />;
    let platformName = hostname;

    if (hostname.includes('youtube')) {
      icon = <FaYoutube color="red" />;
      platformName = 'YouTube';
    } else if (hostname.includes('instagram')) {
      icon = <FaInstagram color="#E4405F" />;
      platformName = 'Instagram';
    } else if (hostname.includes('tiktok')) {
      icon = <FaTiktok color="black" />;
      platformName = 'TikTok';
    }

    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="platform-link">
        {icon}
        <span>{platformName}</span>
      </a>
    );
  } catch (error) {
    return null;
  }
};

export default PlatformLink;