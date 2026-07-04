// Module: pengurusan-akaun
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const Account360 = lazy(() => import('./pages/Account360'));
const Moratorium = lazy(() => import('./pages/Moratorium'));
const PaymentChannels = lazy(() => import('./pages/PaymentChannels'));
const TawidhCalculator = lazy(() => import('./pages/TawidhCalculator'));

const routes: RouteObject[] = [];
export default routes;
