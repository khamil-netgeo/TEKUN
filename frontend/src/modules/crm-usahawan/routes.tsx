/**
 * Module 7 — CRM & Pemantauan Usahawan
 * Route definitions — auto-registered by central route registry.
 */
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const EntrepreneurProfile = lazy(() => import('./pages/EntrepreneurProfile'));
const FieldVisit          = lazy(() => import('./pages/FieldVisit'));
const KpiDashboard        = lazy(() => import('./pages/KpiDashboard'));

const routes: RouteObject[] = [
  {
    path: 'crm/usahawan',
    element: React.createElement(EntrepreneurProfile),
  },
  {
    path: 'crm/lawatan',
    element: React.createElement(FieldVisit),
  },
  {
    path: 'crm/kpi',
    element: React.createElement(KpiDashboard),
  },
];

export default routes;
