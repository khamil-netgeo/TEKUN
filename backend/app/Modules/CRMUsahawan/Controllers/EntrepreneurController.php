<?php

namespace App\Modules\CRMUsahawan\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\CRMUsahawan\Models\Entrepreneur;
use App\Modules\CRMUsahawan\Models\FieldVisit;
use App\Modules\CRMUsahawan\Models\EntrepreneurKpiSnapshot;
use App\Modules\CRMUsahawan\Services\EntrepreneurService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Module 7 — CRM & Pemantauan Usahawan
 * EntrepreneurController — handles all entrepreneur CRM endpoints.
 */
class EntrepreneurController extends Controller
{
    public function __construct(private EntrepreneurService $service) {}

    // ── GET /api/entrepreneurs ────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = Entrepreneur::with(['branch:id,name,code', 'assignedOfficer:id,name'])
            ->orderBy('name');

        // Text search (name, ref_no, ic_no, business_name)
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('ref_no', 'ilike', "%{$search}%")
                  ->orWhere('ic_no', 'ilike', "%{$search}%")
                  ->orWhere('business_name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        // Filters
        if ($status = $request->input('financing_status')) {
            $query->where('financing_status', $status);
        }
        if ($distress = $request->input('distress_level')) {
            $query->where('distress_level', $distress);
        }
        if ($sector = $request->input('sector')) {
            $query->where('sector', $sector);
        }
        if ($state = $request->input('state')) {
            $query->where('state', $state);
        }
        if ($skim = $request->input('skim')) {
            $query->where('skim', $skim);
        }

        $perPage   = min((int) $request->input('per_page', 20), 100);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'data'         => $paginated->items(),
            'total'        => $paginated->total(),
            'per_page'     => $paginated->perPage(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'ai_search'    => (bool) $request->input('ai_search', false),
        ]);
    }

    // ── GET /api/entrepreneurs/{id} ───────────────────────────────────────────

    public function show(string $id)
    {
        $entrepreneur = Entrepreneur::with([
            'branch:id,name,code',
            'assignedOfficer:id,name',
        ])->where('ref_no', $id)->firstOrFail();

        // KPI trend (last 6 months)
        $kpiTrend = EntrepreneurKpiSnapshot::where('entrepreneur_id', $entrepreneur->id)
            ->orderBy('period', 'desc')
            ->limit(6)
            ->get(['period', 'revenue', 'expenses', 'profit', 'employee_count', 'sales_volume'])
            ->reverse()
            ->values();

        // Recent visits (last 5)
        $recentVisits = FieldVisit::where('entrepreneur_id', $entrepreneur->id)
            ->with('officer:id,name')
            ->orderBy('scheduled_date', 'desc')
            ->limit(5)
            ->get();

        // Compute business age
        $entrepreneur->business_age_years = $entrepreneur->business_start_date
            ? (int) now()->diffInYears($entrepreneur->business_start_date)
            : null;

        return response()->json([
            'entrepreneur'  => $entrepreneur,
            'kpi_trend'     => $kpiTrend,
            'recent_visits' => $recentVisits,
        ]);
    }

    // ── PUT /api/entrepreneurs/{id} ───────────────────────────────────────────

    public function update(Request $request, string $id)
    {
        $entrepreneur = Entrepreneur::where('ref_no', $id)->firstOrFail();

        $validated = $request->validate([
            'phone'            => 'nullable|string|max:20',
            'email'            => 'nullable|email|max:255',
            'monthly_revenue'  => 'nullable|numeric|min:0',
            'monthly_expenses' => 'nullable|numeric|min:0',
            'employee_count'   => 'nullable|integer|min:0',
            'notes'            => 'nullable|string|max:2000',
        ]);

        $entrepreneur->update($validated);

        return response()->json([
            'message'      => 'Profil usahawan dikemaskini.',
            'entrepreneur' => $entrepreneur->fresh(),
        ]);
    }

    // ── GET /api/entrepreneurs/{id}/visits ────────────────────────────────────

    public function getVisits(string $id)
    {
        $entrepreneur = Entrepreneur::where('ref_no', $id)->firstOrFail();

        $visits = FieldVisit::where('entrepreneur_id', $entrepreneur->id)
            ->with('officer:id,name')
            ->orderBy('scheduled_date', 'desc')
            ->get();

        return response()->json([
            'data'  => $visits,
            'total' => $visits->count(),
        ]);
    }

    // ── POST /api/entrepreneurs/{id}/visits ───────────────────────────────────

    public function storeVisit(Request $request, string $id)
    {
        $entrepreneur = Entrepreneur::where('ref_no', $id)->firstOrFail();

        $validated = $request->validate([
            'scheduled_date' => 'required|date|after_or_equal:today',
            'scheduled_time' => 'nullable|date_format:H:i',
            'purpose'        => 'required|string|max:255',
            'officer_id'     => 'nullable|integer|exists:users,id',
        ]);

        $officerId = $validated['officer_id'] ?? Auth::id();

        // Generate ref_no
        $lastVisit = FieldVisit::orderBy('id', 'desc')->first();
        $nextNum   = $lastVisit ? ($lastVisit->id + 1) : 1;
        $refNo     = 'LW-' . str_pad($nextNum, 4, '0', STR_PAD_LEFT);

        $visit = FieldVisit::create([
            'ref_no'          => $refNo,
            'entrepreneur_id' => $entrepreneur->id,
            'officer_id'      => $officerId,
            'branch_id'       => $entrepreneur->branch_id,
            'scheduled_date'  => $validated['scheduled_date'],
            'scheduled_time'  => $validated['scheduled_time'] ?? null,
            'purpose'         => $validated['purpose'],
            'status'          => 'Dijadualkan',
            'checklist_items' => [],
        ]);

        return response()->json([
            'message' => 'Lawatan lapangan berjaya dijadualkan.',
            'visit'   => $visit->load('officer:id,name'),
        ], 201);
    }

    // ── POST /api/entrepreneurs/visits/{visitId}/report ───────────────────────

    public function generateVisitReport(Request $request, int $visitId)
    {
        $visit = FieldVisit::with(['entrepreneur', 'officer:id,name'])->findOrFail($visitId);

        // Allow report generation for completed visits or when forced
        if ($visit->status !== 'Selesai' && !$request->boolean('force')) {
            return response()->json([
                'message' => 'Laporan hanya boleh dijana untuk lawatan yang telah selesai.',
            ], 422);
        }

        // Update visit data if provided
        $updates = array_filter([
            'visit_notes'        => $request->input('visit_notes'),
            'business_condition' => $request->input('business_condition'),
            'reported_revenue'   => $request->input('reported_revenue'),
            'reported_expenses'  => $request->input('reported_expenses'),
            'reported_employees' => $request->input('reported_employees'),
            'actual_date'        => $request->input('actual_date'),
            'status'             => 'Selesai',
        ], fn($v) => $v !== null);

        if (!empty($updates)) {
            $visit->update($updates);
            $visit->refresh();
        }

        // Generate AI report via service
        $report = $this->service->generateVisitReport($visit);

        $visit->update([
            'ai_report'              => $report,
            'ai_report_generated_at' => now(),
            'has_ai_report'          => true,
        ]);

        return response()->json([
            'report'       => $report,
            'generated_at' => now()->toISOString(),
            'ai_model'     => 'SPPT-AI',
            'visit_id'     => $visit->id,
            'visit_ref'    => $visit->ref_no,
        ]);
    }

    // ── GET /api/ai/entrepreneur-health/{id} ─────────────────────────────────

    public function aiHealth(string $id)
    {
        $entrepreneur = Entrepreneur::where('ref_no', $id)->firstOrFail();

        $result = $this->service->computeHealthScore($entrepreneur);

        // Derive health badge from score
        $healthBadge = match(true) {
            $result['score'] >= 70 => 'Sihat',
            $result['score'] >= 50 => 'Sederhana',
            $result['score'] >= 30 => 'Lemah',
            default               => 'Kritikal',
        };

        // Persist the updated score
        $entrepreneur->update([
            'health_score'        => $result['score'],
            'distress_level'      => $result['distress_level'],
            'default_probability' => $result['default_probability'],
            'ai_factors'          => $result['factors'],
            'ai_score_updated_at' => now(),
        ]);

        return response()->json([
            'entrepreneur_id'     => $entrepreneur->id,
            'ref_no'              => $entrepreneur->ref_no,
            'score'               => $result['score'],
            'distress_level'      => $result['distress_level'],
            'health_badge'        => $healthBadge,
            'default_probability' => $result['default_probability'],
            'factors'             => $result['factors'],
            'updated_at'          => now()->toISOString(),
        ]);
    }
}
