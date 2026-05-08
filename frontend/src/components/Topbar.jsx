import { Bell, Search, Calendar, Clock } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAlertStore, useAuthStore } from '../store';
import { useEffect, useState } from 'react';

export function Topbar() {
  const location = useLocation();
  const { doctorName } = useAuthStore();
  const unreadCount = useAlertStore(state => state.unreadCount);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live Clock for the medical dashboard
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Clinical Dashboard';
    if (path.startsWith('/patients')) return 'Patient Directory';
    if (path.startsWith('/doctors')) return 'My Profile'; // Updated to match Sidebar
    if (path.startsWith('/alerts')) return 'Alert Center';
    return 'Medical System';
  };

  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0 z-30 w-full">

      {/* 1. Page Title & Breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="h-8 w-1 bg-blue-600 rounded-full hidden md:block"></div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase text-[13px] tracking-[0.1em]">
            {getPageTitle()}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="text-blue-600">SEWA Central</span>
            <span>/</span>
            <span>Terminal 04</span>
          </div>
        </div>
      </div>

      {/* 2. System Status & Actions */}
      <div className="flex items-center gap-8">

        {/* Live Date/Time (Essential for Clinical Apps) */}
        <div className="hidden lg:flex items-center gap-6 border-r border-slate-100 pr-8">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-300" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
              {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>



        {/* Alerts Notification Button */}
        <Link
          to="/alerts"
          className="relative p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group"
        >
          <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />

          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border-2 border-white"></span>
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}