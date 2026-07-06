/**
 * Module 4 — Pengurusan Akaun & Pembayaran Balik
 * Route definitions for lazy loading via central module registry.
 *
 * Per project instructions Section 3.2:
 * - All pages are lazy-loaded
 * - Routes are exported and auto-registered by moduleRegistry.tsx
 * - App.tsx is NOT modified directly
 */
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

const Account360       = lazy(() => import('./pages/Account360'));
const PaymentChannels  = lazy(() => import('./pages/PaymentChannels'));
const TawidhCalculator = lazy(() => import('./pages/TawidhCalculator'));
const Moratorium       = lazy(() => import('./pages/Moratorium'));

const routes: RouteObject[] = [
  {
    path: '/akaun',
    element: (
      <ProtectedRoute requiredPermission="view_account">
        <Account360 />
      </ProtectedRoute>
    ),
  },
  {
    path: '/akaun/:id',
    element: (
      <ProtectedRoute requiredPermission="view_account">
        <Account360 />
      </ProtectedRoute>
    ),
  },
  {
    path: '/akaun/:id/bayaran',
    element: (
      <ProtectedRoute requiredPermission="manage_payment">
        <PaymentChannels />
      </ProtectedRoute>
    ),
  },
  {
    path: '/akaun/:id/tawidh',
    element: (
      <ProtectedRoute requiredPermission="manage_tawidh">
        <TawidhCalculator />
      </ProtectedRoute>
    ),
  },
  {
    path: '/akaun/:id/moratorium',
    element: (
      <ProtectedRoute requiredPermission="manage_moratorium">
        <Moratorium />
      </ProtectedRoute>
    ),
  },
];

export default routes;