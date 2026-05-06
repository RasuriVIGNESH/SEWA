import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Mail, Lock, User, Phone,
    Stethoscope, ArrowRight, AlertCircle, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '../api/authApi';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        specialization: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '', // Added local state for confirmation
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Frontend Validation: Check if passwords match
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            const result = await authApi.register({
                name: formData.name,
                specialization: formData.specialization,
                email: formData.email,
                password: formData.password,
                phoneNumber: formData.phoneNumber,
            });

            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('isAuthenticated', 'true');

            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sm:mx-auto sm:w-full sm:max-w-md text-center"
            >
                <Link to="/" className="inline-block group">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform duration-200">
                        <Activity className="w-8 h-8 text-white" />
                    </div>
                </Link>
                <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
                    Create your account
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    Already registered?{' '}
                    <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                        Sign in to your portal
                    </Link>
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl"
            >
                <div className="bg-white py-10 px-6 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200 sm:px-12">
                    <form className="space-y-6" onSubmit={handleSubmit}>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="space-y-1">
                                <label htmlFor="name" className="block text-sm font-semibold text-slate-700">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                    </div>
                                    <Input
                                        id="name" name="name" type="text" required value={formData.name} onChange={handleChange}
                                        className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-blue-500 transition-all"
                                        placeholder="Dr. John Doe"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <Input
                                        id="email" name="email" type="email" required value={formData.email} onChange={handleChange}
                                        className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-blue-500 transition-all"
                                        placeholder="doctor@hospital.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Specialization */}
                            <div className="space-y-1">
                                <label htmlFor="specialization" className="block text-sm font-semibold text-slate-700">Specialization</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Stethoscope className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <Input
                                        id="specialization" name="specialization" type="text" required value={formData.specialization} onChange={handleChange}
                                        className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-blue-500 transition-all"
                                        placeholder="e.g. Cardiology"
                                    />
                                </div>
                            </div>

                            {/* Phone Number (Updated Placeholder) */}
                            <div className="space-y-1">
                                <label htmlFor="phoneNumber" className="block text-sm font-semibold text-slate-700">Phone Number</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <Input
                                        id="phoneNumber" name="phoneNumber" type="tel" required value={formData.phoneNumber} onChange={handleChange}
                                        className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-blue-500 transition-all"
                                        placeholder="+91 00000 00000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Password */}
                            <div className="space-y-1">
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <Input
                                        id="password" name="password" type="password" required value={formData.password} onChange={handleChange}
                                        className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-blue-500 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1">
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <ShieldCheck className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <Input
                                        id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange}
                                        className={`pl-10 h-12 rounded-xl border-slate-200 focus:ring-blue-500 transition-all ${formData.confirmPassword && formData.password !== formData.confirmPassword
                                            ? 'border-red-300 bg-red-50'
                                            : ''
                                            }`}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-100"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-medium">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl shadow-lg shadow-blue-100 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Creating Account...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Create Professional Account</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}