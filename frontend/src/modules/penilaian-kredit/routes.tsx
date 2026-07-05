import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy load components
const CreditDashboard = React.lazy(() => import('./pages/CreditDashboard'));
const PreAssessment = React.lazy(() => import('./pages/PreAssessment'));
const CreditScoring = React.lazy(() => import('./pages/CreditScoring'));
const ApprovalWorkflow = React.lazy(() => import('./pages/ApprovalWorkflow'));
const AmortizationCalc = React.lazy(() => import('./pages/AmortizationCalc'));
const OfferLetter = React.lazy(() => import('./pages/OfferLetter'));

export const creditRoutes: RouteObject[] = [
  {
    path: 'penilaian-kredit',
    element: (
      <ProtectedRoute allowedRoles={['Pegawai Kredit', 'Pengurus Cawangan', 'Pentadbir Sistem']}>
        <Outlet />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <CreditDashboard /> },
      { path: 'pre-assessment/:id', element: <PreAssessment /> },
      { path: 'scoring/:id', element: <CreditScoring /> },
      { path: 'approval/:id', element: <ApprovalWorkflow /> },
      { path: 'amortization/:id', element: <AmortizationCalc /> },
      { path: 'offer-letter/:id', element: <OfferLetter /> },
    ],
  },
];

export default creditRoutes;
