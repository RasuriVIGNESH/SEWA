import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bell,
  LogOut,
  HeartPulse,
  UserCircle,
} from 'lucide-react';
import { useAuthStore } from '../store';

export function Sidebar() {
  const location = useLocation();
  const { doctorName, doctorId, logout } = useAuthStore();

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      route: '/dashboard'
    },
    {
      label: 'Patient Directory',
      icon: Users,
      route: '/patients'
    },
    {
      label: 'Alerts Hub',
      icon: Bell,
      route: '/alerts'
    },
    {
      label: 'My Profile',
      icon: UserCircle,
      route: `/doctors/${doctorId}`
    }
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen font-sans sticky top-0 shadow-sm">

      {/* BRANDING SECTION */}
      <div className="h-24 flex items-center px-8 border-b border-slate-100">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="bg-blue-600 p-2.5 rounded-lg shadow-md shadow-blue-200 group-hover:scale-105 transition-transform">
            <HeartPulse className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">SEWA</h1>
            <p className="text-[8px] font-black text-blue-600 uppercase tracking-[0.15em] mt-1">Clinical OS</p>
          </div>
        </Link>
      </div>

      {/* NAVIGATION SECTION */}
      <nav className="flex-1 py-8 px-4 space-y-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.route || location.pathname.startsWith(item.route + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.route}
              to={item.route}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all font-bold text-sm group ${isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <Icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"} />
              {item.label}
              {item.label === 'Alerts Hub' && (
                <span className={`ml-auto w-2.5 h-2.5 rounded-full ${isActive ? 'bg-white/30 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* USER & LOGOUT SECTION */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/30">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 text-lg font-black">
              {doctorName?.charAt(0) || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 truncate">Dr. {doctorName || 'Clinician'}</p>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-lg text-slate-500 hover:text-red-600 transition-all text-xs font-black uppercase tracking-widest"
          >
            <LogOut size={16} />
            End Shift
          </button>
        </div>

        <p className="text-[8px] text-center text-slate-300 font-bold mt-6 uppercase tracking-tighter">
          Security v1.0.4
        </p>
      </div>
    </aside>
  );
}
