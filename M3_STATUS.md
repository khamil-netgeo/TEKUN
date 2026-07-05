# M3 — Pengeluaran Dana: GUI Update Status

**Branch:** `feature/m3-gui-update`
**Date:** 2026-07-05
**Status:** COMPLETE — Ready for PR Review

## Changes Made

### Backend
- `DisbursementController.php` — All methods use real DB queries (no hardcoded data)
- `Routes/api.php` — Added: `GET /{id}/offer-letter`, `POST /{id}/send-otp`, `POST /{id}/verify-otp-approve`
- `DisbursementSeeder.php` — 17 realistic records with varied statuses
- `DisbursementTest.php` — 15+ test cases covering all endpoints and RBAC
- `app/Models/Disbursement.php` — Updated fillable with all required columns
- `database/factories/ApplicationFactory.php` — New factory for tests
- `database/factories/BranchFactory.php` — New factory for tests
- `database/factories/DisbursementFactory.php` — New factory for tests

### Frontend
- `SuratTawaran.tsx` — NEW: Official offer letter with amortization table + Jana PDF button
- `DisbursementList.tsx` — Added OTP approval modal (6-digit), Surat Tawaran link, removed all hardcoded data
- `disbursementService.ts` — Added: `getOfferLetterData()`, `sendApprovalOtp()`, `verifyOtpAndApprove()`
- `routes.tsx` — Added `/pengeluaran-dana/surat-tawaran/:id` route
- `ms.json` / `en.json` — 30+ new M3 i18n keys added

### Bug Fixes (pre-existing)
- `RegistrationEkyc.tsx` — Fixed duplicate `INTEGRATIONS` const declaration
- `AuditTrail.tsx` — Fixed named import → default import for `AiBadge`
- `UserManagement.tsx` — Fixed named import → default import for `LoadingSpinner`

## Test Results
- TypeScript: `npx tsc --noEmit` → **0 errors**
- Vite Build: `npx vite build` → **✓ 3311 modules transformed, built in ~1s**
- PHPUnit: Requires Cloud Computer (PHP not in sandbox) — tests written and ready

## API Endpoints Added
| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/api/disbursements/{id}/offer-letter` | Offer letter data with amortization |
| POST | `/api/disbursements/{id}/send-otp` | Send OTP for approval |
| POST | `/api/disbursements/{id}/verify-otp-approve` | Verify OTP and approve |
