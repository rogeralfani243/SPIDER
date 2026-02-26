
import React from 'react';
import {
  SpeedDial, SpeedDialAction, SpeedDialIcon
} from '@mui/material';
import {
  Download as DownloadIcon,
  Add as AddIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

const SpeedDialActions = () => {
  const actions = [
    { icon: <DownloadIcon />, name: 'Export Data' },
    { icon: <AddIcon />, name: 'Add New' },
    { icon: <FilterIcon />, name: 'Filters' },
  ];

  const handleAction = (name) => {
    // Implémenter les actions ici
    console.log(`${name} clicked`);
  };

  return (
    <SpeedDial
      ariaLabel="Admin Actions"
      sx={{ position: 'fixed', bottom: 16, right: 16 }}
      icon={<SpeedDialIcon />}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={() => handleAction(action.name)}
        />
      ))}
    </SpeedDial>
  );
};

export default SpeedDialActions;