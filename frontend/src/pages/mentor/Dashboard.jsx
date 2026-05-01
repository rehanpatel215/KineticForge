import React from 'react';
import { useAuth } from '../../components/auth/AuthContext';
import TickerStrip from './dashboard/TickerStrip';
import TodaySessionCard from './dashboard/TodaySessionCard';
import TodayAttendanceCard from './dashboard/TodayAttendanceCard';
import ProgramOverviewCard from './dashboard/ProgramOverviewCard';
import RecentActivityCard from './dashboard/RecentActivityCard';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <div>
        <h1 className="text-display-hero text-primary font-display mb-2">
          Welcome Back, {user?.display_name?.split(' ')[0] || 'Mentor'}
        </h1>
        <p className="text-body-lg text-secondary">
          Here's what's happening with the Forge AI-ML Bootcamp today.
        </p>
      </div>

      {/* Ticker Strip */}
      <TickerStrip />

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Row 1: Today's Focus (takes up 2 columns each on large screens, or 1 each on XL) */}
        <div className="xl:col-span-2">
          <TodaySessionCard />
        </div>
        <div className="xl:col-span-2">
          <TodayAttendanceCard />
        </div>

        {/* Row 2: Analytics & Activity */}
        <div className="xl:col-span-2">
          <ProgramOverviewCard />
        </div>
        <div className="xl:col-span-2">
          <RecentActivityCard />
        </div>
        
      </div>
    </div>
  );
}
