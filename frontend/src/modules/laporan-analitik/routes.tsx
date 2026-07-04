// Module 6 — Laporan & Analitik Routes
// Registered via moduleRegistry.tsx — DO NOT modify App.tsx directly.
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const ExecutiveDashboard  = lazy(() => import('./pages/ExecutiveDashboard'));
const BranchPerformance   = lazy(() => import('./pages/BranchPerformance'));
const PredictiveAnalytics = lazy(() => import('./pages/PredictiveAnalytics'));
const ReportBuilder       = lazy(() => import('./pages/ReportBuilder'));

const routes: RouteObject[] = [
  { path: 'module6/dashboard',           element: <ExecutiveDashboard /> },
  { path: 'module6/executive-dashboard', element: <ExecutiveDashboard /> },
  { path: 'module6/branch-performance',  element: <BranchPerformance /> },
  { path: 'module6/predictive',          element: <PredictiveAnalytics /> },
  { path: 'module6/reports',             element: <ReportBuilder /> },
];

export default routes;
