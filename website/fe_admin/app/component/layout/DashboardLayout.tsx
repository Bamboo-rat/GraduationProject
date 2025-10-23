import React from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F5EDE6]">
      {/* Sidebar - Fixed Left */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="ml-64">
        {/* Header - Fixed Top */}
        <Header />

        {/* Page Content - Below Header */}
        <main className="mt-16 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
