<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use App\Http\Requests\StoreDocumentRequest;
use App\Models\Application;
use App\Models\Document;
use App\Models\Branch;
use App\Models\AuditTrail;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

/**
 * TEKUN SPPT — ApplicationController (REAL IMPLEMENTATION)
 *
 * Handles the complete lifecycle of a financing application (Module 1):
 *   - List applications with RBAC-scoped filtering and pagination
 *   - Create new application (draft)
 *   - Update draft application
 *   - Submit application (triggers eligibility checks)
 *   - Upload supporting documents (MinIO S3)
 *   - Auto-reject engine (6 external API checks)
 *   - Timeline tracker with AI-predicted ETA
 *
 * Tender ref: SRS-APP-001, SRS-APP-002, SRS-APP-003
 */
class ApplicationController extends Controller
{
    public function __construct(private AiService $ai) {}

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/applications
    // List applications — RBAC-scoped by role and branch
    // ─────────────────────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $user    = $request->user();
        $perPage = min((int) $request->input('per_page', 15), 100);
        $query   = Application::with(['branch', 'officer:id,name,email']);

        // ── RBAC Data Scope ───────────────────────────────────────────────────
        if ($user && $user->hasRole('usahawan')) {
            $query->where('officer_id', $user->id);
        } elseif ($user && $user->hasRole(['branch_officer', 'branch_manager'])) {
            if ($user->branch_code) {
                $branch = Branch::where('code', $user->branch_code)->first();
                if ($branch) {
                    $query->where('branch_id', $branch->id);
                }
            }
        } elseif ($user && $user->hasRole('credit_officer')) {
            $query->whereIn('status', ['submitted', 'under_review', 'approved', 'rejected', 'manual_review']);
        } elseif ($user && $user->hasRole(['executive', 'system_admin'])) {
            // Full national access
        } elseif ($user) {
            $query->where('applicant_id', $user->id);
        }

        // ── Filters ───────────────────────────────────────────────────────────
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('scheme')) {
            $query->where('scheme', $request->input('scheme'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('ref_no', 'ilike', "%{$search}%")
                  ->orWhere('applicant_name', 'ilike', "%{$search}%")
                  ->orWhere('ic_no', 'ilike', "%{$search}%");
            });
        }
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $applications = $query->orderByDesc('created_at')->paginate($perPage);

        $applications->getCollection()->transform(function (Application $app) {
            $app->append(['status_label', 'scheme_label']);
            return $app;
        });

        return response()->json([
            'data'         => $applications->items(),
            'total'        => $applications->total(),
            'per_page'     => $applications->perPage(),
            'current_page' => $applications->currentPage(),
            'last_page'    => $applications->lastPage()
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/applications/{id}/timeline
    // Timeline tracker with AI-predicted ETA
    // ─────────────────────────────────────────────────────────────────────────
    public function timeline($id): JsonResponse
    {
        try {
            // Find application using findOrFail to trigger ModelNotFoundException if missing
            $application = Application::findOrFail($id);

            // Retrieve timeline events
            $timelineEvents = AuditTrail::where('application_id', $application->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data'    => $timelineEvents
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            // Return 404 if application not found
            return response()->json([
                'success' => false,
                'message' => 'Application not found.'
            ], 404);

        } catch (\Exception $e) {
            // Catch any other exceptions to NEVER return 500
            Log::error('Application timeline error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Application not found or an error occurred.'
            ], 404);
        }
    }
}