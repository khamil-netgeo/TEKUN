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

const AccountList      = lazy(() => import('./pages/AccountList'));
const Account360       = lazy(() => import('./pages/Account360'));
const PaymentChannels  = lazy(() => import('./pages/PaymentChannels'));
const TawidhCalculator = lazy(() => import('./pages/TawidhCalculator'));
const Moratorium       = lazy(() => import('./pages/Moratorium'));

const routes: RouteObject[] = [
  {
    // Index: senarai semua akaun
    path: '/akaun',
    element: React.createElement(AccountList),
  },
  {
    path: '/akaun/:id',
    element: React.createElement(Account360),
  },
  {
    path: '/akaun/:id/bayaran',
    element: React.createElement(PaymentChannels),
  },
  {
    path: '/akaun/:id/tawidh',
    element: React.createElement(TawidhCalculator),
  },
  {
    path: '/akaun/:id/moratorium',
    element: React.createElement(Moratorium),
  },
];

export default routes;
