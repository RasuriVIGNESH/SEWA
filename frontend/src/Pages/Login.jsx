import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  HeartPulse,
  Lock,
  Mail,
  Loader2,
  ArrowLeft,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api';
import { useAuthStore } from '../store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const loginFn = useAuthStore(state => state.login);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/auth/login', {
        email,
        password
      });
      return data;
    },
    onSuccess: data => {
      loginFn(data.token, data.name, data.doctorId);
      navigate('/dashboard');
    }
  });

  const handleSubmit = e => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">

      {/* Left Side: Professional Medical Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 z-10 bg-blue-900/30 mix-blend-multiply"></div>
        <img
          src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1500"
          alt="Modern Hospital Setting"
          className="absolute inset-0 object-cover w-full h-full"
        />

        {/* Content on Image */}
        <div className="relative z-20 flex flex-col justify-between p-12 text-white w-full">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
              <HeartPulse className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">SEWA</span>
          </Link>

          <div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl max-w-md">
              <Activity className="w-12 h-12 mb-4 text-blue-400" />
              <h2 className="text-3xl font-bold mb-4 leading-tight">Secure Access to Live Patient Data</h2>
              <p className="text-blue-100/80 leading-relaxed">
                Log in to monitor patient risk scores, visualize real-time vitals, and receive early sepsis warnings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-blue-200/60">
            <span className="flex items-center gap-1"><ShieldCheck size={14} /> HIPAA Compliant</span>
            <span className="flex items-center gap-1"><ShieldCheck size={14} /> End-to-End Encrypted</span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-20 bg-slate-50 relative">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
              <HeartPulse className="text-white w-8 h-8" />
            </div>
          </div>

          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 mb-6 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Clinician Login
          </h2>
          <p className="mt-2 text-slate-500">
            Enter your credentials to access the ICU dashboard.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
            <form className="space-y-6" onSubmit={handleSubmit}>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Institutional Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm"
                    placeholder="doctor@hospital.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Forgot Password?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="flex w-full justify-center items-center gap-2 rounded-xl bg-blue-600 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 focus:outline-none transition-all active:scale-[0.98] disabled:opacity-70"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                    </>
                  ) : 'Sign in to Dashboard'}
                </button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                  <span className="bg-white px-4 text-slate-400 font-medium">New Clinician?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link to="/register" className="flex w-full justify-center items-center rounded-xl border-2 border-slate-100 bg-white py-3 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all">
                  Register Institutional Account
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">
          Authorized medical staff only. All activity is logged under the health system security protocol.
        </p>
      </div>
    </div>
  );
}