import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import {
  HomeIcon,
  FilmIcon,
  FolderIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  UserGroupIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
  requiredPermissions?: string[];
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Ads Management',
    path: '/ads',
    icon: ChartBarIcon,
    requiredPermissions: ['ads:view'],
    children: [
      { name: 'Pre-Roll Ads', path: '/ads?type=pre-roll', icon: FilmIcon },
      { name: 'Mid-Roll Ads', path: '/ads?type=mid-roll', icon: FilmIcon },
      { name: 'Banner Ads (Top)', path: '/ads?type=banner-top', icon: FilmIcon },
      { name: 'Banner Ads (Bottom)', path: '/ads?type=banner-bottom', icon: FilmIcon },
      { name: 'Native Ads', path: '/ads?type=native', icon: FilmIcon },
      { name: 'Popup / Interstitial', path: '/ads?type=popup', icon: FilmIcon },
      { name: 'Create Ad', path: '/ads/create', icon: FilmIcon },
      { name: 'Ad Analytics', path: '/ads/analytics', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Movie Management',
    path: '/movies',
    icon: FilmIcon,
    requiredPermissions: ['movies:view'],
    children: [
      { name: 'All Movies', path: '/movies', icon: FilmIcon, requiredPermissions: ['movies:view'] },
      {
        name: 'Upload Queues',
        path: '/upload-queues',
        icon: FilmIcon,
        requiredPermissions: ['upload-queue:view'],
      },
      { name: 'Channels', path: '/channels', icon: FilmIcon, requiredPermissions: ['channels:view'] },
      { name: 'Actors', path: '/actors', icon: FilmIcon, requiredPermissions: ['actors:view'] },
    ],
  },
  {
    name: 'Categories',
    path: '/categories',
    icon: FolderIcon,
    requiredPermissions: ['categories:view'],
  },
  {
    name: 'Sponsor Contact',
    path: '/sponsor-contact',
    icon: PhoneIcon,
    requiredPermissions: ['contact:read'],
  },
  {
    name: 'Withdrawals',
    path: '/withdrawals',
    icon: ChartBarIcon,
    // Main admin only - no requiredPermissions means it's hidden for sub-admins
  },
  {
    name: 'Subadmin',
    path: '/subadmin',
    icon: UserGroupIcon,
    children: [
      { name: 'Roles', path: '/subadmin/roles', icon: ShieldCheckIcon },
      { name: 'Sub-Admins', path: '/subadmin/sub-admins', icon: UserGroupIcon },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

export const Sidebar = ({ isCollapsed, onToggleCollapse }: SidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const { isSubAdmin, hasAnyPermission } = useAuth();

  // Auto-expand parent menus if any child is active
  useEffect(() => {
    const activePaths: string[] = [];
    menuItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => {
          if (child.path.includes('?')) {
            const [basePath] = child.path.split('?');
            return location.pathname === basePath;
          }
          return location.pathname === child.path || location.pathname.startsWith(child.path + '/');
        });
        if (hasActiveChild) {
          activePaths.push(item.path);
        }
      }
    });
    setExpandedItems((prev) => {
      const newExpanded = [...new Set([...prev, ...activePaths])];
      return newExpanded;
    });
  }, [location.pathname]);

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string, level: number, hasChildren: boolean) => {
    if (path.includes('?')) {
      const [basePath, queryString] = path.split('?');
      const [queryParam] = queryString.split('=');
      const currentSearch = new URLSearchParams(location.search);
      
      // Check if the current path matches and query params match
      if (location.pathname === basePath) {
        if (queryParam && currentSearch.has(queryParam)) {
          const currentValue = currentSearch.get(queryParam);
          const expectedValue = queryString.split('=')[1];
          return currentValue === expectedValue;
        }
        return true;
      }
      return false;
    }
    
    // For submenu items (level > 0), exact match only
    if (level > 0) {
      return location.pathname === path;
    }
    
    // For parent items, check if path matches exactly or if any child is active
    if (hasChildren) {
      // Check if any child is active
      const menuItem = menuItems.find((item) => item.path === path);
      if (menuItem?.children) {
        const hasActiveChild = menuItem.children.some((child) => {
          if (child.path.includes('?')) {
            const [basePath] = child.path.split('?');
            return location.pathname === basePath;
          }
          return location.pathname === child.path || location.pathname.startsWith(child.path + '/');
        });
        
        // Only mark parent as active if no child is active and path matches
        if (hasActiveChild) {
          return false; // Child is active, don't highlight parent
        }
      }
      
      // Check exact match for parent
      return location.pathname === path;
    }
    
    // For items without children, check exact match or if path starts with
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Color scheme for different menu items
  const getMenuItemColor = (path: string) => {
    if (path.includes('/dashboard')) return 'from-blue-500 to-blue-600';
    if (path.includes('/ads')) return 'from-purple-500 to-purple-600';
    if (path.includes('/movies')) return 'from-pink-500 to-pink-600';
    if (path.includes('/categories') || path.includes('/subcategories') || path.includes('/subsubcategories') || path.includes('/channels')) return 'from-green-500 to-green-600';
    if (path.includes('/sponsor-contact')) return 'from-cyan-500 to-cyan-600';
    if (path.includes('/withdrawals')) return 'from-amber-500 to-amber-600';
    if (path.includes('/subadmin')) return 'from-teal-500 to-teal-600';
    return 'from-gray-500 to-gray-600';
  };

  const getMenuItemIconColor = (path: string) => {
    if (path.includes('/dashboard')) return 'text-blue-500';
    if (path.includes('/ads')) return 'text-purple-500';
    if (path.includes('/movies')) return 'text-pink-500';
    if (path.includes('/categories') || path.includes('/subcategories') || path.includes('/subsubcategories') || path.includes('/channels')) return 'text-green-500';
    if (path.includes('/sponsor-contact')) return 'text-cyan-500';
    if (path.includes('/withdrawals')) return 'text-amber-500';
    if (path.includes('/subadmin')) return 'text-teal-500';
    return 'text-gray-500';
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    // Hide Subadmin section for sub-admin users
    if (isSubAdmin && item.path.startsWith('/subadmin')) {
      return null;
    }

    // Hide Withdrawals for sub-admin users (main admin only)
    if (isSubAdmin && item.path.startsWith('/withdrawals')) {
      return null;
    }

    // Permission-based visibility
    if (isSubAdmin && item.requiredPermissions && !hasAnyPermission(item.requiredPermissions)) {
      return null;
    }

    const hasChildren = !!(item.children && item.children.length > 0);
    const isExpanded = expandedItems.includes(item.path);
    const active = isActive(item.path, level, hasChildren);
    const iconColor = getMenuItemIconColor(item.path);

    return (
      <div key={item.path}>
        <div
          className={clsx(
            'flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group',
            {
              'bg-gradient-to-r shadow-lg shadow-primary-500/20 text-white': active && level === 0,
              [getMenuItemColor(item.path)]: active && level === 0,
              'text-gray-200 hover:bg-gray-700/50 hover:text-white hover:shadow-md': !active && level === 0,
              'ml-4': level > 0,
              'bg-gradient-to-r from-blue-500/40 to-blue-600/40 text-blue-100 border-l-4 border-blue-400 shadow-lg shadow-blue-500/20': active && level > 0,
              'text-gray-300 hover:bg-gray-700/40 hover:text-white': !active && level > 0,
            }
          )}
        >
          <Link
            to={item.path}
            className="flex items-center flex-1"
            onClick={(e) => {
              if (hasChildren && level === 0) {
                e.preventDefault();
                toggleExpand(item.path);
              }
            }}
          >
            <item.icon
              className={clsx('h-5 w-5 mr-3 transition-all duration-200', {
                [iconColor]: !active && level === 0,
                'text-white': active && level === 0,
                'text-blue-100': active && level > 0,
                'text-gray-300': !active && level > 0,
                'group-hover:scale-110 group-hover:text-white': !active && level > 0,
              })}
            />
            {!isCollapsed && (
              <span
                className={clsx('text-sm font-medium transition-all', {
                  'font-semibold text-white': active && level === 0,
                  'text-gray-200': !active && level === 0,
                  'font-semibold text-blue-100': active && level > 0,
                  'text-gray-300 group-hover:text-white': !active && level > 0,
                })}
              >
                {item.name}
              </span>
            )}
          </Link>
          {hasChildren && !isCollapsed && (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleExpand(item.path);
              }}
              className={clsx('ml-2 transition-all', {
                'text-white': active && level === 0,
                'text-gray-400 group-hover:text-gray-200': !active && level === 0,
                'text-gray-400': !active && level > 0,
              })}
            >
              <svg
                className={clsx('h-4 w-4 transition-transform duration-200', {
                  'rotate-180': isExpanded,
                })}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-600/50 pl-2">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={clsx(
        'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700/50 h-screen fixed left-0 top-0 transition-all duration-300 ease-in-out z-40 shadow-2xl',
        {
          'w-64': !isCollapsed,
          'w-20': isCollapsed,
        }
      )}
    >
      {/* Header with gradient */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-blue-600 to-purple-600">
        {!isCollapsed && (
          <h2 className="text-xl font-bold text-white drop-shadow-lg">Admin Panel</h2>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AP</span>
          </div>
        )}
        <button
          onClick={() => onToggleCollapse(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-white/20 transition-all duration-200 text-white hover:scale-110"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <Bars3Icon className="h-6 w-6" />
          ) : (
            <XMarkIcon className="h-6 w-6" />
          )}
        </button>
      </div>
      
      {/* Navigation with scroll */}
      <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-80px)] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
      
      {/* Decorative bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
    </div>
  );
};

