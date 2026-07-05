<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditTrail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * TEKUN SPPT — Module 11: Audit & Kawalan Dalaman
 * All data from PostgreSQL. AI engine: SPPT-AI (no vendor names).
 */
class AuditController extends Controller
{
    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function isPrivileged($user): bool
    {
        if (!$user) return false;
        $role = $user->role ?? null;
        if (in_array($role, ['system_admin', 'eksekutif'])) return true;
        $perms = is_array($user->permissions) ? $user->permissions : json_decode($user->permissions ?? '{}', true);
        if (!empty($perms['all'])) return true;
        try {
            return $user->hasAnyRole(['Pentadbir Sistem', 'Eksekutif']);
        } catch (\Exception $e) {
            return false;
        }
    }

    private function requirePrivileged(Request $request): void
    {
        $user = $request->user() ?? $request->user('sanctum');
        if (!$user) abort(401, 'Tidak disahkan.');
        if (!$this->isPrivileged($user)) abort(403, 'Akses ditolak.');
    }

    private function isAnomalyLog(AuditTrail $log): array
    {
        $anomalyActions = ['role_change', 'permission_grant', 'admin_access'];
        $hour     = (int) $log->created_at->format('H');
        $offHours = $hour < 8 || $hour >= 18;
        $roleEsc  = in_array($log->action, $anomalyActions);
        $reasons  = [];
        if ($offHours) $reasons[] = 'Akses sistem di luar waktu pejabat (' . $log->created_at->format('H:i') . ')';
        if ($roleEsc)  $reasons[] = 'Perubahan peranan atau kebenaran dikesan';
        return [
            'is_anomaly'     => $offHours || $roleEsc,
            'anomaly_reason' => !empty($reasons) ? implode('; ', $reasons) : null,
        ];
    }

    // ─── GET /api/audit-logs ─────────────────────────────────────────────────

    public function index(Request $request)
    {
        $user  = $request->user() ?? $request->user('sanctum');
        $query = AuditTrail::with('user:id,name,email')->orderBy('created_at', 'desc');

        if ($request->filled('user_id'))  $query->where('user_id', $request->user_id);
        if ($request->filled('module'))   $query->where('module', $request->module);
        if ($request->filled('action'))   $query->where('action', $request->action);
        if ($request->filled('from'))     $query->whereDate('created_at', '>=', $request->from);
        if ($request->filled('to'))       $query->whereDate('created_at', '<=', $request->to);

        if ($user && !$this->isPrivileged($user)) {
            $query->where('user_id', $user->id);
        }

        $perPage = min((int) $request->get('per_page', 20), 100);
        $logs    = $query->paginate($perPage);

        $criticalActions = ['delete', 'role_change', 'admin_access', 'export', 'bulk_delete'];

        $anomalyCount = AuditTrail::where(function ($q) {
            $q->whereRaw("EXTRACT(HOUR FROM created_at) < 8")
              ->orWhereRaw("EXTRACT(HOUR FROM created_at) >= 18")
              ->orWhereIn('action', ['role_change', 'permission_grant', 'admin_access']);
        })->count();

        $items = collect($logs->items())->map(function ($log) use ($criticalActions) {
            $anomaly = $this->isAnomalyLog($log);
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
                'severity'       => in_array($log->action, $criticalActions) ? 'critical' : ($anomaly['is_anomaly'] ? 'high' : 'info'),
                'is_anomaly'     => $anomaly['is_anomaly'],
                'anomaly_reason' => $anomaly['anomaly_reason'],
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

        if (!$log) return response()->json(['message' => 'Log tidak dijumpai.'], 404);

        if ($user && !$this->isPrivileged($user) && $log->user_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $decodeIfNeeded = function ($val) {
            if (is_array($val)) return $val;
            if (is_null($val))  return null;
            return json_decode($val, true);
        };
        $oldValues = $decodeIfNeeded($log->old_values ?? $log->before ?? null);
        $newValues = $decodeIfNeeded($log->new_values ?? $log->after  ?? null);

        $diff = [];
        if (is_array($oldValues) && is_array($newValues)) {
            $allKeys = array_unique(array_merge(array_keys($oldValues), array_keys($newValues)));
            foreach ($allKeys as $key) {
                $before = $oldValues[$key] ?? null;
                $after  = $newValues[$key] ?? null;
                if ($before !== $after) $diff[$key] = ['before' => $before, 'after' => $after];
            }
        }

        $anomaly         = $this->isAnomalyLog($log);
        $criticalActions = ['delete', 'role_change', 'admin_access', 'export', 'bulk_delete'];

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
            'is_anomaly'     => $anomaly['is_anomaly'],
            'anomaly_reason' => $anomaly['anomaly_reason'],
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

        $offHours = AuditTrail::with('user:id,name,email')
            ->where(function ($q) {
                $q->whereRaw("EXTRACT(HOUR FROM created_at) < 8")
                  ->orWhereRaw("EXTRACT(HOUR FROM created_at) >= 18");
            })
            ->orderBy('created_at', 'desc')
            ->limit(50)->get();

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

        $roleChanges = AuditTrail::with('user:id,name,email')
            ->whereIn('action', ['role_change', 'permission_grant', 'admin_access'])
            ->orderBy('created_at', 'desc')
            ->limit(20)->get();

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
        return response()->json([
            'anomalies'    => $anomalies,
            'total'        => count($anomalies),
            'critical'     => $anomalyCol->where('severity', 'critical')->count(),
            'high'         => $anomalyCol->where('severity', 'high')->count(),
            'medium'       => $anomalyCol->where('severity', 'medium')->count(),
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
            ->limit(1000)->get();

        $reportId = 'BNM-AUDIT-' . strtoupper(str_replace('-', '', $from)) . '-' . now()->format('His');
        $filename = 'audit_report_' . str_replace('-', '', $from) . '_' . str_replace('-', '', $to) . '.pdf';
        $path     = 'audit-reports/' . $filename;

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

        $today = now()->toDateString();
        $total         = AuditTrail::count();
        $todayCount    = AuditTrail::whereDate('created_at', $today)->count();
        $criticalActions = ['delete', 'role_change', 'admin_access', 'export', 'bulk_delete'];
        $critical      = AuditTrail::whereIn('action', $criticalActions)->count();
        $uniqueUsers   = AuditTrail::distinct('user_id')->count('user_id');

        $byAction = AuditTrail::select('action', DB::raw('COUNT(*) as count'))
            ->groupBy('action')->orderByDesc('count')->limit(10)->get()
            ->map(fn($r) => ['action' => $r->action, 'count' => $r->count]);

        $byModule = AuditTrail::select('module', DB::raw('COUNT(*) as count'))
            ->whereNotNull('module')->groupBy('module')->orderByDesc('count')->limit(10)->get()
            ->map(fn($r) => ['module' => $r->module, 'count' => $r->count]);

        $dailyTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $dailyTrend[] = ['date' => $date, 'count' => AuditTrail::whereDate('created_at', $date)->count()];
        }

        $todayAnomalies = AuditTrail::whereDate('created_at', $today)
            ->where(function ($q) {
                $q->whereRaw("EXTRACT(HOUR FROM created_at) < 8")
                  ->orWhereRaw("EXTRACT(HOUR FROM created_at) >= 18")
                  ->orWhereIn('action', ['role_change', 'permission_grant', 'admin_access']);
            })->count();

        $topAnomalyRow = AuditTrail::whereDate('created_at', $today)
            ->where(function ($q) {
                $q->whereRaw("EXTRACT(HOUR FROM created_at) < 8")
                  ->orWhereRaw("EXTRACT(HOUR FROM created_at) >= 18")
                  ->orWhereIn('action', ['role_change', 'permission_grant', 'admin_access']);
            })
            ->selectRaw("action, COUNT(*) as cnt")
            ->groupBy('action')->orderByDesc('cnt')->first();

        $topAnomalyLabel = null;
        if ($topAnomalyRow) {
            $labels = ['role_change' => 'Perubahan peranan', 'permission_grant' => 'Pemberian kebenaran', 'admin_access' => 'Akses pentadbir'];
            $topAnomalyLabel = $labels[$topAnomalyRow->action] ?? 'Akses luar waktu pejabat';
        }

        return response()->json([
            'total'            => $total,
            'today'            => $todayCount,
            'critical'         => $critical,
            'unique_users'     => $uniqueUsers,
            'by_action'        => $byAction,
            'by_module'        => $byModule,
            'daily_trend'      => $dailyTrend,
            'today_anomalies'  => $todayAnomalies,
            'top_anomaly_type' => $topAnomalyLabel,
            'generated_at'     => now()->toIso8601String(),
        ]);
    }

    // ─── PDF Builder ─────────────────────────────────────────────────────────

    private function buildComplianceReportHtml($logs, array $stats): string
    {
        $rows = '';
        foreach ($logs as $log) {
            $rows .= sprintf(
                '<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                htmlspecialchars((string)$log->id),
                htmlspecialchars($log->user?->name ?? 'System'),
                htmlspecialchars($log->action),
                htmlspecialchars($log->module ?? '-'),
                htmlspecialchars($log->ip_address ?? '-'),
                htmlspecialchars((string)$log->created_at)
            );
        }
        $from = $stats['from']; $to = $stats['to'];
        $total = $stats['total']; $critical = $stats['critical'];
        $generated = now()->format('d/m/Y H:i:s');
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'>
<style>body{font-family:Arial,sans-serif;font-size:11px;color:#222;}
h1{color:#1B2B5E;font-size:16px;}h2{color:#1B2B5E;font-size:13px;}
table{width:100%;border-collapse:collapse;margin-top:10px;}
th{background:#1B2B5E;color:white;padding:6px 8px;text-align:left;}
td{padding:5px 8px;border-bottom:1px solid #eee;}
tr:nth-child(even) td{background:#f9f9f9;}
.header{border-bottom:2px solid #1B2B5E;padding-bottom:8px;margin-bottom:16px;}
</style></head><body>
<div class='header'>
<h1>TEKUN Nasional — Laporan Audit Pematuhan</h1>
<p>Sistem Pengurusan Pembiayaan TEKUN (SPPT) | Dianalisis oleh Enjin AI SPPT</p>
<p>Tempoh: {$from} hingga {$to} | Dijana: {$generated}</p>
</div>
<h2>Ringkasan</h2>
<table style='width:auto'>
<tr><td><b>Jumlah Rekod</b></td><td>{$total}</td></tr>
<tr><td><b>Tindakan Kritikal</b></td><td>{$critical}</td></tr>
</table>
<h2>Log Audit Terperinci</h2>
<table><thead><tr><th>ID</th><th>Pengguna</th><th>Tindakan</th><th>Modul</th><th>Alamat IP</th><th>Masa</th></tr></thead>
<tbody>{$rows}</tbody></table>
</body></html>";
    }
}
