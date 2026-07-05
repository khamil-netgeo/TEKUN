/**
 * Module 12 — Pentadbiran Sistem
 * Route definitions — auto-registered by central route registry.
 */
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const UserManagement = lazy(() => import('./pages/UserManagement'));
const SystemConfig = lazy(() => import('./pages/SystemConfig'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));

const routes: RouteObject[] = [
  {
    path: 'pentadbiran',
    element: React.createElement(UserManagement),
  },
  {
    path: 'pentadbiran/konfigurasi',
    element: React.createElement(SystemConfig),
  },
  {
    path: 'pentadbiran/peranan',
    element: React.createElement(RoleManagement),
  },
];

export default routes;
