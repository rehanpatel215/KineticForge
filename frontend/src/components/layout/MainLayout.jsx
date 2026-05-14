import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-void text-primary font-body selection:bg-accent-glow/30 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Background Patterns */}
        <div className="absolute inset-0 bg-[var(--background-image-dot-grid)] bg-[length:var(--background-size-dot-grid)] pointer-events-none opacity-40" />
        
        <TopBar />
        
        <main className="flex-1 app-main p-4 md:p-8 lg:p-10 pb-24 md:pb-8 overflow-y-auto relative z-1">
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}

