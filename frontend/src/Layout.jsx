import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SideBar from './components/SideBar';

export default function Layout() {
  const location = useLocation();

  // Standalone full pages without shell sidebar (e.g. Auth screen or Landing if desired)
  const isAuthPage = location.pathname === '/auth';

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden p-3 md:p-6 gap-3 md:gap-6 bg-background text-foreground flex flex-col md:flex-row transition-colors duration-300">
      {/* Floating Sidebar */}
      <SideBar />

      {/* Main App Content Canvas */}
      <div className="flex-1 flex flex-col h-full min-h-0 gap-3 md:gap-6 overflow-hidden">
        <main className="flex-1 overflow-y-auto pr-0.5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}