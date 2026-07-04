// Module: crm-usahawan
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const EntrepreneurProfile = lazy(() => import('./pages/EntrepreneurProfile'));
const FieldVisit = lazy(() => import('./pages/FieldVisit'));

const routes: RouteObject[] = [];
export default routes;
