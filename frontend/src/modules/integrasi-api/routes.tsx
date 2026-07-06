/**
 * Module 10 — Integrasi API Luaran
 * Route definitions — auto-registered by central route registry.
 */
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

const ApiHealthDashboard = lazy(() => import('./pages/ApiHealthDashboard'));
const ApiHealth = lazy(() => import('./pages/ApiHealth'));

const routes: RouteObject[] = [
  {
    path: 'integrasi-api',
    element: (
      <ProtectedRoute requireRoles={['system_admin', 'executive']}>
        <ApiHealthDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: 'integrasi-api/health',
    element: (
      <ProtectedRoute requireRoles={['system_admin', 'executive']}>
        <ApiHealth />
      </ProtectedRoute>
    ),
  },
];

export default routes;