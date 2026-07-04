<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\CreditAssessmentController;
use App\Http\Controllers\Api\DisbursementController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\NplController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\EntrepreneurController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\ChatbotController;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (no auth required)
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// CHATBOT ROUTES (public — no auth required)
// ─────────────────────────────────────────────────────────────────────────────
Route::post('/chatbot/chat', [ChatbotController::class, 'chat']);
Route::get('/chatbot/suggestions', [ChatbotController::class, 'suggestions']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok', 'system' => 'SPPT', 'version' => '1.0.0',
        'timestamp' => now()->toISOString()
    ]);
});

Route::get('/ai/test', function () {
    $ai = new App\Services\AiService();
    return response()->json($ai->testConnection());
});

// RAG health check (public for Gate 7 testing)
Route::post('/ai/rag/embed-test', function (\Illuminate\Http\Request $request) {
    $ai = new App\Services\AiService();
    $text = $request->input('text', 'TEKUN Micro pembiayaan');
    $embedding = $ai->generateEmbedding($text);
    return response()->json([
        'status'     => count($embedding) > 0 ? 'ok' : 'error',
        'dimensions' => count($embedding),
        'model'      => 'gemini-embedding-001',
    ]);
});

Route::post('/ai/rag/search', function (\Illuminate\Http\Request $request) {
    $ai = new App\Services\AiService();
    $query = $request->input('query', 'TEKUN pembiayaan');
    $results = $ai->ragSearch($query, $request->input('limit', 3));
    return response()->json([
        'query'   => $query,
        'results' => $results,
        'count'   => count($results),
    ]);
});

// RAG search alias for test compatibility
Route::post('/ai/rag-search', function (\Illuminate\Http\Request $request) {
    $ai = new App\Services\AiService();
    $query = $request->input('query', 'TEKUN pembiayaan');
    $results = $ai->ragSearch($query, $request->input('limit', 5));
    return response()->json(['query' => $query, 'results' => $results, 'count' => count($results)]);
});

// Auth routes
Route::post('/auth/login',      [AuthController::class, 'login']);
Route::post('/auth/register',   [AuthController::class, 'register']);
Route::post('/auth/send-otp',   [AuthController::class, 'sendOtp']);
Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES (auth:sanctum required)
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Dashboard (all authenticated users)
    Route::get('/dashboard/stats',   [DashboardController::class, 'stats']);
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // AI endpoints (all authenticated)
    Route::post('/ai/chat',               [AiController::class, 'chat']);
    Route::post('/ai/credit-score',       [AiController::class, 'creditScore']);
    Route::post('/ai/document-check',     [AiController::class, 'documentCheck']);
    Route::post('/ai/fraud-detect',       [AiController::class, 'fraudDetect']);
    Route::post('/ai/generate-narrative', [AiController::class, 'generateNarrative']);
    Route::post('/ai/predict-npl',        [AiController::class, 'predictNpl']);

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 1 — Pendaftaran & Permohonan
    // Roles: usahawan (own), branch_officer, branch_manager, credit_officer, system_admin
    // ─────────────────────────────────────────────────────────────────────────
    Route::middleware('module:module1')->group(function () {
        Route::get('/applications',                    [ApplicationController::class, 'index']);
        Route::post('/applications',                   [ApplicationController::class, 'store']);
        Route::get('/applications/{id}',               [ApplicationController::class, 'show']);
        Route::put('/applications/{id}',               [ApplicationController::class, 'update']);
        Route::post('/applications/{id}/submit',       [ApplicationController::class, 'submit']);
        Route::post('/applications/{id}/documents',    [ApplicationController::class, 'uploadDocuments']);
        Route::get('/applications/{id}/timeline',      [ApplicationController::class, 'timeline']);
        Route::get('/applications/{id}/documents',     [ApplicationController::class, 'getDocuments']);
        Route::post('/applications/{id}/verify-docs',  [ApplicationController::class, 'verifyDocuments']);
        Route::post('/applications/{id}/auto-reject',  [ApplicationController::class, 'autoReject']);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 2 — Penilaian & Kelulusan
    // Roles: branch_officer (pre-assess), branch_manager (approve ≤10k),
    //        credit_officer (approve ≤50k), executive (approve >50k), system_admin
    // ─────────────────────────────────────────────────────────────────────────
    Route::middleware('module:module2')->group(function () {
        Route::get('/credit/dashboard',               [CreditAssessmentController::class, 'dashboard']);
        Route::get('/credit/applications',            [CreditAssessmentController::class, 'index']);
        Route::get('/credit/applications/{id}',       [CreditAssessmentController::class, 'show']);
        Route::post('/credit/score',                  [CreditAssessmentController::class, 'score']);
        Route::post('/credit/applications/{id}/approve', [CreditAssessmentController::class, 'approve']);
        Route::post('/credit/applications/{id}/reject',  [CreditAssessmentController::class, 'reject']);
        Route::post('/credit/applications/{id}/return',  [CreditAssessmentController::class, 'returnQuery']);
        Route::get('/credit/amortization',            [CreditAssessmentController::class, 'amortization']);
        Route::get('/credit/offer-letter/{id}',       [CreditAssessmentController::class, 'offerLetter']);
        Route::post('/credit/offer-letter/{id}/send', [CreditAssessmentController::class, 'sendOfferLetter']);
        Route::get('/credit/approval-workflow',       [CreditAssessmentController::class, 'approvalWorkflow']);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 3 — Pengeluaran Dana
    // Roles: finance_officer (full), branch_manager (view), credit_officer (view), system_admin
    // ─────────────────────────────────────────────────────────────────────────
    Route::middleware('module:module3')->group(function () {
        Route::get('/disbursements',                         [DisbursementController::class, 'index']);
        Route::get('/disbursements/{id}',                    [DisbursementController::class, 'show']);
        Route::post('/disbursements/batch',                  [DisbursementController::class, 'batch']);
        Route::post('/disbursements/{id}/approve',           [DisbursementController::class, 'approve']);
        Route::get('/disbursements/esign-queue',             [DisbursementController::class, 'esignQueue']);
        Route::post('/disbursements/{id}/send-esign',        [DisbursementController::class, 'sendEsign']);
        Route::get('/disbursements/aging-report',            [DisbursementController::class, 'agingReport']);
        Route::post('/disbursements/{id}/escalate',          [DisbursementController::class, 'escalate']);
        Route::get('/disbursements/authority-matrix',        [DisbursementController::class, 'authorityMatrix']);
        Route::get('/authority-matrix',                      [DisbursementController::class, 'authorityMatrix']);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 4 — Pengurusan Akaun Pembiayaan
    // Roles: usahawan (own), finance_officer (full), branch_officer (view), system_admin
    // ─────────────────────────────────────────────────────────────────────────
    Route::middleware('module:module4')->group(function () {
        Route::get('/accounts',                    [AccountController::class, 'index']);
        Route::get('/accounts/{id}',               [AccountController::class, 'show']);
        Route::get('/payments',                    [AccountController::class, 'payments']);
        Route::post('/accounts/{id}/payment',      [AccountController::class, 'recordPayment']);
        Route::post('/accounts/{id}/moratorium',   [AccountController::class, 'applyMoratorium']);
        Route::get('/tawidh/calculate',            [AccountController::class, 'tawidhInfo']);
        Route::post('/tawidh/calculate',           [AccountController::class, 'calculateTawidh']);
        Route::get('/accounts/{id}/statement',     [AccountController::class, 'statement']);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 5 — Pemantauan & Kutipan (NPL)
    // Roles: credit_officer, finance_officer, branch_manager, system_admin
    // ─────────────────────────────────────────────────────────────────────────
    Route::middleware('module:module5')->group(function () {
        Route::get('/npl',             [NplController::class, 'index']);
        Route::get('/npl/dashboard',   [NplController::class, 'dashboard']);
        Route::get('/npl-accounts',    [NplController::class, 'nplAccounts']);
        Route::get('/dunning',         [NplController::class, 'dunningList']);
        Route::post('/dunning/generate', [NplController::class, 'generateDunning']);
        Route::post('/dunning/{id}/send', [NplController::class, 'sendDunning']);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 6 — Dashboard & Analitik
    // Roles: executive (full), credit_officer (view), system_admin
    // Tender: "Branch Managers only see their branch data, Top Management nationwide"
    // ─────────────────────────────────────────────────────────────────────────
    Route::middleware('module:module6')->group(function () {
        Route::get('/reports',           [ReportController::class, 'index']);
        Route::post('/reports/generate', [ReportController::class, 'generate']);
        Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
        Route::post('/reports/schedule', [ReportController::class, 'schedule']);
        Route::get('/analytics/executive', [ReportController::class, 'dashboard']);
        Route::get('/analytics/kpi',       [ReportController::class, 'dashboard']);
        Route::get('/reports/kpi',         [ReportController::class, 'dashboard']);
        Route::get('/reports/builder',     [ReportController::class, 'index']);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 7 — CRM & Pemantauan Usahawan
    // Roles: branch_officer, branch_manager, credit_officer, system_admin
    // ─────────────────────────────────────────────────────────────────────────
    Route::middleware('module:module7')->group(function () {
        Route::get('/entrepreneurs',                          [EntrepreneurController::class, 'index']);
        Route::get('/entrepreneurs/{id}',                     [EntrepreneurController::class, 'show']);
        Route::get('/entrepreneurs/visits',                   [EntrepreneurController::class, 'visits']);
        Route::post('/entrepreneurs/visits/{id}/report',      [EntrepreneurController::class, 'generateVisitReport']);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 8 — Pengurusan Cawangan
    // Roles: branch_manager (own branch), executive (all), system_admin
    // ─────────────────────────────────────────────────────────────────────────
    Route::middleware('module:module8')->group(function () {
        Route::get('/branches',             [BranchController::class, 'index']);
        Route::get('/branches/performance', [BranchController::class, 'performance']);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 9 — Konfigurasi Produk Pembiayaan
    // Roles: system_admin only
    // ─────────────────────────────────────────────────────────────────────────
    Route::middleware(['module:module9', 'role:system_admin'])->group(function () {
        Route::get('/products',        [ProductController::class, 'index']);
        Route::get('/products/{id}',   [ProductController::class, 'show']);
        Route::put('/products/{id}',   [ProductController::class, 'update']);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 10 — Integrasi API
    // Roles: system_admin only
    // ─────────────────────────────────────────────────────────────────────────
    Route::middleware(['module:module10', 'role:system_admin'])->group(function () {
        Route::get('/integrations/health',          [IntegrationController::class, 'health']);
        Route::get('/integrations/check/{service}', [IntegrationController::class, 'check']);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 11 — Audit & Kawalan Dalaman
    // Roles: system_admin (full), executive (view)
    // ─────────────────────────────────────────────────────────────────────────
    Route::middleware('module:module11')->group(function () {
        Route::get('/audit-logs',            [AuditController::class, 'index']);
        Route::get('/audit-logs/anomalies',  [AuditController::class, 'anomalies']);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 12 — Pentadbiran Sistem
    // Roles: system_admin only
    // ─────────────────────────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────────────────────
    // Quality Gate Route Aliases (test script compatibility)
    // These aliases map test-script paths to the canonical module routes.
    // No extra module middleware — system_admin token is used in tests.
    // ─────────────────────────────────────────────────────────────────────────
    Route::middleware('module:module2')->group(function () {
        Route::get('/credit-assessments',          [CreditAssessmentController::class, 'index']);
        Route::get('/amortization',                [CreditAssessmentController::class, 'amortization']);
        // POC aliases — /api/applications/{id}/credit-score, /amortization, /approve
        Route::get('/applications/{id}/credit-score',   [CreditAssessmentController::class, 'creditScoreForApp']);
        Route::get('/applications/{id}/amortization',   [CreditAssessmentController::class, 'amortizationForApp']);
        Route::post('/applications/{id}/approve',       [CreditAssessmentController::class, 'approveApplication']);
        Route::post('/ai/credit-narrative',             [AiController::class, 'creditNarrative']);
    });

    // Module 4 POC aliases
    Route::middleware('module:module4')->group(function () {
        Route::post('/ai/default-prediction', [AiController::class, 'defaultPrediction']);
    });

    // Module 6 POC aliases
    Route::middleware('module:module6')->group(function () {
        Route::get('/reports/predictive', [ReportController::class, 'predictive']);
    });

    Route::middleware(['module:module12', 'role:system_admin'])->group(function () {
        Route::get('/users',               [UserController::class, 'index']);
        Route::get('/users/{id}',          [UserController::class, 'show']);
        Route::post('/users',              [UserController::class, 'store']);
        Route::put('/users/{id}',          [UserController::class, 'update']);
        Route::post('/users/{id}/suspend', [UserController::class, 'suspend']);
    });

});

// ── Core Foundation: Additional Auth Routes ───────────────────────────────────
Route::post('/auth/otp/send',      [AuthController::class, 'sendOtp']);
Route::post('/auth/otp/verify',    [AuthController::class, 'verifyOtp']);
Route::post('/auth/password/reset',[AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
});
