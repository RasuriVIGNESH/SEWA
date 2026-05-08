import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bell,
  LogOut,
  HeartPulse,
  UserCircle,
  Activity
} from 'lucide-react';
import { useAuthStore } from '../store';

export function Sidebar() {
  const location = useLocation();
  const { doctorName, doctorId, logout } = useAuthStore();

  // Navigation Items
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
      label: 'My Profile', // Replaced "Doctors"
      icon: UserCircle,
      route: `/doctors/${doctorId}` // Points to the specific doctor's ID
    }
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-100 flex flex-col h-screen font-sans sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">

      {/* BRANDING SECTION */}
      <div className="h-24 flex items-center px-8 border-b border-slate-50">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100 group-hover:scale-105 transition-transform">
            <HeartPulse className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">SEWA</h1>
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">Clinical OS</p>
          </div>
        </Link>
      </div>

      {/* NAVIGATION SECTION */}
      <nav className="flex-1 py-10 px-4 space-y-2">
        {/* <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p> */}

        {navItems.map(item => {
          const isActive = location.pathname === item.route;
          const Icon = item.icon;

          return (
            <Link
              key={item.route}
              to={item.route}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm group ${isActive
                ? "bg-blue-600 text-white shadow-xl shadow-blue-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <Icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"} />
              {item.label}
              {item.label === 'Alerts Hub' && (
                <span className={`ml-auto w-2 h-2 rounded-full bg-red-500 ${isActive ? 'ring-4 ring-white/20' : 'animate-pulse'}`}></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* USER & LOGOUT SECTION */}
      <div className="p-6 border-t border-slate-50 bg-slate-50/30">
        <div className="bg-white border border-slate-100 rounded-[2rem] p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-lg font-black">
              {doctorName?.charAt(0) || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 truncate">Dr. {doctorName || 'Clinician'}</p>
              <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
                <div className="w-1 h-1 rounded-full bg-emerald-500"></div> Active Session
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-3 bg-white hover:bg-red-50 border border-slate-100 rounded-xl text-slate-400 hover:text-red-600 transition-all text-xs font-black uppercase tracking-widest"
          >
            <LogOut size={16} />
            End Shift
          </button>
        </div>

        <p className="text-[9px] text-center text-slate-300 font-bold mt-6 uppercase tracking-tighter">
          Institutional Security: v1.0.4
        </p>
      </div>
    </aside>
  );
}