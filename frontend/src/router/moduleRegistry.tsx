/**
 * TEKUN SPPT - Central Module Route Registry
 *
 * Per project instructions Section 3.2:
 * - Each module exports a routes.tsx with lazy-loaded route definitions
 * - This registry auto-imports all module routes
 * - App.tsx MUST NOT be modified directly by individual module agents
 *
 * To add a new module: create src/modules/<module-name>/routes.tsx
 * and import it here ONLY.
 */

import type { RouteObject } from 'react-router-dom';

// ── Module Route Imports ──────────────────────────────────────────────────────
import permohonanRoutes    from '../modules/permohonan-pembiayaan/routes';
import penilaianRoutes     from '../modules/penilaian-kredit/routes';
import pengeluaranRoutes   from '../modules/pengeluaran-dana/routes';
import akaunRoutes         from '../modules/pengurusan-akaun/routes';
import nplRoutes           from '../modules/pengurusan-npl/routes';
import laporanRoutes       from '../modules/laporan-analitik/routes';
import crmRoutes           from '../modules/crm-usahawan/routes';
import cawanganRoutes      from '../modules/pengurusan-cawangan/routes';
import produkRoutes        from '../modules/produk-pembiayaan/routes';
import integrasiRoutes     from '../modules/integrasi-api/routes';
import auditRoutes         from '../modules/audit-kawalan/routes';
import pentadbiranRoutes   from '../modules/pentadbiran-sistem/routes';

// ── Aggregate all module routes ───────────────────────────────────────────────
const allModuleRoutes: RouteObject[] = [
  ...permohonanRoutes,
  ...penilaianRoutes,
  ...pengeluaranRoutes,
  ...akaunRoutes,
  ...nplRoutes,
  ...laporanRoutes,
  ...crmRoutes,
  ...cawanganRoutes,
  ...produkRoutes,
  ...integrasiRoutes,
  ...auditRoutes,
  ...pentadbiranRoutes,
];

export default allModuleRoutes;
