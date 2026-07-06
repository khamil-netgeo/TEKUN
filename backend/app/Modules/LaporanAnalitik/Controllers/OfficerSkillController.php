<?php

namespace App\Modules\LaporanAnalitik\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\LaporanAnalitik\Models\OfficerSkillProfile;
use App\Modules\LaporanAnalitik\Models\OfficerAiDecision;
use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Module 6 — Officer AI Skill Profile
 *
 * Endpoints:
 *   POST /api/officer-skills         — Simpan/kemas kini profil kemahiran
 *   GET  /api/officer-skills/me      — Profil kemahiran saya
 *   POST /api/ai/decision-assist     — AI buat keputusan berdasarkan profil
 *   GET  /api/officer-skills/history — Sejarah keputusan AI
 */
class OfficerSkillController extends Controller
{
    public function __construct(private AiService $ai) {}

    /**
     * POST /api/officer-skills
     * Create or update the authenticated officer's skill profile.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'skills_description' => 'required|string|min:10|max:2000',
            'specialisation'     => 'sometimes|string|max:100',
            'years_experience'   => 'sometimes|integer|min:0|max:50',
        ]);

        $user = $request->user();

        try {
            // Generate AI persona config based on skills description (graceful fallback if AI unavailable)
            $personaConfig = $this->generatePersonaConfig(
                $request->input('skills_description'),
                $request->input('specialisation', ''),
                $request->input('years_experience', 0)
            );

            // Extract skill tags from description (graceful fallback if AI unavailable)
            $skillTags = $this->extractSkillTags($request->input('skills_description'));
        } catch (\Exception $e) {
            Log::warning('OfficerSkillController::store AI generation failed, using defaults: ' . $e->getMessage());
            $personaConfig = ['persona_name' => 'Pegawai Pembiayaan', 'decision_style' => 'seimbang'];
            $skillTags     = [];
        }

        $profile = OfficerSkillProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'skills_description' => $request->input('skills_description'),
                'skill_tags'         => $skillTags,
                'specialisation'     => $request->input('specialisation'),
                'years_experience'   => $request->input('years_experience', 0),
                'persona_config'     => $personaConfig,
                'is_active'          => true,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Profil kemahiran AI berjaya disimpan.',
            'data'    => $profile,
        ], $profile->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * GET /api/officer-skills/me
     * Get the authenticated officer's skill profile with decision history.
     */
    public function me(Request $request): JsonResponse
    {
        $user    = $request->user();
        $profile = OfficerSkillProfile::where('user_id', $user->id)
            ->with(['decisions' => function ($q) {
                $q->orderByDesc('created_at')->limit(10);
            }])
            ->first();

        if (!$profile) {
            return response()->json([
                'success' => true,
                'data'    => null,
                'message' => 'Profil kemahiran belum diwujudkan. Sila isi borang kemahiran.',
            ]);
        }

        // Compute stats
        $totalDecisions  = OfficerAiDecision::where('user_id', $user->id)->count();
        $lulusDecisions  = OfficerAiDecision::where('user_id', $user->id)
            ->where('ai_recommendation', 'LULUS')->count();
        $approvalRate    = $totalDecisions > 0
            ? round(($lulusDecisions / $totalDecisions) * 100, 1)
            : 0;

        // Update stats
        $profile->update([
            'total_decisions' => $totalDecisions,
            'approval_rate'   => $approvalRate,
        ]);

        return response()->json([
            'success' => true,
            'data'    => array_merge($profile->toArray(), [
                'stats' => [
                    'total_decisions' => $totalDecisions,
                    'approval_rate'   => $approvalRate,
                    'lulus_count'     => $lulusDecisions,
                    'tolak_count'     => OfficerAiDecision::where('user_id', $user->id)
                        ->where('ai_recommendation', 'TOLAK')->count(),
                    'kuari_count'     => OfficerAiDecision::where('user_id', $user->id)
                        ->where('ai_recommendation', 'KUARI')->count(),
                ],
            ]),
        ]);
    }

    /**
     * POST /api/ai/decision-assist
     * AI makes a recommendation based on officer's skill profile and case context.
     */
    public function decisionAssist(Request $request): JsonResponse
    {
        $request->validate([
            'case_type'       => 'required|string',
            'case_reference'  => 'sometimes|string',
            'context_summary' => 'required|string|min:10|max:2000',
        ]);

        $user    = $request->user();
        $profile = OfficerSkillProfile::where('user_id', $user->id)->first();

        $skillContext = $profile
            ? "Profil kemahiran pegawai: {$profile->skills_description}\nPengkhususan: {$profile->specialisation}\nPengalaman: {$profile->years_experience} tahun"
            : "Pegawai belum mempunyai profil kemahiran AI.";

        $caseType    = $request->input('case_type');
        $contextSumm = $request->input('context_summary');

        $prompt = "Anda adalah SPPT AI, pembantu keputusan untuk pegawai TEKUN Nasional Malaysia.

{$skillContext}

Kes yang perlu dinilai ({$caseType}):
{$contextSumm}

Berdasarkan profil kemahiran pegawai dan konteks kes di atas, berikan cadangan keputusan. Kembalikan HANYA JSON yang sah:
{
  \"recommendation\": \"LULUS|TOLAK|KUARI\",
  \"confidence_score\": number (0-100),
  \"reasoning_bm\": \"string (penjelasan keputusan dalam BM, 2-3 ayat)\",
  \"reasoning_en\": \"string (penjelasan dalam EN)\",
  \"factors\": [
    {\"factor\": \"string\", \"weight\": \"TINGGI|SEDERHANA|RENDAH\", \"impact\": \"POSITIF|NEGATIF\"}
  ],
  \"conditions\": [\"string (syarat jika LULUS)\"],
  \"risk_flags\": [\"string (bendera risiko jika ada)\"],
  \"officer_persona_match\": \"string (bagaimana profil pegawai mempengaruhi keputusan ini)\"
}";

        try {
            $response    = $this->ai->callAiEngine($prompt);
            $rawText     = $response;
            $cleanedText = preg_replace('/```json\s*|\s*```/', '', trim($rawText));
            $result      = json_decode($cleanedText, true);

            if (!$result || !isset($result['recommendation'])) {
                $result = [
                    'recommendation'       => 'KUARI',
                    'confidence_score'     => 50,
                    'reasoning_bm'         => 'Sistem AI tidak dapat membuat keputusan muktamad. Sila semak secara manual.',
                    'reasoning_en'         => 'AI system could not make a definitive decision. Please review manually.',
                    'factors'              => [],
                    'conditions'           => [],
                    'risk_flags'           => ['Keputusan AI tidak pasti — semakan manual diperlukan'],
                    'officer_persona_match' => 'Profil kemahiran tidak dapat dipadankan sepenuhnya.',
                ];
            }

            // Save decision to history
            $decision = OfficerAiDecision::create([
                'officer_skill_profile_id' => $profile?->id,
                'user_id'                  => $user->id,
                'case_type'                => $caseType,
                'case_reference'           => $request->input('case_reference'),
                'context_summary'          => $contextSumm,
                'ai_recommendation'        => $result['recommendation'],
                'confidence_score'         => $result['confidence_score'] ?? 50,
                'reasoning_bm'             => $result['reasoning_bm'] ?? '',
                'reasoning_en'             => $result['reasoning_en'] ?? '',
                'factors'                  => $result['factors'] ?? [],
            ]);

            return response()->json([
                'success'     => true,
                'data'        => array_merge($result, ['decision_id' => $decision->id]),
                'model'       => 'SPPT AI',
                'profile_used' => $profile ? true : false,
            ]);

        } catch (\Exception $e) {
            Log::error('OfficerSkillController::decisionAssist error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ralat semasa memproses keputusan AI.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/officer-skills/history
     * Get AI decision history for the authenticated officer.
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        $decisions = OfficerAiDecision::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => $decisions->items(),
            'meta'    => [
                'total'        => $decisions->total(),
                'per_page'     => $decisions->perPage(),
                'current_page' => $decisions->currentPage(),
                'last_page'    => $decisions->lastPage(),
            ],
        ]);
    }

    /**
     * Generate AI persona config from skill description.
     */
    private function generatePersonaConfig(string $skills, string $specialisation, int $years): array
    {
        // Extract key attributes from skills description
        $isAgriculture  = stripos($skills, 'pertanian') !== false || stripos($skills, 'agri') !== false;
        $isMicro        = stripos($skills, 'mikro') !== false || stripos($skills, 'micro') !== false;
        $isConservative = stripos($skills, 'konservatif') !== false || stripos($skills, 'berhati') !== false;
        $isProgressive  = stripos($skills, 'progresif') !== false || stripos($skills, 'inovatif') !== false;

        return [
            'persona_name'    => 'Pegawai ' . ($specialisation ?: 'Pembiayaan'),
            'decision_style'  => $isConservative ? 'konservatif' : ($isProgressive ? 'progresif' : 'seimbang'),
            'focus_sectors'   => array_filter([
                $isAgriculture ? 'pertanian' : null,
                $isMicro ? 'mikro-perniagaan' : null,
                $specialisation ?: null,
            ]),
            'experience_tier' => $years >= 10 ? 'kanan' : ($years >= 5 ? 'pertengahan' : 'junior'),
            'risk_tolerance'  => $isConservative ? 'rendah' : ($isProgressive ? 'tinggi' : 'sederhana'),
            'ai_weight'       => min(0.9, 0.5 + ($years * 0.04)), // More experience = more AI weight
        ];
    }

    /**
     * Extract skill tags from free-text description.
     */
    private function extractSkillTags(string $description): array
    {
        try {
            $prompt = "Anda adalah pembantu AI. Ekstrak kata kunci kemahiran (skill tags) yang relevan daripada deskripsi berikut. Kembalikan HANYA array JSON yang mengandungi string kata kunci (maksimum 10 kata kunci), contohnya: [\"kredit\", \"pertanian\"]. Jangan sertakan teks lain.\n\nDeskripsi: {$description}";

            $response    = $this->ai->callAiEngine($prompt);
            $cleanedText = preg_replace('/```json\s*|\s*```/', '', trim($response));
            $tags        = json_decode($cleanedText, true);

            if (is_array($tags) && !empty($tags)) {
                return array_values(array_unique(array_filter($tags, 'is_string')));
            }
        } catch (\Exception $e) {
            Log::warning('OfficerSkillController::extractSkillTags AI extraction failed, using fallback: ' . $e->getMessage());
        }

        // Fallback to basic extraction if AI fails
        $keywords = [
            'pertanian', 'agrikultur', 'mikro', 'perniagaan', 'perdagangan',
            'pembuatan', 'perkhidmatan', 'teknologi', 'makanan', 'tekstil',
            'konservatif', 'progresif', 'analisis', 'penilaian', 'kredit',
            'kutipan', 'NPL', 'pemulihan', 'syariah', 'islamik',
        ];

        $tags = [];
        foreach ($keywords as $keyword) {
            if (stripos($description, $keyword) !== false) {
                $tags[] = $keyword;
            }
        }

        return array_values(array_unique($tags));
    }
}