import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-canvas text-primary font-body">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        {/* Main content area with cosmic glow */}
        <main className="flex-1 app-main p-4 md:p-8 lg:p-12 pb-24 md:pb-8 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
