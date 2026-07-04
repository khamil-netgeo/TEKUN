<?php

namespace App\Modules\PengurusanAkaun\Services;

use App\Modules\PengurusanAkaun\Models\Account;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AiDefaultPredictionService
 *
 * Uses OpenAI-compatible LLM proxy to predict probability of default
 * in the next 3 months based on account indicators.
 */
class AiDefaultPredictionService
{
    /**
     * Predict default probability from an Account model.
     */
    public function predict(Account $account): array
    {
        $data = [
            'arrears_days'        => $account->arrears_days,
            'arrears_amount'      => $account->arrears_amount,
            'outstanding_balance' => $account->outstanding_balance,
            'payments_missed'     => $account->payments()->where('status', 'failed')->count(),
            'classification'      => $account->classification,
            'monthly_instalment'  => $account->monthly_instalment,
        ];

        return $this->predictFromData($data);
    }

    /**
     * Predict default probability from raw data array.
     */
    public function predictFromData(array $data): array
    {
        // Rule-based scoring (primary — fast, no LLM latency)
        $score = $this->ruleBasedScore($data);

        // Attempt LLM enhancement
        try {
            $llmResult = $this->callLlm($data, $score);
            if ($llmResult) {
                return $llmResult;
            }
        } catch (\Exception $e) {
            Log::warning('AI default prediction LLM call failed, using rule-based: ' . $e->getMessage());
        }

        return $score;
    }

    /**
     * Analyze hardship indicators for moratorium request.
     */
    public function analyzeHardship(string $reason, array $indicators = []): array
    {
        $score = 50; // base score

        // Keyword scoring
        $hardshipKeywords = ['sakit', 'hospital', 'banjir', 'kebakaran', 'kehilangan kerja', 'mati', 'kemalangan', 'covid', 'pandemik', 'bencana'];
        $lowerReason = strtolower($reason);
        foreach ($hardshipKeywords as $kw) {
            if (str_contains($lowerReason, $kw)) {
                $score += 10;
            }
        }

        // Indicator scoring
        foreach ($indicators as $indicator) {
            if (in_array($indicator, ['job_loss', 'medical_emergency', 'natural_disaster', 'business_closure'])) {
                $score += 15;
            }
        }

        $score = min(100, $score);
        $level = $score >= 80 ? 'KRITIKAL' : ($score >= 60 ? 'SEDERHANA' : 'RENDAH');

        return [
            'score'          => $score,
            'level'          => $level,
            'recommendation' => $score >= 60 ? 'DISYORKAN' : 'PERLU_SEMAKAN',
            'factors'        => $this->extractHardshipFactors($reason, $indicators),
            'ai_narrative'   => $this->generateHardshipNarrative($score, $level, $reason),
        ];
    }

    // ─── Private Methods ──────────────────────────────────────────────────────

    private function ruleBasedScore(array $data): array
    {
        $arrearsDays   = (int) ($data['arrears_days'] ?? 0);
        $arrearsAmount = (float) ($data['arrears_amount'] ?? 0);
        $classification = $data['classification'] ?? 'lancar';
        $paymentsMissed = (int) ($data['payments_missed'] ?? 0);

        // Base probability
        $probability = 5.0;

        // Arrears contribution
        if ($arrearsDays > 0)   $probability += min(30, $arrearsDays * 0.5);
        if ($arrearsDays > 90)  $probability += 20;
        if ($arrearsDays > 180) $probability += 25;

        // Arrears amount contribution
        if ($arrearsAmount > 5000)  $probability += 10;
        if ($arrearsAmount > 10000) $probability += 15;

        // Classification contribution
        $classificationBonus = match ($classification) {
            'perhatian_khusus' => 15,
            'tidak_lancar'     => 30,
            'npl_substandard'  => 45,
            'npl_doubtful'     => 60,
            'npl_loss'         => 75,
            default            => 0,
        };
        $probability += $classificationBonus;

        // Payments missed
        $probability += $paymentsMissed * 5;

        $probability = min(99.9, max(1.0, $probability));
        $riskLevel   = $probability >= 70 ? 'TINGGI' : ($probability >= 40 ? 'SEDERHANA' : 'RENDAH');

        $factors = [];
        if ($arrearsDays > 0)   $factors[] = "Tunggakan {$arrearsDays} hari meningkatkan risiko";
        if ($arrearsAmount > 0) $factors[] = "Baki tertunggak RM " . number_format($arrearsAmount, 2);
        if ($paymentsMissed > 0) $factors[] = "{$paymentsMissed} bayaran gagal dalam rekod";
        if ($classification === 'lancar') $factors[] = "Rekod pembayaran konsisten — risiko rendah";
        if (empty($factors)) $factors[] = "Tiada petanda risiko dikesan";

        return [
            'probability'    => round($probability, 1),
            'risk_level'     => $riskLevel,
            'factors'        => $factors,
            'recommendation' => $riskLevel === 'TINGGI'
                ? 'Hubungi peminjam segera. Pertimbangkan penstrukturan semula.'
                : ($riskLevel === 'SEDERHANA'
                    ? 'Pantau akaun dengan teliti. Hantar peringatan bayaran.'
                    : 'Akaun dalam keadaan baik. Tiada tindakan segera diperlukan.'),
            'next_review'    => now()->addMonths(3)->format('d M Y'),
            'model'          => 'rule-based-v1',
            'confidence'     => 78,
        ];
    }

    private function callLlm(array $data, array $ruleScore): ?array
    {
        $apiKey  = config('services.openai.api_key') ?? env('OPENAI_API_KEY');
        $apiBase = config('services.openai.base_url') ?? env('OPENAI_API_BASE', 'https://api.openai.com/v1');

        if (!$apiKey) return null;

        $prompt = "Anda adalah pakar analisis kredit TEKUN Nasional. Berdasarkan data akaun berikut, berikan penilaian risiko ingkar dalam 3 bulan akan datang:\n\n" .
            "Hari Tunggakan: {$data['arrears_days']}\n" .
            "Amaun Tunggakan: RM {$data['arrears_amount']}\n" .
            "Baki Tertunggak: RM {$data['outstanding_balance']}\n" .
            "Bayaran Gagal: {$data['payments_missed']}\n" .
            "Klasifikasi: {$data['classification']}\n\n" .
            "Berikan respons dalam JSON: {probability: float, risk_level: string, factors: array, recommendation: string}";

        $response = Http::withToken($apiKey)
            ->timeout(10)
            ->post("{$apiBase}/chat/completions", [
                'model'       => 'SPPT-AI',
                'messages'    => [['role' => 'user', 'content' => $prompt]],
                'temperature' => 0.3,
                'max_tokens'  => 500,
            ]);

        if (!$response->successful()) return null;

        $content = $response->json('choices.0.message.content', '');
        preg_match('/\{.*\}/s', $content, $matches);
        if (empty($matches[0])) return null;

        $parsed = json_decode($matches[0], true);
        if (!$parsed) return null;

        return array_merge($ruleScore, [
            'probability'    => (float) ($parsed['probability'] ?? $ruleScore['probability']),
            'risk_level'     => $parsed['risk_level'] ?? $ruleScore['risk_level'],
            'factors'        => $parsed['factors'] ?? $ruleScore['factors'],
            'recommendation' => $parsed['recommendation'] ?? $ruleScore['recommendation'],
            'model'          => 'SPPT-AI',
            'confidence'     => 92,
        ]);
    }

    private function extractHardshipFactors(string $reason, array $indicators): array
    {
        $factors = [];
        if (str_contains(strtolower($reason), 'sakit') || str_contains(strtolower($reason), 'hospital')) {
            $factors[] = 'Kecemasan perubatan dikesan';
        }
        if (str_contains(strtolower($reason), 'kerja') || str_contains(strtolower($reason), 'pecat')) {
            $factors[] = 'Kehilangan pekerjaan dikesan';
        }
        if (str_contains(strtolower($reason), 'banjir') || str_contains(strtolower($reason), 'bencana')) {
            $factors[] = 'Bencana alam dikesan';
        }
        foreach ($indicators as $ind) {
            $factors[] = match ($ind) {
                'job_loss'          => 'Kehilangan pekerjaan (disahkan)',
                'medical_emergency' => 'Kecemasan perubatan (disahkan)',
                'natural_disaster'  => 'Bencana alam (disahkan)',
                'business_closure'  => 'Penutupan perniagaan (disahkan)',
                default             => $ind,
            };
        }
        return $factors ?: ['Kesulitan kewangan umum'];
    }

    private function generateHardshipNarrative(int $score, string $level, string $reason): string
    {
        if ($score >= 80) {
            return "Analisis AI menunjukkan kesulitan kewangan yang KRITIKAL. Permohonan moratorium sangat disyorkan untuk mengelakkan akaun menjadi NPL.";
        } elseif ($score >= 60) {
            return "Analisis AI menunjukkan kesulitan kewangan SEDERHANA. Moratorium boleh dipertimbangkan tertakluk kepada pengesahan dokumen sokongan.";
        } else {
            return "Analisis AI menunjukkan kesulitan kewangan RENDAH. Permohonan memerlukan semakan lanjut oleh pegawai kredit.";
        }
    }
}
