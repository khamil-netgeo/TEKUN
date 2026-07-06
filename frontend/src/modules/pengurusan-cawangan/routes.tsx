import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

const BranchManagement = lazy(() => import('./pages/BranchManagement'));
const BranchDetail = lazy(() => import('./pages/BranchDetail'));
const BranchStaff = lazy(() => import('./pages/BranchStaff'));
const BranchPerformance = lazy(() => import('./pages/BranchPerformance'));

const routes: RouteObject[] = [
  { 
    path: 'pengurusan-cawangan', 
    element: (
      <ProtectedRoute allowedRoles={['branch_manager', 'executive']}>
        <BranchManagement />
      </ProtectedRoute>
    ) 
  },
  { 
    path: 'pengurusan-cawangan/prestasi', 
    element: (
      <ProtectedRoute allowedRoles={['branch_manager', 'executive']}>
        <BranchPerformance />
      </ProtectedRoute>
    ) 
  },
  { 
    path: 'pengurusan-cawangan/:id', 
    element: (
      <ProtectedRoute allowedRoles={['branch_manager', 'executive']}>
        <BranchDetail />
      </ProtectedRoute>
    ) 
  },
  { 
    path: 'pengurusan-cawangan/:id/staf', 
    element: (
      <ProtectedRoute allowedRoles={['branch_manager', 'executive']}>
        <BranchStaff />
      </ProtectedRoute>
    ) 
  },
  { 
    path: 'pengurusan-cawangan/:id/kakitangan', 
    element: (
      <ProtectedRoute allowedRoles={['branch_manager', 'executive']}>
        <BranchStaff />
      </ProtectedRoute>
    ) 
  },
];

export default routes;