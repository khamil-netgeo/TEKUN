// Module: pengeluaran-dana
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const AgingEscalation = lazy(() => import('./pages/AgingEscalation'));
const AuthorityMatrix = lazy(() => import('./pages/AuthorityMatrix'));
const DisbursementList = lazy(() => import('./pages/DisbursementList'));
const EsignTracking = lazy(() => import('./pages/EsignTracking'));

const routes: RouteObject[] = [];
export default routes;
