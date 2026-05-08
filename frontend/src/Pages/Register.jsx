import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  HeartPulse,
  User,
  Stethoscope,
  Mail,
  Phone,
  Lock,
  ArrowLeft,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api';
import { useAuthStore } from '../store';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    email: '',
    phoneNumber: '',
    password: ''
  });

  const navigate = useNavigate();
  const loginFn = useAuthStore(state => state.login);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/auth/register', formData);
      return data;
    },
    onSuccess: data => {
      loginFn(data.token, data.name, data.doctorId);
      navigate('/dashboard');
    }
  });

  const handleSubmit = e => {
    e.preventDefault();
    registerMutation.mutate();
  };

  const handleChange = e => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">

      {/* Left Side: Branding & Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 z-10 bg-blue-900/40 mix-blend-multiply"></div>
        <img
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1500"
          alt="Medical Professional"
          className="absolute inset-0 object-cover w-full h-full"
        />

        {/* Content on Image */}
        <div className="relative z-20 flex flex-col justify-between p-12 text-white w-full">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-white p-2 rounded-lg">
              <HeartPulse className="text-blue-600 w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">SEWA</span>
          </Link>

          <div>
            <div className="bg-blue-500/20 backdrop-blur-md border border-white/20 p-8 rounded-2xl">
              <ShieldCheck className="w-12 h-12 mb-4 text-blue-200" />
              <h2 className="text-3xl font-bold mb-4">Join the ICU Monitoring Network</h2>
              <p className="text-blue-100 leading-relaxed">
                Connect your department to SEWA’s real-time sepsis detection engine.
                Improve patient outcomes with AI-driven early warning alerts.
              </p>
            </div>
          </div>

          <p className="text-sm text-blue-200">
            © 2024 Sepsis Early Warning Agent. Institutional Security Standards.
          </p>
        </div>
      </div>

      {/* Right Side: Registration Form */}
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
            Register Clinician
          </h2>
          <p className="mt-2 text-slate-500">
            Create your professional account to manage patient alerts.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
            <form className="space-y-4" onSubmit={handleSubmit}>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input name="name" type="text" required value={formData.name} onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="Dr. John Doe" />
                </div>
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Specialization</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Stethoscope className="h-4 w-4 text-slate-400" />
                  </div>
                  <input name="specialization" type="text" required value={formData.specialization} onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="Critical Care / ICU" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input name="phoneNumber" type="tel" required value={formData.phoneNumber} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      placeholder="+1..." />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Institutional Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input name="email" type="email" required value={formData.email} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      placeholder="hospital@edu.com" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Secure Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input name="password" type="password" required value={formData.password} onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="••••••••" />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={registerMutation.isPending}
                  className="flex w-full justify-center items-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70">
                  {registerMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Finalizing account...</>
                  ) : 'Create Account'}
                </button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                  <span className="bg-white px-4 text-slate-400 font-medium text-[10px]">Already registered?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link to="/login" className="flex w-full justify-center items-center rounded-xl border-2 border-slate-100 bg-white py-2.5 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}