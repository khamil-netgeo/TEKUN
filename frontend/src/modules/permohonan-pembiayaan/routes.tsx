import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const ApplicationList     = lazy(() => import('./pages/ApplicationList'));
const NewApplication      = lazy(() => import('./pages/NewApplication'));
const RegistrationEkyc    = lazy(() => import('./pages/RegistrationEkyc'));
const OtpVerification     = lazy(() => import('./pages/OtpVerification'));
const AutoReject          = lazy(() => import('./pages/AutoReject'));
const DocumentUpload      = lazy(() => import('./pages/DocumentUpload'));
const ApplicationTimeline = lazy(() => import('./pages/ApplicationTimeline'));

const routes: RouteObject[] = [
  { path: '/applications',                element: <ApplicationList /> },
  { path: '/applications/new',            element: <NewApplication /> },
  { path: '/applications/ekyc',           element: <RegistrationEkyc /> },
  { path: '/applications/otp',            element: <OtpVerification /> },
  { path: '/applications/auto-reject',    element: <AutoReject /> },
  { path: '/applications/:id/documents',  element: <DocumentUpload /> },
  { path: '/applications/:id/timeline',   element: <ApplicationTimeline /> },
];

export default routes;
