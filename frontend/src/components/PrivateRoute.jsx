import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Sidebar } from './Sidebar'; // This works now because we fixed the export
import { Topbar } from './Topbar';

export default function PrivateRoute() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    // Clean Hospital White Background for the whole frame
    <div className="flex h-screen w-full bg-slate-50/30 overflow-hidden font-sans">

      {/* 1. Sidebar - Fixed width, stays on the left */}
      <Sidebar />

      {/* 2. Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Topbar - Fixed at the top */}
        <Topbar />

        {/* Main Content View - This is where your Dashboard/Patients/etc appear */}
        <main className="flex-1 overflow-auto bg-white/50 relative">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}