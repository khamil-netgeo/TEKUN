<?php

namespace App\Modules\PengurusanAkaun\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PengurusanAkaun\Services\AiDefaultPredictionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Module 4 — AI Default Prediction Controller
 * POST /api/ai/default-prediction
 */
class AiAccountController extends Controller
{
    public function __construct(
        private AiDefaultPredictionService $aiService
    ) {}

    /**
     * POST /api/ai/default-prediction
     * Predict probability of default in next 3 months.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function defaultPrediction(Request $request): JsonResponse
    {
        $request->validate([
            'account_id'        => 'nullable|integer',
            'arrears_days'      => 'nullable|integer|min:0',
            'arrears_amount'    => 'nullable|numeric|min:0',
            'outstanding_balance' => 'nullable|numeric|min:0',
            'payments_missed'   => 'nullable|integer|min:0',
            'classification'    => 'nullable|string',
            'monthly_income'    => 'nullable|numeric|min:0',
            'monthly_instalment'=> 'nullable|numeric|min:0',
        ]);

        $data = $request->only([
            'account_id', 'arrears_days', 'arrears_amount',
            'outstanding_balance', 'payments_missed', 'classification',
            'monthly_income', 'monthly_instalment',
        ]);

        $result = $this->aiService->predictFromData($data);

        return response()->json([
            'success' => true,
            'data'    => $result,
        ]);
    }
}
