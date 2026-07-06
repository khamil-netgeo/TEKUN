// Module: audit-kawalan
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

const AuditTrail = lazy(() => import('./pages/AuditTrail'));

const routes: RouteObject[] = [
  { 
    path: 'audit', 
    element: (
      <ProtectedRoute requiredRoles={['system_admin', 'eksekutif']}>
        <AuditTrail />
      </ProtectedRoute>
    ) 
  },
];
export default routes;