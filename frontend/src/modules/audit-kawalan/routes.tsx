// Module: audit-kawalan
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const AuditTrail = lazy(() => import('./pages/AuditTrail'));

const routes: RouteObject[] = [
  { path: 'audit', element: React.createElement(AuditTrail) },
];
export default routes;
