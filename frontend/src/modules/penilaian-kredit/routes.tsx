// Module: penilaian-kredit
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const AmortizationCalc = lazy(() => import('./pages/AmortizationCalc'));
const ApprovalWorkflow = lazy(() => import('./pages/ApprovalWorkflow'));
const CreditDashboard = lazy(() => import('./pages/CreditDashboard'));
const CreditScoring = lazy(() => import('./pages/CreditScoring'));
const OfferLetter = lazy(() => import('./pages/OfferLetter'));

const routes: RouteObject[] = [];
export default routes;
