// Module: pengurusan-npl
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const DunningWorkflow = lazy(() => import('./pages/DunningWorkflow'));
const NplDashboard = lazy(() => import('./pages/NplDashboard'));

const routes: RouteObject[] = [];
export default routes;
