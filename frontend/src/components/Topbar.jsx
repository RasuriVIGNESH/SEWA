import { Bell, Search, Calendar, Clock } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAlertStore, useAuthStore } from '../store';
import { useEffect, useState } from 'react';

export function Topbar() {
  const location = useLocation();
  const { doctorName } = useAuthStore();
  const unreadCount = useAlertStore(state => state.unreadCount);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Clinical Dashboard';
    if (path.startsWith('/patients')) return 'Patient Directory';
    if (path.startsWith('/doctors')) return 'My Profile';
    if (path.startsWith('/alerts')) return 'Alert Center';
    if (path.startsWith('/mypatient')) return 'Patient Details';
    return 'Medical System';
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 z-30 w-full shadow-sm">

      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="h-8 w-1 bg-blue-600 rounded-full hidden md:block"></div>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase text-[13px] tracking-[0.05em]">
            {getPageTitle()}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="text-blue-600">SEWA Central</span>
            <span>/</span>
            <span>Terminal 01</span>
          </div>
        </div>
      </div>

      {/* System Status & Actions */}
      <div className="flex items-center gap-8">

        {/* Live Date/Time */}
        <div className="hidden lg:flex items-center gap-6 border-r border-slate-200 pr-8">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-300" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
              {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-300" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter font-mono">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
          </div>
        </div>

        {/* Alerts Notification Button */}
        <Link
          to="/alerts"
          className="relative p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all group"
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
