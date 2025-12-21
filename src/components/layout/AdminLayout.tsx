import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Breadcrumbs } from './Breadcrumbs';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={setIsSidebarCollapsed} />
      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isSidebarCollapsed ? '5rem' : '16rem', // 20 (w-20) = 5rem, 64 (w-64) = 16rem
        }}
      >
        <Topbar isSidebarCollapsed={isSidebarCollapsed} />
        <main className="p-6 mt-16 min-h-[calc(100vh-4rem)]">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
};

