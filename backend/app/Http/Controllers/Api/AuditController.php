<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditTrail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * TEKUN SPPT — Module 11: Audit & Kawalan Dalaman
 */
class AuditController extends Controller
{
    // ─── GET /api/audit-logs ─────────────────────────────────────────────────
    public function index(Request $request)
    {
        $user = $request->user() ?? $request->user('sanctum');

        $query = AuditTrail::with('user:id,name,email')
            ->orderBy('created_at', 'desc');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('module') && DB::getSchemaBuilder()->hasColumn('audit_trails', 'module')) {
            $query->where('module', $request->module);
        }
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        // Non-privileged users only see their own logs
        if ($user && !$this->isPrivileged($user)) {
            $query->where('user_id', $user->id);
        }

        $perPage = min((int) $request->get('per_page', 20), 100);
        $logs = $query->paginate($perPage);

        $criticalActions = ['delete', 'role_change', 'admin_access', 'export', 'bulk_delete'];
        $anomalyCount = AuditTrail::where(function ($q) {
            $q->whereRaw("EXTRACT(HOUR FROM created_at) < 8")
              ->orWhereRaw("EXTRACT(HOUR FROM created_at) >= 18");
        })->count();

        $items = collect($logs->items())->map(function ($log) use ($criticalActions) {
            return [
                'id'             => $log->id,
                'user_id'        => $log->user_id,
                'user_name'      => $log->user?->name ?? null,
                'user_email'     => $log->user?->email ?? null,
                'action'         => $log->action,
                'module'         => $log->module ?? null,
                'auditable_type' => $log->auditable_type,
                'auditable_id'   => $log->auditable_id,
                'ip_address'     => $log->ip_address,
                'severity'       => in_array($log->action, $criticalActions) ? 'critical' : 'info',
                'created_at'     => $log->created_at,
            ];
        });

        return response()->json([
            'data'          => $items,
            'total'         => $logs->total(),
            'current_page'  => $logs->currentPage(),
            'per_page'      => $logs->perPage(),
            'last_page'     => $logs->lastPage(),
            'anomaly_count' => $anomalyCount,
        ]);
    }

    // ─── GET /api/audit-logs/{id} ────────────────────────────────────────────
    public function show(Request $request, int $id)
    {
        $user = $request->user() ?? $request->user('sanctum');
        $log  = AuditTrail::with('user:id,name,email')->find($id);

        if (!$log) {
            return response()->json(['message' => 'Log tidak dijumpai.'], 404);
        }

        if ($user && !$this->isPrivileged($user) && $log->user_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $criticalActions = ['delete', 'role_change', 'admin_access', 'export', 'bulk_delete'];
        $hasOldNew = DB::getSchemaBuilder()->hasColumn('audit_trails', 'old_values');

        $decodeIfNeeded = function ($val) {
            if (is_array($val)) return $val;
            if (is_null($val)) return null;
            return json_decode($val, true);
        };
        $oldValues = $hasOldNew
            ? $decodeIfNeeded($log->old_values)
            : $decodeIfNeeded($log->before ?? null);
        $newValues = $hasOldNew
            ? $decodeIfNeeded($log->new_values)
            : $decodeIfNeeded($log->after ?? null);

        // Build diff
        $diff = [];
        if ($oldValues && $newValues) {
            foreach ($newValues as $key => $newVal) {
                $oldVal = $oldValues[$key] ?? null;
                if ($oldVal !== $newVal) {
                    $diff[$key] = ['before' => $oldVal, 'after' => $newVal];
                }
            }
        }

        return response()->json([
            'id'             => $log->id,
            'user_id'        => $log->user_id,
            'user_name'      => $log->user?->name,
            'user_email'     => $log->user?->email,
            'action'         => $log->action,
            'module'         => $log->module ?? null,
            'auditable_type' => $log->auditable_type,
            'auditable_id'   => $log->auditable_id,
            'old_values'     => $oldValues,
            'new_values'     => $newValues,
            'diff'           => $diff,
            'severity'       => in_array($log->action, $criticalActions) ? 'critical' : 'info',
            'ip_address'     => $log->ip_address,
            'user_agent'     => $log->user_agent ?? null,
            'created_at'     => $log->created_at,
        ]);
    }

    // ─── GET /api/audit-logs/anomalies ───────────────────────────────────────
    public function anomalies(Request $request)
    {
        $this->requirePrivileged($request);

        $anomalies = [];

        // Off-hours access
        $offHours = AuditTrail::with('user:id,name,email')
            ->where(function ($q) {
                $q->whereRaw("EXTRACT(HOUR FROM created_at) < 8")
                  ->orWhereRaw("EXTRACT(HOUR FROM created_at) >= 18");
            })
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        foreach ($offHours as $log) {
            $anomalies[] = [
                'id'          => 'off_hours_' . $log->id,
                'type'        => 'off_hours_access',
                'severity'    => 'medium',
                'description' => 'Akses sistem di luar waktu pejabat oleh ' . ($log->user?->name ?? 'Pengguna #' . $log->user_id),
                'user_id'     => $log->user_id,
                'user_name'   => $log->user?->name,
                'module'      => $log->module ?? 'unknown',
                'action'      => $log->action,
                'ip_address'  => $log->ip_address,
                'detected_at' => $log->created_at,
                'log_id'      => $log->id,
                'ai_model'    => 'SPPT-AI',
            ];
        }

        // Role escalation
        $roleChanges = AuditTrail::with('user:id,name,email')
            ->whereIn('action', ['role_change', 'permission_grant', 'admin_access'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        foreach ($roleChanges as $log) {
            $anomalies[] = [
                'id'          => 'role_esc_' . $log->id,
                'type'        => 'role_escalation',
                'severity'    => 'critical',
                'description' => 'Perubahan peranan dikesan oleh ' . ($log->user?->name ?? 'Pengguna #' . $log->user_id),
                'user_id'     => $log->user_id,
                'user_name'   => $log->user?->name,
                'module'      => $log->module ?? 'auth',
                'action'      => $log->action,
                'ip_address'  => $log->ip_address,
                'detected_at' => $log->created_at,
                'log_id'      => $log->id,
                'ai_model'    => 'SPPT-AI',
            ];
        }

        $anomalyCol = collect($anomalies);
        $critical   = $anomalyCol->where('severity', 'critical')->count();
        $high       = $anomalyCol->where('severity', 'high')->count();
        $medium     = $anomalyCol->where('severity', 'medium')->count();

        return response()->json([
            'anomalies'    => $anomalies,
            'total'        => count($anomalies),
            'critical'     => $critical,
            'high'         => $high,
            'medium'       => $medium,
            'generated_at' => now()->toIso8601String(),
            'ai_model'     => 'SPPT-AI',
        ]);
    }

    // ─── POST /api/audit-logs/export ─────────────────────────────────────────
    public function export(Request $request)
    {
        $this->requirePrivileged($request);

        $user   = $request->user() ?? $request->user('sanctum');
        $from   = $request->input('from', now()->startOfMonth()->toDateString());
        $to     = $request->input('to',   now()->toDateString());
        $format = $request->input('format', 'pdf');

        $logs = AuditTrail::with('user:id,name,email')
            ->whereBetween('created_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
            ->orderBy('created_at', 'desc')
            ->limit(1000)
            ->get();

        $reportId = 'BNM-AUDIT-' . strtoupper(str_replace('-', '', $from)) . '-' . now()->format('His');
        $filename = 'audit_report_' . str_replace('-', '', $from) . '_' . str_replace('-', '', $to) . '.pdf';
        $path     = 'audit-reports/' . $filename;

        // Generate PDF
        $stats = [
            'total'    => $logs->count(),
            'critical' => $logs->whereIn('action', ['delete', 'role_change', 'admin_access', 'export'])->count(),
            'from'     => $from,
            'to'       => $to,
        ];
        $html = $this->buildComplianceReportHtml($logs, $stats);
        $pdf  = Pdf::loadHTML($html)->setPaper('a4', 'portrait');
        Storage::disk('local')->put($path, $pdf->output());

        return response()->json([
            'report_id'     => $reportId,
            'pdf_url'       => url('storage/' . $path),
            'filename'      => $filename,
            'from'          => $from,
            'to'            => $to,
            'total_records' => $logs->count(),
            'format'        => $format,
            'generated_at'  => now()->toIso8601String(),
            'generated_by'  => $user?->name ?? 'System',
        ], 201);
    }

    // ─── GET /api/audit-logs/stats ───────────────────────────────────────────
    public function stats(Request $request)
    {
        $this->requirePrivileged($request);

        $today     = now()->toDateString();
        $thisMonth = now()->startOfMonth()->toDateString();
        $from      = $request->input('from', $thisMonth);
        $to        = $request->input('to', $today);

        $total         = AuditTrail::count();
        $todayCount    = AuditTrail::whereDate('created_at', $today)->count();
        $totalAll      = AuditTrail::count();

        $criticalActions = ['delete', 'role_change', 'admin_access', 'export', 'bulk_delete'];
        $critical = AuditTrail::whereIn('action', $criticalActions)->count();

        $uniqueUsers = AuditTrail::distinct('user_id')->count('user_id');

        $byAction = AuditTrail::select('action', DB::raw('COUNT(*) as count'))
            ->groupBy('action')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn($r) => ['action' => $r->action, 'count' => $r->count]);

        $byModule = [];
        if (DB::getSchemaBuilder()->hasColumn('audit_trails', 'module')) {
            $byModule = AuditTrail::select('module', DB::raw('COUNT(*) as count'))
                ->whereNotNull('module')
                ->groupBy('module')
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->map(fn($r) => ['module' => $r->module, 'count' => $r->count]);
        }

        // Daily trend (last 7 days)
        $dailyTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $dailyTrend[] = [
                'date'  => $date,
                'count' => AuditTrail::whereDate('created_at', $date)->count(),
            ];
        }

        return response()->json([
            'total'        => $total,
            'today'        => $todayCount,
            'critical'     => $critical,
            'unique_users' => $uniqueUsers,
            'by_action'    => $byAction,
            'by_module'    => $byModule,
            'daily_trend'  => $dailyTrend,
            'from'         => $from,
            'to'           => $to,
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────
    private function requirePrivileged(Request $request): void
    {
        $user = $request->user() ?? $request->user('sanctum');
        if (!$user) {
            abort(401, 'Tidak disahkan.');
        }
        if (!$this->isPrivileged($user)) {
            abort(403, 'Akses ditolak.');
        }
    }

    private function isPrivileged($user): bool
    {
        if (!$user) return false;
        if ($user->role === 'system_admin') return true;
        $modules = $user->permissions['modules'] ?? [];
        if (in_array('*', $modules)) return true;
        try {
            return $user->hasAnyRole(['Pentadbir Sistem', 'Eksekutif']);
        } catch (\Exception $e) {
            return false;
        }
    }

    private function buildComplianceReportHtml($logs, $stats): string
    {
        $rows = '';
        foreach ($logs as $log) {
            $rows .= sprintf(
                '<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                htmlspecialchars($log->id),
                htmlspecialchars($log->user?->name ?? 'System'),
                htmlspecialchars($log->action),
                htmlspecialchars($log->module ?? '-'),
                htmlspecialchars($log->ip_address ?? '-'),
                htmlspecialchars($log->created_at)
            );
        }

        $from      = $stats['from'];
        $to        = $stats['to'];
        $total     = $stats['total'];
        $critical  = $stats['critical'];
        $generated = now()->format('d/m/Y H:i:s');

        return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;font-size:10px;color:#333;}
  h1{color:#1B2B5E;font-size:16px;}
  h2{color:#2E7D32;font-size:12px;}
  table{width:100%;border-collapse:collapse;margin-top:10px;}
  th{background:#1B2B5E;color:white;padding:4px 6px;text-align:left;}
  td{padding:3px 6px;border-bottom:1px solid #eee;}
  tr:nth-child(even){background:#f9f9f9;}
  .stats{background:#f0f4ff;padding:10px;border-radius:4px;margin-bottom:15px;}
</style>
</head>
<body>
<h1>TEKUN Nasional — Laporan Audit Pematuhan (BNM Format)</h1>
<div class="stats">
  <strong>Tempoh:</strong> {$from} hingga {$to} &nbsp;|&nbsp;
  <strong>Jumlah Log:</strong> {$total} &nbsp;|&nbsp;
  <strong>Tindakan Kritikal:</strong> {$critical} &nbsp;|&nbsp;
  <strong>Dijana:</strong> {$generated}
</div>
<h2>Senarai Log Audit</h2>
<table>
  <thead><tr><th>#</th><th>Pengguna</th><th>Tindakan</th><th>Modul</th><th>IP</th><th>Masa</th></tr></thead>
  <tbody>{$rows}</tbody>
</table>
<p style="margin-top:20px;font-size:9px;color:#999;">
  Dokumen ini dijana secara automatik oleh SPPT. Semua maklumat adalah sulit.
</p>
</body>
</html>
HTML;
    }
}
