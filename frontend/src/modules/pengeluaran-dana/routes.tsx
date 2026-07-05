// Module 3 — Pengeluaran Dana
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const DisbursementList = lazy(() => import('./pages/DisbursementList'));
const AgingEscalation = lazy(() => import('./pages/AgingEscalation'));
const AuthorityMatrix = lazy(() => import('./pages/AuthorityMatrix'));
const EsignTracking = lazy(() => import('./pages/EsignTracking'));

const routes: RouteObject[] = [
  { path: '/pengeluaran-dana', element: <DisbursementList /> },
  { path: '/pengeluaran-dana/aging', element: <AgingEscalation /> },
  { path: '/pengeluaran-dana/authority-matrix', element: <AuthorityMatrix /> },
  { path: '/pengeluaran-dana/esign', element: <EsignTracking /> },
];

export default routes;
