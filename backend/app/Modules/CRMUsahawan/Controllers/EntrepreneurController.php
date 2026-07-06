<?php

namespace App\Modules\CRMUsahawan\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\CRMUsahawan\Models\Entrepreneur;
use App\Modules\CRMUsahawan\Models\FieldVisit;
use App\Modules\CRMUsahawan\Models\EntrepreneurKpiSnapshot;
use App\Modules\CRMUsahawan\Services\EntrepreneurService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * Module 7 — CRM & Pemantauan Usahawan
 * EntrepreneurController — Full CRUD + AI health scoring + field visit management
 */
class EntrepreneurController extends Controller
{
    public function __construct(private EntrepreneurService $service) {}

    // ── GET /api/entrepreneurs ────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = Entrepreneur::query();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('ic_no', 'ilike', "%{$search}%")
                  ->orWhere('ref_no', 'ilike', "%{$search}%")
                  ->orWhere('business_name', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        if ($distress = $request->get('distress_level')) {
            $query->where('distress_level', $distress);
        }
        if ($skim = $request->get('skim')) {
            $query->where('skim', $skim);
        }

        $perPage       = min((int) $request->get('per_page', 15), 100);
        $entrepreneurs = $query->orderBy('name')->paginate($perPage);

        return response()->json([
            'data'         => $entrepreneurs->items(),
            'total'        => $entrepreneurs->total(),
            'current_page' => $entrepreneurs->currentPage(),
            'last_page'    => $entrepreneurs->lastPage(),
            'per_page'     => $entrepreneurs->perPage(),
        ]);
    }

    // ── GET /api/entrepreneurs/{id} ───────────────────────────────────────────

    public function show(string $id)
    {
        $entrepreneur = Entrepreneur::where('ref_no', $id)
            ->orWhere('id', is_numeric($id) ? (int) $id : 0)
            ->firstOrFail();

        $kpiTrend = EntrepreneurKpiSnapshot::where('entrepreneur_id', $entrepreneur->id)
            ->orderBy('snapshot_date', 'desc')
            ->limit(12)
            ->get()
            ->reverse()
            ->values();

        $recentVisits = FieldVisit::where('entrepreneur_id', $entrepreneur->id)
            ->orderBy('scheduled_date', 'desc')
            ->limit(5)
            ->get();

        $health = $this->service->computeHealthScore($entrepreneur);

        return response()->json(array_merge(
            $entrepreneur->toArray(),
            [
                'kpi_trend'     => $kpiTrend,
                'recent_visits' => $recentVisits,
                'ai_health'     => $health,
            ]
        ));
    }

    // ── PUT /api/entrepreneurs/{id} ───────────────────────────────────────────

    public function update(Request $request, string $id)
    {
        $entrepreneur = Entrepreneur::where('ref_no', $id)
            ->orWhere('id', is_numeric($id) ? (int) $id : 0)
            ->firstOrFail();

        $validated = $request->validate([
            'business_name'    => 'sometimes|string|max:255',
            'business_sector'  => 'sometimes|string|max:100',
            'business_address' => 'sometimes|string',
            'phone'            => 'sometimes|string|max:20',
            'email'            => 'sometimes|email|max:255',
            'monthly_revenue'  => 'sometimes|numeric|min:0',
            'employee_count'   => 'sometimes|integer|min:0',
            'notes'            => 'sometimes|string|nullable',
        ]);

        $entrepreneur->update($validated);

        return response()->json([
            'message'      => 'Profil usahawan berjaya dikemaskini.',
            'entrepreneur' => $entrepreneur->fresh(),
        ]);
    }

    // ── GET /api/entrepreneurs/{id}/visits ────────────────────────────────────

    public function visits(Request $request, string $id)
    {
        $entrepreneur = Entrepreneur::where('ref_no', $id)
            ->orWhere('id', is_numeric($id) ? (int) $id : 0)
            ->firstOrFail();

        $query = FieldVisit::where('entrepreneur_id', $entrepreneur->id);

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $perPage = min((int) $request->get('per_page', 15), 100);
        $visits  = $query->orderBy('scheduled_date', 'desc')->paginate($perPage);

        return response()->json([
            'data'         => $visits->items(),
            'total'        => $visits->total(),
            'current_page' => $visits->currentPage(),
            'last_page'    => $visits->lastPage(),
        ]);
    }

    // ── POST /api/entrepreneurs/{id}/visits ───────────────────────────────────

    public function storeVisit(Request $request, string $id)
    {
        $entrepreneur = Entrepreneur::where('ref_no', $id)
            ->orWhere('id', is_numeric($id) ? (int) $id : 0)
            ->firstOrFail();

        $validated = $request->validate([
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'required|string',
            'purpose'        => 'required|string|max:255',
            'location'       => 'required|string|max:255',
            'notes'          => 'nullable|string',
        ]);

        $user  = Auth::user();
        $refNo = 'LW-' . strtoupper(substr(uniqid(), -6));

        $visit = FieldVisit::create(array_merge($validated, [
            'entrepreneur_id' => $entrepreneur->id,
            'officer_id'      => $user?->id,
            'branch_id'       => $user?->branch_id,
            'ref_no'          => $refNo,
            'status'          => 'Dijadualkan',
        ]));

        return response()->json([
            'message' => 'Lawatan lapangan berjaya dijadualkan.',
            'visit'   => $visit,
        ], 201);
    }

    // ── POST /api/entrepreneurs/visits/{id}/report ────────────────────────────

    public function visitReport(Request $request, string $id)
    {
        $visit = FieldVisit::findOrFail($id);

        $validated = $request->validate([
            'checklist_items' => 'nullable|array',
            'observations'    => 'nullable|string',
            'outcome'         => 'nullable|string',
        ]);

        $report = $this->service->generateVisitReport($visit, $validated);

        $visit->update([
            'checklist_items' => $validated['checklist_items'] ?? [],
            'observations'    => $validated['observations'] ?? null,
            'outcome'         => $validated['outcome'] ?? null,
            'ai_report'       => $report,
            'status'          => 'Selesai',
            'completed_at'    => now(),
        ]);

        return response()->json([
            'message'      => 'Laporan AI berjaya dijana.',
            'report'       => $report,
            'visit'        => $visit->fresh(),
            'generated_at' => now()->toISOString(),
            'ai_model'     => 'SPPT-AI',
        ]);
    }

    // ── GET /api/ai/entrepreneur-health/{id} ─────────────────────────────────

    public function aiHealth(string $id)
    {
        $entrepreneur = Entrepreneur::where('ref_no', $id)
            ->orWhere('id', is_numeric($id) ? (int) $id : 0)
            ->firstOrFail();

        $health = $this->service->computeHealthScore($entrepreneur);

        return response()->json(array_merge(
            ['entrepreneur_id' => $entrepreneur->ref_no, 'name' => $entrepreneur->name],
            $health
        ));
    }
    
    // ── POST /api/entrepreneurs/visits/{visitId}/report ──────────────────────
    public function generateVisitReport(Request $request, string $visitId)
    {
        $visit = FieldVisit::find($visitId);
        if (!$visit) {
            return response()->json(['message' => 'Lawatan tidak dijumpai.'], 404);
        }

        $html = '<h1>Laporan Lawatan Lapangan</h1>' .
                '<p><strong>ID Lawatan:</strong> ' . $visit->id . '</p>' .
                '<p><strong>Rujukan:</strong> ' . $visit->ref_no . '</p>' .
                '<p><strong>Tarikh:</strong> ' . $visit->scheduled_date . '</p>' .
                '<p><strong>Tujuan:</strong> ' . $visit->purpose . '</p>' .
                '<p><strong>Lokasi:</strong> ' . $visit->location . '</p>' .
                '<p><strong>Pemerhatian:</strong> ' . $visit->observations . '</p>' .
                '<p><strong>Hasil:</strong> ' . $visit->outcome . '</p>';

        $pdf = Pdf::loadHTML($html);
        $fileName = 'reports/visit-' . $visitId . '-' . time() . '.pdf';
        
        Storage::disk('public')->put($fileName, $pdf->output());

        return response()->json([
            'success'      => true,
            'visit_id'     => $visitId,
            'report_url'   => Storage::disk('public')->url($fileName),
            'generated_at' => now()->toISOString(),
        ]);
    }
}