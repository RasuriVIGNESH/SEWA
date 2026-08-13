import { Bell, CheckCircle, Clock, Info, ShieldAlert, X } from 'lucide-react';
import { useAlertStore } from '../store';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../lib/formatters';

export default function Alerts() {
  const alerts = useAlertStore(state => state.alerts);
  const markRead = useAlertStore(state => state.markRead);
  const markAllRead = useAlertStore(state => state.markAllRead);

  // Filter for unread alerts to show at the top
  const unreadAlerts = alerts.filter(alert => !alert.read);
  const readAlerts = alerts.filter(alert => alert.read);

  return (
    <div className="min-h-screen bg-white p-6 lg:p-10 font-sans max-w-[1600px] mx-auto">
      <div className="max-w-7xl mx-auto">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
          {/* <div>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <ShieldAlert size={18} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Critical Notifications</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Alerts Hub</h1>
            <p className="text-slate-400 font-medium mt-1">Real-time sepsis warnings and system messages.</p>
          </div> */}

          {alerts.length > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 px-6 py-3 rounded-2xl font-bold text-sm transition-colors shadow-sm"
            >
              <CheckCircle size={18} /> Acknowledge All ({unreadAlerts.length})
            </button>
          )}
        </div>

        {/* ALERTS LIST */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
          {alerts.length === 0 ? (
            // Empty State
            <div className="h-[400px] flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-100 m-8">
              <Bell className="w-16 h-16 text-slate-200 mb-4" />
              <h3 className="text-xl font-bold text-slate-800">No Active Alerts</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-sm">
                The system is currently stable. All vital signs are within normal parameters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {/* Unread Alerts Section */}
              {unreadAlerts.length > 0 && (
                <div className="p-8">
                  <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Info size={14} className="animate-pulse" /> Urgent Attention Required ({unreadAlerts.length})
                  </h3>
                  <div className="space-y-6">
                    {unreadAlerts.map(alert => (
                      <AlertItem key={alert.id} alert={alert} markRead={markRead} isRead={false} />
                    ))}
                  </div>
                </div>
              )}

              {/* Read Alerts Section */}
              {readAlerts.length > 0 && (
                <div className="p-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CheckCircle size={14} /> Acknowledged History ({readAlerts.length})
                  </h3>
                  <div className="space-y-6">
                    {readAlerts.map(alert => (
                      <AlertItem key={alert.id} alert={alert} markRead={markRead} isRead={true} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Component for individual alert item
function AlertItem({ alert, markRead, isRead }) {
  return (
    <div className={`p-6 rounded-2xl border transition-all flex items-start gap-6 ${isRead
      ? 'bg-slate-50 border-slate-100 opacity-70'
      : 'bg-red-50 border-red-100 shadow-lg shadow-red-50/30'
      }`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isRead ? 'bg-slate-100 text-slate-400' : 'bg-red-600 text-white animate-pulse'
        }`}>
        <ShieldAlert size={24} />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`font-black text-base ${isRead ? 'text-slate-500' : 'text-red-700'}`}>
            BED {alert.bedNumber}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isRead ? 'bg-slate-100 text-slate-400' : 'bg-red-100 text-red-600'}`}>
            {alert.riskScore}% Risk
          </span>
        </div>
        <h4 className={`text-lg font-bold mb-2 ${isRead ? 'text-slate-700' : 'text-slate-900'}`}>
          {alert.message}
        </h4>
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
          <Link to={`/patients/${alert.patientId}`} className="flex items-center gap-1 text-blue-600 hover:underline">
            View Patient Chart <ChevronRight size={14} />
          </Link>
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">
            <Clock size={12} /> {formatRelativeTime(alert.timestamp)}
          </span>
        </div>
      </div>

      {!isRead && (
        <button
          onClick={() => markRead(alert.id)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-blue-100 hover:text-blue-600 transition-all"
        >
          <CheckCircle size={16} /> Acknowledge
        </button>
      )}
    </div>
  );
}