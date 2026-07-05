// Module: produk-pembiayaan
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const ProductConfig = lazy(() => import('./pages/ProductConfig'));

const routes: RouteObject[] = [
  { path: 'produk', element: React.createElement(ProductConfig) },
];
export default routes;
