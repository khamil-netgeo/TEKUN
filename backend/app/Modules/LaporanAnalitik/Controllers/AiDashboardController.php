<?php

namespace App\Modules\LaporanAnalitik\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\LaporanAnalitik\Models\AiDashboardConfig;
use App\Modules\LaporanAnalitik\Services\AnalyticsService;
use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Module 6 — AI Dynamic Dashboard Builder
 *
 * Endpoints:
 *   POST /api/ai/dashboard/generate
 *   GET  /api/ai/dashboard/configs
 *   GET  /api/ai/dashboard/configs/{id}
 *   DELETE /api/ai/dashboard/configs/{id}
 */
class AiDashboardController extends Controller
{
    public function __construct(
        private AiService $ai,
        private AnalyticsService $analytics
    ) {}

    /**
     * POST /api/ai/dashboard/generate
     * Accept a natural language prompt and return a widget configuration JSON.
     */
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'prompt' => 'required|string|min:5|max:500',
            'save'   => 'sometimes|boolean',
            'name'   => 'sometimes|string|max:100',
        ]);

        $prompt = $request->input('prompt');
        $user   = $request->user();

        try {
            // Step 1: Fetch real KPI data from DB to provide context
            $kpiData    = $this->analytics->getKpiSnapshot();
            $branchData = $this->analytics->getBranchPerformance();
            $trendData  = $this->analytics->getTrends('monthly');

            // Step 2: RAG search for relevant knowledge base context
            $ragContext = $this->ai->ragSearch($prompt, 3);
            $ragText    = '';
            if (!empty($ragContext)) {
                $ragText = "\n\nKonteks dari pangkalan pengetahuan TEKUN:\n";
                foreach ($ragContext as $chunk) {
                    $ragText .= '- ' . ($chunk['content'] ?? '') . "\n";
                }
            }

            // Step 3: Build system prompt with real data context
            $systemPrompt = "Anda adalah SPPT AI, sistem analitik pintar TEKUN Nasional Malaysia.
Pengguna meminta papan pemuka dinamik berdasarkan arahan berikut: \"{$prompt}\"

Data semasa sistem SPPT:
- Jumlah Portfolio: RM " . number_format($kpiData['total_portfolio'] / 1_000_000, 1) . " juta
- Kadar Kelulusan: {$kpiData['approval_rate']}%
- Nisbah NPL: {$kpiData['npl_ratio']}%
- Agihan Bulan Ini: RM " . number_format($kpiData['disbursement_volume'] / 1_000_000, 1) . " juta
- Jumlah Permohonan: {$kpiData['total_applications']}
- Akaun Aktif: {$kpiData['active_accounts']}
{$ragText}

Berdasarkan arahan pengguna dan data di atas, jana konfigurasi widget JSON untuk papan pemuka.
Kembalikan HANYA JSON yang sah (tiada markdown, tiada penjelasan) dalam format berikut:

{
  \"dashboard_title\": \"string (tajuk papan pemuka dalam BM)\",
  \"summary\": \"string (ringkasan 1 ayat tentang papan pemuka ini)\",
  \"widgets\": [
    {
      \"id\": \"string (unik, cth: widget_1)\",
      \"type\": \"stat_card|line_chart|bar_chart|pie_chart|table|alert_panel\",
      \"title\": \"string (tajuk widget dalam BM)\",
      \"size\": \"small|medium|large|full\",
      \"data_source\": \"string (nama sumber data: kpi|trends|branches|applications|accounts)\",
      \"config\": {
        \"metric\": \"string (nama metrik utama)\",
        \"value\": \"string atau number (nilai semasa)\",
        \"unit\": \"string (unit: RM|%|unit)\",
        \"trend\": \"up|down|neutral\",
        \"color\": \"green|orange|red|navy|purple\",
        \"chart_data\": [] (array data untuk chart, jika berkaitan),
        \"columns\": [] (array nama lajur untuk table, jika berkaitan),
        \"rows\": [] (array data baris untuk table, jika berkaitan)
      },
      \"ai_insight\": \"string (pandangan AI tentang widget ini, dalam BM)\"
    }
  ],
  \"ai_narrative\": \"string (naratif eksekutif AI tentang keseluruhan papan pemuka, 2-3 ayat dalam BM)\",
  \"generated_at\": \"" . now()->toISOString() . "\",
  \"confidence\": number (0.0-1.0)
}

Pastikan widget_config mengandungi data sebenar dari konteks yang diberikan. Jana 3-5 widget yang relevan.";

            $response    = $this->ai->callAiEngine($systemPrompt);
            $rawText     = $response;
            $cleanedText = preg_replace('/```json\s*|\s*```/', '', trim($rawText));
            $widgetConfig = json_decode($cleanedText, true);

            if (!$widgetConfig || !isset($widgetConfig['widgets'])) {
                // Fallback: return a default KPI dashboard config
                $widgetConfig = $this->getDefaultDashboardConfig($kpiData, $prompt);
            }

            // Step 4: Save config if requested
            $savedConfig = null;
            if ($request->boolean('save', false)) {
                $savedConfig = AiDashboardConfig::create([
                    'user_id'       => $user->id,
                    'name'          => $request->input('name', $widgetConfig['dashboard_title'] ?? 'Papan Pemuka AI'),
                    'prompt'        => $prompt,
                    'widget_config' => $widgetConfig,
                    'status'        => 'active',
                ]);
            }

            return response()->json([
                'success'      => true,
                'data'         => $widgetConfig,
                'saved_config' => $savedConfig ? ['id' => $savedConfig->id, 'name' => $savedConfig->name] : null,
                'rag_used'     => !empty($ragContext),
                'model'        => 'SPPT AI',
            ]);

        } catch (\Exception $e) {
            Log::error('AiDashboardController::generate error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ralat semasa menjana papan pemuka AI. Sila cuba lagi.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/ai/dashboard/configs
     * List saved dashboard configurations for the authenticated user.
     */
    public function listConfigs(Request $request): JsonResponse
    {
        $configs = AiDashboardConfig::where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->orderByDesc('updated_at')
            ->get(['id', 'name', 'prompt', 'use_count', 'last_used_at', 'created_at']);

        return response()->json([
            'success' => true,
            'data'    => $configs,
        ]);
    }

    /**
     * GET /api/ai/dashboard/configs/{id}
     * Get a specific saved dashboard configuration.
     */
    public function getConfig(Request $request, int $id): JsonResponse
    {
        $config = AiDashboardConfig::where('user_id', $request->user()->id)
            ->findOrFail($id);

        // Increment use count
        $config->increment('use_count');
        $config->update(['last_used_at' => now()]);

        return response()->json([
            'success' => true,
            'data'    => $config,
        ]);
    }

    /**
     * DELETE /api/ai/dashboard/configs/{id}
     * Archive (soft delete) a saved dashboard configuration.
     */
    public function deleteConfig(Request $request, int $id): JsonResponse
    {
        $config = AiDashboardConfig::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $config->update(['status' => 'archived']);
        $config->delete();

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi papan pemuka telah diarkib.',
        ]);
    }

    /**
     * Fallback default dashboard config when AI generation fails.
     */
    private function getDefaultDashboardConfig(array $kpiData, string $prompt): array
    {
        return [
            'dashboard_title' => 'Papan Pemuka Eksekutif TEKUN',
            'summary'         => 'Gambaran keseluruhan prestasi portfolio pembiayaan TEKUN Nasional.',
            'widgets'         => [
                [
                    'id'          => 'widget_1',
                    'type'        => 'stat_card',
                    'title'       => 'Jumlah Portfolio',
                    'size'        => 'medium',
                    'data_source' => 'kpi',
                    'config'      => [
                        'metric' => 'total_portfolio',
                        'value'  => 'RM ' . number_format($kpiData['total_portfolio'] / 1_000_000, 1) . 'J',
                        'unit'   => 'RM',
                        'trend'  => 'up',
                        'color'  => 'navy',
                    ],
                    'ai_insight' => 'Portfolio pembiayaan kekal stabil dengan pertumbuhan positif.',
                ],
                [
                    'id'          => 'widget_2',
                    'type'        => 'stat_card',
                    'title'       => 'Kadar Kelulusan',
                    'size'        => 'medium',
                    'data_source' => 'kpi',
                    'config'      => [
                        'metric' => 'approval_rate',
                        'value'  => $kpiData['approval_rate'],
                        'unit'   => '%',
                        'trend'  => 'up',
                        'color'  => 'green',
                    ],
                    'ai_insight' => 'Kadar kelulusan menunjukkan prestasi yang baik.',
                ],
                [
                    'id'          => 'widget_3',
                    'type'        => 'stat_card',
                    'title'       => 'Nisbah NPL',
                    'size'        => 'medium',
                    'data_source' => 'kpi',
                    'config'      => [
                        'metric' => 'npl_ratio',
                        'value'  => $kpiData['npl_ratio'],
                        'unit'   => '%',
                        'trend'  => 'neutral',
                        'color'  => $kpiData['npl_ratio'] > 3 ? 'red' : 'orange',
                    ],
                    'ai_insight' => 'Nisbah NPL perlu dipantau secara berterusan.',
                ],
            ],
            'ai_narrative'  => 'Papan pemuka ini menunjukkan prestasi semasa portfolio TEKUN Nasional berdasarkan data terkini dari sistem SPPT.',
            'generated_at'  => now()->toISOString(),
            'confidence'    => 0.75,
        ];
    }
}
