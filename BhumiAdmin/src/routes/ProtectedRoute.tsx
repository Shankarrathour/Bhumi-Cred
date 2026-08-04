import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, useAdminStore } from '../store';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isInitializing } = useAuthStore();
  const { activeRole } = useAdminStore();
  const location = useLocation();

  // Startup JWT fetch in progress — hold here instead of redirecting to /login.
  if (isInitializing) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role is allowed
  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return <>{children}</>;
};
