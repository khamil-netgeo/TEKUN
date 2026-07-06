/**
 * Module 12 — Pentadbiran Sistem
 * Route definitions — auto-registered by central route registry.
 */
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

const UserManagement = lazy(() => import('./pages/UserManagement'));
const SystemConfig = lazy(() => import('./pages/SystemConfig'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));

const routes: RouteObject[] = [
  {
    path: 'pentadbiran',
    element: (
      <ProtectedRoute allowedRoles={['Pentadbir Sistem']}>
        <UserManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: 'pentadbiran/konfigurasi',
    element: (
      <ProtectedRoute allowedRoles={['Pentadbir Sistem']}>
        <SystemConfig />
      </ProtectedRoute>
    ),
  },
  {
    path: 'pentadbiran/peranan',
    element: (
      <ProtectedRoute allowedRoles={['Pentadbir Sistem']}>
        <RoleManagement />
      </ProtectedRoute>
    ),
  },
];

export default routes;