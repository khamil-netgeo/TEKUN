/**
 * Module 10 — Integrasi API Luaran
 * Route definitions — auto-registered by central route registry.
 */
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const ApiHealthDashboard = lazy(() => import('./pages/ApiHealthDashboard'));
const ApiHealth = lazy(() => import('./pages/ApiHealth'));

const routes: RouteObject[] = [
  {
    path: 'integrasi-api',
    element: React.createElement(ApiHealthDashboard),
  },
  {
    path: 'integrasi-api/health',
    element: React.createElement(ApiHealth),
  },
];

export default routes;
