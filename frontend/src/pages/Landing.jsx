import React from 'react';
import { Link } from 'react-router-dom';
import {
    Activity,
    ShieldAlert,
    Zap,
    Database,
    LineChart,
    Users,
    ChevronRight,
    HeartPulse
} from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-6 py-4 backdrop-blur-md bg-white/70 sticky top-0 z-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <HeartPulse className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-blue-900">SEWA</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                        Clinician Login
                    </Link>
                    <Link to="/register" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                        Register Institution
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center lg:text-left lg:flex items-center gap-12">
                        <div className="lg:w-1/2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-6 uppercase tracking-wider">
                                <Zap size={14} /> AI-Powered Clinical Support
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-[1.1]">
                                Detect Sepsis <span className="text-blue-600">Hours Faster.</span>
                            </h1>
                            <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-2xl">
                                SEWA is an advanced early warning system for ICUs. Using XGBoost machine learning and real-time vitals streaming, we help clinicians identify sepsis risks before they become life-threatening.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link to="/register" className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">
                                    Get Started <ChevronRight size={20} />
                                </Link>
                                <Link to="/login" className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
                                    View Demo
                                </Link>
                            </div>
                            <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm text-slate-400">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert size={18} className="text-emerald-500" /> Sepsis-3 Compliant
                                </div>
                                <div className="flex items-center gap-2">
                                    <Database size={18} className="text-blue-400" /> HL7 FHIR Standard
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/2 mt-16 lg:mt-0 relative">
                            <div className="absolute -inset-4 bg-blue-500/10 rounded-full blur-3xl"></div>
                            <img
                                src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1000"
                                alt="Medical Dashboard"
                                className="rounded-2xl shadow-2xl border border-slate-200 relative z-10"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Precision Monitoring for Intensive Care</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">Our system integrates directly with ICU hardware to provide a unified, intelligent view of patient health.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                                <Activity className="text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Real-time Vitals</h3>
                            <p className="text-slate-600 leading-relaxed">Continuous streaming of Heart Rate, SpO2, and BP directly from bedside monitors with zero latency.</p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                                <Zap className="text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">ML-Based Prediction</h3>
                            <p className="text-slate-600 leading-relaxed">XGBoost model trained on 1M+ records, providing high-sensitivity alerts hours before clinical onset.</p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-6">
                                <LineChart className="text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Clinical Scoring</h3>
                            <p className="text-slate-600 leading-relaxed">Automated SOFA and qSOFA calculations alongside AI risk scores for comprehensive decision support.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack Banner */}
            <section className="py-12 border-y border-slate-100 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <span className="text-lg font-bold">Spring Boot</span>
                        <span className="text-lg font-bold">React 18</span>
                        <span className="text-lg font-bold">FastAPI</span>
                        <span className="text-lg font-bold">PostgreSQL</span>
                        <span className="text-lg font-bold">Apache Kafka</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <HeartPulse className="text-blue-500 w-5 h-5" />
                        <span className="text-xl font-bold text-white">SEWA</span>
                    </div>
                    <p className="text-sm">© 2024 Sepsis Early Warning Agent. Advanced Clinical Decision Support.</p>
                    <div className="flex gap-6 text-sm">
                        <a href="#" className="hover:text-white transition-colors">Documentation</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;