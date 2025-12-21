import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6 bg-gradient-to-r from-white/80 to-purple-50/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-white/50">
      <Link to="/dashboard" className="hover:text-purple-600 transition-colors p-1.5 rounded-lg hover:bg-purple-100">
        <HomeIcon className="h-4 w-4 text-purple-600" />
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

        return (
          <div key={to} className="flex items-center">
            <ChevronRightIcon className="h-4 w-4 mx-2 text-purple-400" />
            {isLast ? (
              <span className="text-purple-700 font-semibold bg-purple-100 px-2 py-1 rounded-md">{displayName}</span>
            ) : (
              <Link to={to} className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

