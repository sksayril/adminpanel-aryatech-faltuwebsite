import { useAuth } from '@/hooks/useAuth';
import { ArrowRightOnRectangleIcon, UserIcon } from '@heroicons/react/24/outline';

interface TopbarProps {
  isSidebarCollapsed: boolean;
}

export const Topbar = ({ isSidebarCollapsed }: TopbarProps) => {
  const { user, logout } = useAuth();

  return (
    <div
      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-b border-purple-500/30 h-16 px-6 flex items-center justify-between fixed top-0 right-0 z-30 transition-all duration-300 ease-in-out shadow-lg backdrop-blur-sm"
      style={{
        left: isSidebarCollapsed ? '5rem' : '16rem', // 20 (w-20) = 5rem, 64 (w-64) = 16rem
      }}
    >
      <div className="flex-1">
        {/* Breadcrumbs or page title can go here */}
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-white bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-sm">
          <UserIcon className="h-5 w-5" />
          <span className="font-medium">{user?.Name || 'Admin'}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-2 px-4 py-2 bg-white text-purple-600 hover:bg-pink-50 border border-white/30 rounded-lg font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

