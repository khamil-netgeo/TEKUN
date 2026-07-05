// @ts-nocheck
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const BranchManagement = lazy(() => import('./pages/BranchManagement'));
const BranchDetail = lazy(() => import('./pages/BranchDetail'));
const BranchStaff = lazy(() => import('./pages/BranchStaff'));
const BranchPerformance = lazy(() => import('./pages/BranchPerformance'));

const routes: RouteObject[] = [
  { path: 'pengurusan-cawangan', element: <BranchManagement /> },
  { path: 'pengurusan-cawangan/prestasi', element: <BranchPerformance /> },
  { path: 'pengurusan-cawangan/:id', element: <BranchDetail /> },
  { path: 'pengurusan-cawangan/:id/kakitangan', element: <BranchStaff /> },
];

export default routes;
