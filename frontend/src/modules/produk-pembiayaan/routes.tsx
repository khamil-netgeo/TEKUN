// Module: produk-pembiayaan
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

const ProductConfig = lazy(() => import('./pages/ProductConfig'));

const routes: RouteObject[] = [
  { 
    path: 'produk', 
    element: (
      <ProtectedRoute requiredRoles={['admin']}>
        <ProductConfig />
      </ProtectedRoute>
    ) 
  },
];
export default routes;