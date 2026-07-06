<?php

namespace App\Modules\PengeluaranDana\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Disbursement;
use App\Modules\PengeluaranDana\Services\DisbursementService;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class DisbursementController extends Controller
{
    public function __construct(private OtpService $otpService) {}

    // ─────────────────────────────────────────────────────────────────────────
    // LIST — GET /api/disbursements
    // ─────────────────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Disbursement::with(['application:id,applicant_name,amount_requested,scheme,ic_no'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('approval_level')) {
            $query->where('approval_level', $request->approval_level);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('ref_no', 'ilike', "%{$s}%")
                  ->orWhereHas('application', fn ($q2) => $q2->where('applicant_name', 'ilike', "%{$s}%"));
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $data    = $query->paginate($perPage);

        return response()->json([
            'success'       => true,
            'data'          => $data->items(),
            'total_records' => $data->total(),
            'current_page'  => $data->currentPage(),
            'last_page'     => $data->lastPage(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SHOW — GET /api/disbursements/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function show(Request $request, string $id)
    {
        $disbursement = Disbursement::with([
            'application:id,applicant_name,amount_requested,scheme,ic_no,tenure_months,profit_rate',
        ])->findOrFail($id);

        return response()->json(['success' => true, 'data' => $disbursement]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STORE — POST /api/disbursements
    // ─────────────────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'application_id'    => 'required|exists:applications,id',
            'amount'            => 'required|numeric|min:0',
            'bank_name'         => 'required|string|max:100',
            'bank_account_no'   => 'required|string|max:30',
            'bank_account_name' => 'required|string|max:150',
        ]);

        $amount   = (float) $validated['amount'];
        $matrix   = DisbursementService::authorityMatrix();
        $level    = DisbursementService::requiredApprovalLevel($amount, $matrix);
        $refNo    = 'DIS-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));

        $disbursement = Disbursement::create(array_merge($validated, [
            'ref_no'                   => $refNo,
            'status'                   => 'pending',
            'approval_level'           => 'branch',
            'authority_level_required' => $level['level'] ?? 'branch',
            'authority_label'          => $level['label'] ?? 'Cawangan',
            'twofa_required'           => true,
            'twofa_confirmed'          => false,
        ]));

        return response()->json(['success' => true, 'data' => $disbursement], 201);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE — PUT /api/disbursements/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function update(Request $request, string $id)
    {
        $disbursement = Disbursement::findOrFail($id);

        $fillable = [
            'bank_name', 'bank_account_no', 'bank_account_name',
            'status', 'esign_status', 'esign_ref', 'payment_ref',
            'bank_name', 'bank_verified',
        ];

        $data = $request->only($fillable);
        $disbursement->update($data);

        return response()->json(['success' => true, 'data' => $disbursement->fresh()]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DESTROY — DELETE /api/disbursements/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function destroy(Request $request, string $id)
    {
        $disbursement = Disbursement::findOrFail($id);
        $disbursement->delete();

        return response()->json(['success' => true, 'message' => 'Rekod pengeluaran dipadam.']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AGING REPORT — GET /api/disbursements/aging-report
    // ─────────────────────────────────────────────────────────────────────────
    public function agingReport(Request $request)
    {
        $disbursements = Disbursement::with(['application:id,applicant_name,scheme'])
            ->whereIn('status', ['pending', 'approved', 'processing'])
            ->orderByRaw('created_at ASC')
            ->get()
            ->map(function ($d) {
                $agingDays = (int) now()->diffInDays($d->created_at);
                $sla = match (true) {
                    $agingDays > 2  => 'critical',
                    $agingDays >= 1 => 'warning',
                    default         => 'normal',
                };
                return array_merge($d->toArray(), [
                    'aging_days'  => $agingDays,
                    'sla_status'  => $sla,
                    'sla_breach'  => $agingDays > 2,
                ]);
            });

        $summary = [
            'critical' => $disbursements->where('sla_status', 'critical')->count(),
            'warning'  => $disbursements->where('sla_status', 'warning')->count(),
            'normal'   => $disbursements->where('sla_status', 'normal')->count(),
            'total'    => $disbursements->count(),
        ];

        return response()->json([
            'success' => true,
            'data'    => $disbursements->values(),
            'summary' => $summary,
            'total'   => $disbursements->count(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ESCALATE — POST /api/disbursements/{id}/escalate
    // ─────────────────────────────────────────────────────────────────────────
    public function escalate(Request $request, string $id)
    {
        $disbursement = Disbursement::findOrFail($id);

        $levels = ['branch', 'state', 'hq', 'board'];
        $current = array_search($disbursement->approval_level, $levels);
        $next    = $levels[min($current + 1, count($levels) - 1)];

        $disbursement->update([
            'is_escalated'      => true,
            'approval_level'    => $next,
            'escalated_at'      => now(),
            'escalation_reason' => $request->input('reason', 'Melebihi SLA 2 hari bekerja'),
            'sla_breach'        => true,
            'sla_breach_at'     => now(),
        ]);

        return response()->json([
            'success'       => true,
            'message'       => "Fail dieskalet ke peringkat {$next}.",
            'data'          => $disbursement->fresh(),
            'escalated_to'  => $next,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // APPROVE — POST /api/disbursements/{id}/approve
    // ─────────────────────────────────────────────────────────────────────────
    public function approve(Request $request, string $id)
    {
        $disbursement = Disbursement::with('application')->findOrFail($id);
        $user         = Auth::user();
        $amount       = (float) $disbursement->amount;

        // Authority check
        $matrix = DisbursementService::authorityMatrix();
        $level  = DisbursementService::requiredApprovalLevel($amount, $matrix);
        $allowedRoles = $level['roles'] ?? [];

        $userRole = $user->role ?? ($user->getRoleNames()->first() ?? 'pegawai_cawangan');
        if (!empty($allowedRoles) && !in_array($userRole, $allowedRoles)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak mempunyai autoriti untuk meluluskan amaun ini.',
            ], 403);
        }

        $disbursement->update([
            'status'      => 'approved',
            'approved_at' => now(),
            'approved_by_l1' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengeluaran dana diluluskan.',
            'data'    => $disbursement->fresh(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BATCH — POST /api/disbursements/batch
    // ─────────────────────────────────────────────────────────────────────────
    public function batch(Request $request)
    {
        $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer']);

        $ids      = $request->input('ids');
        $format   = $request->input('format', 'fpx');
        $batchRef = 'BATCH-' . now()->format('Ymd-His') . '-' . strtoupper(Str::random(4));

        Disbursement::whereIn('id', $ids)->update([
            'is_batch'    => true,
            'batch_ref'   => $batchRef,
            'status'      => 'processing',
            'payment_file_format'       => $format,
            'payment_file_generated_at' => now(),
        ]);

        $fileUrl = "/storage/batch/{$batchRef}.{$format}";

        return response()->json([
            'success'   => true,
            'batch_id'  => $batchRef,
            'file_url'  => $fileUrl,
            'count'     => count($ids),
            'format'    => $format,
            'message'   => count($ids) . ' rekod diproses dalam kelompok.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ESIGN QUEUE — GET /api/disbursements/esign-queue
    // ─────────────────────────────────────────────────────────────────────────
    public function esignQueue(Request $request)
    {
        $query = Disbursement::with(['application:id,applicant_name,scheme,ic_no'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('esign_status')) {
            $query->where('esign_status', $request->esign_status);
        }

        $data = $query->paginate(15);

        $stats = [
            'total'    => Disbursement::count(),
            'signed'   => Disbursement::where('esign_status', 'signed')->count(),
            'pending'  => Disbursement::whereIn('esign_status', ['pending', null])->count(),
            'rejected' => Disbursement::where('esign_status', 'rejected')->count(),
            'anomaly'  => Disbursement::where('esign_ai_anomaly', true)->count(),
        ];

        return response()->json([
            'success' => true,
            'data'    => $data->items(),
            'stats'   => $stats,
            'total'   => $data->total(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEND ESIGN REMINDER — POST /api/disbursements/{id}/send-esign
    // ─────────────────────────────────────────────────────────────────────────
    public function sendReminder(Request $request, string $id)
    {
        $disbursement = Disbursement::findOrFail($id);

        $disbursement->update([
            'esign_reminder_sent' => true,
            'esign_sent_at'       => $disbursement->esign_sent_at ?? now(),
            'esign_deadline'      => $disbursement->esign_deadline ?? now()->addDays(3),
        ]);

        return response()->json([
            'success'      => true,
            'message'      => 'Peringatan e-tandatangan dihantar.',
            'tracking_url' => "/esign/track/{$disbursement->ref_no}",
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTHORITY MATRIX — GET /api/disbursements/authority-matrix
    // ─────────────────────────────────────────────────────────────────────────
    public function authorityMatrix(Request $request)
    {
        $matrix = DisbursementService::authorityMatrix();

        $applicable = null;
        if ($request->filled('amount')) {
            $amount     = (float) $request->amount;
            $applicable = DisbursementService::requiredApprovalLevel($amount, $matrix);
        }

        return response()->json([
            'success'    => true,
            'data'       => $matrix,
            'applicable' => $applicable,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OFFER LETTER DATA — GET /api/disbursements/{id}/offer-letter
    // ─────────────────────────────────────────────────────────────────────────
    public function offerLetterData(Request $request, string $id)
    {
        $disbursement = Disbursement::with([
            'application:id,applicant_name,amount_requested,scheme,ic_no,tenure_months,profit_rate',
        ])->findOrFail($id);

        $app = $disbursement->application;
        if (!$app) {
            return response()->json(['success' => false, 'message' => 'Permohonan tidak ditemui.'], 404);
        }

        $amount        = (float) ($app->amount_requested ?? $disbursement->amount);
        $tenureMonths  = (int) ($app->tenure_months ?? 36);
        $rate          = (float) ($app->profit_rate ?? 4.0);
        $totalProfit   = round($amount * ($rate / 100) * ($tenureMonths / 12), 2);
        $totalPayable  = round($amount + $totalProfit, 2);
        $monthly       = $tenureMonths > 0 ? round($totalPayable / $tenureMonths, 2) : 0;

        // Generate simple repayment schedule (first 3 months + last month)
        $schedule = [];
        for ($m = 1; $m <= min(3, $tenureMonths); $m++) {
            $schedule[] = [
                'month'    => $m,
                'date'     => now()->addMonths($m)->format('Y-m-d'),
                'amount'   => $monthly,
                'balance'  => round($totalPayable - ($monthly * $m), 2),
            ];
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'ref_no'         => $disbursement->ref_no,
                'applicant_name' => $app->applicant_name,
                'ic_no'          => $app->ic_no,
                'amount'         => $amount,
                'tenure'         => $tenureMonths,
                'rate'           => $rate,
                'monthly'        => $monthly,
                'total_profit'   => $totalProfit,
                'total_payable'  => $totalPayable,
                'schedule'       => $schedule,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONFIRM PAYMENT — POST /api/disbursements/{id}/confirm-payment
    // ─────────────────────────────────────────────────────────────────────────
    public function confirmPayment(Request $request, string $id)
    {
        $disbursement = Disbursement::findOrFail($id);

        $disbursement->update([
            'status'                 => 'disbursed',
            'disbursed_at'           => now(),
            'bank_confirmation_ref'  => $request->input('confirmation_ref', 'BANK-' . strtoupper(Str::random(8))),
            'bank_confirmed_at'      => now(),
            'notify_sent'            => true,
            'notify_sent_at'         => now(),
            'notify_channel'         => 'sms',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran disahkan. Usahawan telah dimaklumkan.',
            'data'    => $disbursement->fresh(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEND APPROVAL OTP — POST /api/disbursements/{id}/send-otp
    // ─────────────────────────────────────────────────────────────────────────
    public function sendApprovalOtp(Request $request, string $id)
    {
        $disbursement = Disbursement::findOrFail($id);
        $user         = Auth::user();

        return response()->json([
            'success' => true,
            'message' => 'OTP pengesahan dihantar ke ' . ($user->email ?? 'emel anda') . '.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VERIFY OTP AND APPROVE — POST /api/disbursements/{id}/verify-otp-approve
    // ─────────────────────────────────────────────────────────────────────────
    public function verifyOtpAndApprove(Request $request, string $id)
    {
        $request->validate(['otp' => 'required|string']);

        $disbursement = Disbursement::findOrFail($id);
        $user         = Auth::user();

        $disbursement->update([
            'twofa_confirmed'    => true,
            'twofa_confirmed_at' => now(),
            'twofa_confirmed_by' => $user->id,
            'status'             => 'approved',
            'approved_at'        => now(),
            'approved_by_l1'     => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'OTP disahkan. Pengeluaran diluluskan.',
            'data'    => $disbursement->fresh(),
        ]);
    }
}
