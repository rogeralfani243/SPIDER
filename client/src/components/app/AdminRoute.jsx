import React from 'react';
import PrivateRoute from './PrivateRoute.jsx';

const AdminRoute = ({ children }) => {
  return (
    <PrivateRoute requireAdmin={true}>
      {children}
    </PrivateRoute>
  );
};

export default AdminRoute;