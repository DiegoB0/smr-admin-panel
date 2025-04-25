import React from 'react';
import { Outlet } from 'react-router-dom';
import SideBar from '../components/SideBar'


const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen items-stretch">
      {/* Sidebar */}

      <div className="w-[300px] bg-gray-100 sticky top-0 h-screen">
        <SideBar />
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* This is where the pages will be rendered */}
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;

