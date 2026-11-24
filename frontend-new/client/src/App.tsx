// SEWA style reminder: the route system mirrors real care workflows—public access, protected operations, patient context, and clear escape routes.

import { lazy, Suspense } from "react";
import { Route, Switch, Redirect } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Patients = lazy(() => import("@/pages/Patients"));
const PatientForm = lazy(() => import("@/pages/PatientForm"));
const PatientDetail = lazy(() => import("@/pages/PatientDetail"));
const Alerts = lazy(() => import("@/pages/Alerts"));
const Doctors = lazy(() => import("@/pages/Doctors"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function RequireAuth({ children }: { children: React.ReactNode }) { const { isAuthenticated, isReady } = useAuth(); if (!isReady) return <div className="grid min-h-screen place-items-center bg-[#f3f7f7] text-sm text-[#78909a]">Preparing clinical workspace…</div>; return isAuthenticated ? <>{children}</> : <Redirect to="/login" />; }
function Protected({ children }: { children: React.ReactNode }) { return <RequireAuth>{children}</RequireAuth>; }

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><AuthProvider><Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#f3f7f7] text-sm text-[#78909a]">Loading clinical workspace…</div>}><Switch><Route path="/" component={Landing} /><Route path="/login" component={Login} /><Route path="/register" component={Register} /><Route path="/dashboard"><Protected><Dashboard /></Protected></Route><Route path="/patients/new"><Protected><PatientForm /></Protected></Route><Route path="/patients/:id/edit"><Protected><PatientForm /></Protected></Route><Route path="/patients/:id"><Protected><PatientDetail /></Protected></Route><Route path="/patients"><Protected><Patients /></Protected></Route><Route path="/alerts"><Protected><Alerts /></Protected></Route><Route path="/doctors/:id"><Protected><Doctors /></Protected></Route><Route path="/doctors"><Protected><Doctors /></Protected></Route><Route path="/404" component={NotFound} /><Route><NotFound /></Route></Switch></Suspense></AuthProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
