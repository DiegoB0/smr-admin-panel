import React from 'react';
import { Outlet } from 'react-router-dom';
import SideBar from '../components/SideBar'


const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <SideBar />

      {/* Main content */}
      <div className="flex-1 p-4">
        {/* This is where the pages will be rendered */}
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;

