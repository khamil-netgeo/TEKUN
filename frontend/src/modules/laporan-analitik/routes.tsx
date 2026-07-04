// Module: laporan-analitik
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'));
const ReportBuilder = lazy(() => import('./pages/ReportBuilder'));

const routes: RouteObject[] = [];
export default routes;
