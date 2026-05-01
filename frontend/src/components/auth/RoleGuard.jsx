import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RoleGuard({ children, allowedRoles }) {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void text-secondary font-body">
        <div className="animate-pulse text-glow">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return children ? children : <Outlet />;
}
