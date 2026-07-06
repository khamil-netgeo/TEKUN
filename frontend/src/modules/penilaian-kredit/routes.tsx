import React from 'react';
import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const CreditDashboard = React.lazy(() => import('./pages/CreditDashboard'));
const PreAssessment = React.lazy(() => import('./pages/PreAssessment'));
const CreditScoring = React.lazy(() => import('./pages/CreditScoring'));
const ApprovalWorkflow = React.lazy(() => import('./pages/ApprovalWorkflow'));
const AmortizationCalc = React.lazy(() => import('./pages/AmortizationCalc'));
const OfferLetter = React.lazy(() => import('./pages/OfferLetter'));

const M2_ROLES = ['Pegawai Kredit', 'Pengurus Cawangan', 'Pentadbir Sistem'];

export const creditRoutes: RouteObject[] = [
  {
    path: '/module2/dashboard',
    element: (<ProtectedRoute allowedRoles={M2_ROLES}><CreditDashboard /></ProtectedRoute>),
  },
  {
    path: '/module2/pre-assessment/:id',
    element: (<ProtectedRoute allowedRoles={M2_ROLES}><PreAssessment /></ProtectedRoute>),
  },
  {
    path: '/module2/scoring/:id',
    element: (<ProtectedRoute allowedRoles={M2_ROLES}><CreditScoring /></ProtectedRoute>),
  },
  {
    path: '/module2/approval',
    element: (<ProtectedRoute allowedRoles={M2_ROLES}><ApprovalWorkflow /></ProtectedRoute>),
  },
  {
    path: '/module2/amortization/:id',
    element: (<ProtectedRoute allowedRoles={M2_ROLES}><AmortizationCalc /></ProtectedRoute>),
  },
  {
    path: '/module2/offer-letter/:id',
    element: (<ProtectedRoute allowedRoles={M2_ROLES}><OfferLetter /></ProtectedRoute>),
  },
];

export default creditRoutes;
