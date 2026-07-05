// Module: pengurusan-npl
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
const DunningWorkflow = lazy(() => import('./pages/DunningWorkflow'));
const NplDashboard    = lazy(() => import('./pages/NplDashboard'));
const routes: RouteObject[] = [
  { path: 'npl',     element: React.createElement(NplDashboard) },
  { path: 'dunning', element: React.createElement(DunningWorkflow) },
];
export default routes;
