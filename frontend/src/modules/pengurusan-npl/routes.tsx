// Module: pengurusan-npl
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

const DunningWorkflow = lazy(() => import('./pages/DunningWorkflow'));
const NplDashboard    = lazy(() => import('./pages/NplDashboard'));
const CollectionTaskQueue = lazy(() => import('./pages/CollectionTaskQueue'));

const routes: RouteObject[] = [
  { 
    path: 'npl',     
    element: (
      <ProtectedRoute allowedRoles={['credit_officer', 'admin']}>
        <NplDashboard />
      </ProtectedRoute>
    ) 
  },
  { 
    path: 'dunning', 
    element: (
      <ProtectedRoute allowedRoles={['credit_officer', 'admin']}>
        <DunningWorkflow />
      </ProtectedRoute>
    ) 
  },
  { 
    path: 'tasks', 
    element: (
      <ProtectedRoute allowedRoles={['credit_officer', 'admin']}>
        <CollectionTaskQueue />
      </ProtectedRoute>
    ) 
  },
];
export default routes;