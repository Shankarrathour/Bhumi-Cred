import React, { createContext, useContext, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Role } from '../store/slices/authSlice';

interface AuthContextType {
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: (Role | string)[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeRole = (r: string) =>
  String(r || '').toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ').trim();

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const user = useSelector((state: RootState) => state.auth.user);

  const hasPermission = (permission: string) => {
    if (!user) return false;
    const normUserRole = normalizeRole(user.role);
    if (normUserRole === 'super admin' || (user.permissions && user.permissions.includes('*'))) return true;
    return user.permissions ? user.permissions.includes(permission) : false;
  };

  const hasRole = (roles: (Role | string)[]) => {
    if (!user) return false;
    const normUserRole = normalizeRole(user.role);
    if (normUserRole === 'super admin') return true; // Super Admin has unrestricted access to all modules

    return roles.some(r => normalizeRole(r) === normUserRole);
  };

  return (
    <AuthContext.Provider value={{ hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface PermissionGuardProps {
  permission?: string;
  roles?: (Role | string)[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  roles, 
  children, 
  fallback = null 
}) => {
  const { hasPermission, hasRole } = useAuth();
  
  let isAllowed = true;

  if (permission && !hasPermission(permission)) {
    isAllowed = false;
  }

  if (roles && roles.length > 0 && !hasRole(roles)) {
    isAllowed = false;
  }

  return <>{isAllowed ? children : fallback}</>;
};
