import React from 'react';
import DashboardMain from '../dashboard_main';
import UserProfileBar from '../profile/UserProfilBar';
import { CircularProgress } from '@mui/material';
const AppLayout = {
  LoadingScreen: () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    }}>
      <div style={{ textAlign: 'center' }}>
     <CircularProgress color="error"/> 
      </div>
    </div>
  ),

  MainLayout: ({ children, onLogout }) => (
    <div>
      <div className='profile-dashboard'>
        <DashboardMain className='dashboard-main' onLogout={onLogout} />
      </div>
      <main>
        <UserProfileBar />
        {children}
      </main>
    </div>
  )
};

export default AppLayout;