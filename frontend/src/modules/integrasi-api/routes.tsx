// Module: integrasi-api
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const ApiHealth = lazy(() => import('./pages/ApiHealth'));

const routes: RouteObject[] = [];
export default routes;
