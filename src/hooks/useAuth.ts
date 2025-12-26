import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { STORAGE_KEYS } from '@/utils/constants';

export const useAuth = () => {
  const navigate = useNavigate();
  const { token, user, isAuthenticated, setAuth, logout } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from localStorage
    const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setAuth(storedToken, parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        logout();
      }
    }
  }, [setAuth, logout]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isSubAdmin = !!user?.IsSubAdmin;
  const permissions = user?.Permissions || [];

  const hasPermission = (permission: string) => {
    // Super admin: full access
    if (!isSubAdmin) return true;
    if (!permission) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (required: string[] | undefined) => {
    if (!required || required.length === 0) return true;
    return required.some((perm) => hasPermission(perm));
  };

  return {
    token,
    user,
    isAuthenticated,
    isSubAdmin,
    permissions,
    hasPermission,
    hasAnyPermission,
    logout: handleLogout,
  };
};

