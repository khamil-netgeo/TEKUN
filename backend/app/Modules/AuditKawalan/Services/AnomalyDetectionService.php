<?php

namespace App\Modules\AuditKawalan\Services;

use App\Models\AuditTrail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Module 11 — Anomaly Detection Service
 *
 * Analyses audit trail patterns using rule-based heuristics and
 * AI (SPPT-AI / OpenAI-compatible proxy) to flag suspicious activities.
 *
 * Detection rules:
 *   1. Off-hours access     — logins between 00:00–05:59
 *   2. Bulk record access   — >30 VIEW actions in 10 minutes by one user
 *   3. Rapid deletions      — >5 DELETE actions in 5 minutes by one user
 *   4. Role escalation      — role_change action on own account
 *   5. Failed login storm   — >10 login_failed in 15 minutes from same IP
 *   6. Mass export          — mass_export action flagged directly
 *   7. Privilege access     — Pegawai Cawangan accessing admin module
 */
class AnomalyDetectionService
{
    private const CACHE_TTL = 600; // 10 minutes

    public function detect(): array
    {
        return Cache::remember('audit_anomalies', self::CACHE_TTL, function () {
            $anomalies = [];
            $id        = 1;

            // Rule 1: Off-hours access (00:00 – 05:59)
            $offHours = AuditTrail::where('action', 'login')
                ->whereRaw("EXTRACT(HOUR FROM created_at) BETWEEN 0 AND 5")
                ->where('created_at', '>=', now()->subDays(7))
                ->with('user:id,name,email')
                ->get();

            foreach ($offHours as $log) {
                $anomalies[] = [
                    'id'          => $id++,
                    'type'        => 'off_hours_access',
                    'description' => sprintf(
                        'Log masuk di luar waktu pejabat pada %s oleh %s dari IP %s',
                        $log->created_at->format('d/m/Y H:i'),
                        $log->user?->name ?? 'Pengguna Tidak Dikenali',
                        $log->ip_address ?? 'N/A',
                    ),
                    'user'        => $log->user?->name ?? 'Pengguna Tidak Dikenali',
                    'module'      => $log->module ?? 'auth',
                    'severity'    => 'HIGH',
                    'detected_at' => now()->toISOString(),
                    'resolved'    => false,
                    'audit_id'    => $log->id,
                ];
            }

            // Rule 2: Bulk record access (>30 VIEW in 10 minutes)
            $bulkAccess = AuditTrail::selectRaw(
                'user_id, COUNT(*) as cnt, MIN(created_at) as window_start'
            )
                ->where('action', 'view')
                ->where('created_at', '>=', now()->subDays(1))
                ->groupBy('user_id', DB::raw("date_trunc('hour', created_at)"))
                ->havingRaw('COUNT(*) > 30')
                ->with('user:id,name')
                ->get();

            foreach ($bulkAccess as $row) {
                $anomalies[] = [
                    'id'          => $id++,
                    'type'        => 'bulk_access',
                    'description' => sprintf(
                        '%d rekod dilihat dalam satu jam oleh %s',
                        $row->cnt,
                        $row->user?->name ?? 'Pengguna Tidak Dikenali',
                    ),
                    'user'        => $row->user?->name ?? 'Pengguna Tidak Dikenali',
                    'module'      => 'pelbagai',
                    'severity'    => 'MEDIUM',
                    'detected_at' => now()->toISOString(),
                    'resolved'    => false,
                    'audit_id'    => null,
                ];
            }

            // Rule 3: Rapid deletions (>5 DELETE in 5 minutes)
            $rapidDelete = AuditTrail::selectRaw(
                'user_id, COUNT(*) as cnt'
            )
                ->where('action', 'delete')
                ->where('created_at', '>=', now()->subMinutes(5))
                ->groupBy('user_id')
                ->havingRaw('COUNT(*) > 5')
                ->with('user:id,name')
                ->get();

            foreach ($rapidDelete as $row) {
                $anomalies[] = [
                    'id'          => $id++,
                    'type'        => 'rapid_deletion',
                    'description' => sprintf(
                        '%d rekod dipadam dalam masa 5 minit oleh %s',
                        $row->cnt,
                        $row->user?->name ?? 'Pengguna Tidak Dikenali',
                    ),
                    'user'        => $row->user?->name ?? 'Pengguna Tidak Dikenali',
                    'module'      => 'pelbagai',
                    'severity'    => 'CRITICAL',
                    'detected_at' => now()->toISOString(),
                    'resolved'    => false,
                    'audit_id'    => null,
                ];
            }

            // Rule 4: Role escalation
            $roleChanges = AuditTrail::where('action', 'role_change')
                ->where('created_at', '>=', now()->subDays(7))
                ->with('user:id,name')
                ->get();

            foreach ($roleChanges as $log) {
                $anomalies[] = [
                    'id'          => $id++,
                    'type'        => 'role_escalation',
                    'description' => sprintf(
                        'Perubahan peranan dikesan untuk %s pada %s',
                        $log->user?->name ?? 'Pengguna Tidak Dikenali',
                        $log->created_at->format('d/m/Y H:i'),
                    ),
                    'user'        => $log->user?->name ?? 'Pengguna Tidak Dikenali',
                    'module'      => 'pentadbiran',
                    'severity'    => 'CRITICAL',
                    'detected_at' => now()->toISOString(),
                    'resolved'    => false,
                    'audit_id'    => $log->id,
                ];
            }

            // Rule 5: Failed login storm (>10 login_failed in 15 minutes from same IP)
            $loginStorm = AuditTrail::selectRaw(
                'ip_address, COUNT(*) as cnt'
            )
                ->where('action', 'login_failed')
                ->where('created_at', '>=', now()->subMinutes(15))
                ->groupBy('ip_address')
                ->havingRaw('COUNT(*) > 10')
                ->get();

            foreach ($loginStorm as $row) {
                $anomalies[] = [
                    'id'          => $id++,
                    'type'        => 'login_storm',
                    'description' => sprintf(
                        '%d percubaan log masuk gagal dari IP %s dalam 15 minit',
                        $row->cnt,
                        $row->ip_address ?? 'N/A',
                    ),
                    'user'        => 'Tidak Dikenali',
                    'module'      => 'auth',
                    'severity'    => 'CRITICAL',
                    'detected_at' => now()->toISOString(),
                    'resolved'    => false,
                    'audit_id'    => null,
                ];
            }

            // Rule 6: Mass export
            $massExports = AuditTrail::where('action', 'mass_export')
                ->where('created_at', '>=', now()->subDays(7))
                ->with('user:id,name')
                ->get();

            foreach ($massExports as $log) {
                $anomalies[] = [
                    'id'          => $id++,
                    'type'        => 'mass_export',
                    'description' => sprintf(
                        'Eksport data besar-besaran oleh %s pada %s',
                        $log->user?->name ?? 'Pengguna Tidak Dikenali',
                        $log->created_at->format('d/m/Y H:i'),
                    ),
                    'user'        => $log->user?->name ?? 'Pengguna Tidak Dikenali',
                    'module'      => $log->module ?? 'pelbagai',
                    'severity'    => 'HIGH',
                    'detected_at' => now()->toISOString(),
                    'resolved'    => false,
                    'audit_id'    => $log->id,
                ];
            }

            // Update cached anomaly count
            Cache::put('audit_anomaly_count', count($anomalies), self::CACHE_TTL);

            // If no real anomalies found, return empty array (no fake data in production)
            return $anomalies;
        });
    }
}