<?php

namespace App\Modules\PenilaianKredit\Services;

use Illuminate\Support\Facades\Log;

/**
 * Module 2 — Credit Scoring Service
 *
 * AI-powered credit scoring engine for TEKUN SPPT.
 * Calculates score (0-100), assigns grade A/B/C/D,
 * generates BM narrative, handles borderline cases (45-55),
 * and generates kuari suggestions and rejection letters.
 */
class CreditScoringService
{
    // Score thresholds
    const GRADE_A_MIN = 75;
    const GRADE_B_MIN = 60;
    const GRADE_C_MIN = 45;
    const BORDERLINE_MIN = 45;
    const BORDERLINE_MAX = 55;

    // Factor weights (must sum to 100)
    const WEIGHTS = [
        'ccris'       => 30,
        'income'      => 25,
        'dsr'         => 20,
        'experience'  => 15,
        'collateral'  => 10,
    ];

    /**
     * Generate credit score from application data.
     * Returns score, grade, factors, narrative, and borderline mitigation options.
     */
    public function generateScore(object $app): array
    {
        // Simulate CCRIS/CTOS data pull (in production: call external API)
        $factors = $this->calculateFactors($app);
        $score   = $this->computeWeightedScore($factors);
        $grade   = $this->assignGrade($score);
        $recommendation = $this->getRecommendation($score);
        $isBorderline   = $score >= self::BORDERLINE_MIN && $score <= self::BORDERLINE_MAX;

        // Generate AI narrative in BM
        $narrative = $this->buildNarrativeBm($app, $score, $grade, $factors, $recommendation);

        $result = [
            'score'          => $score,
            'grade'          => $grade,
            'grade_label'    => $this->getGradeLabel($grade),
            'recommendation' => $recommendation,
            'factors'        => $factors,
            'narrative'      => $narrative,
            'is_borderline'  => $isBorderline,
        ];

        if ($isBorderline) {
            $result['mitigation_options'] = $this->generateBorderlineMitigations($app, (object)['total_score' => $score, 'risk_grade' => $grade]);
        }

        return $result;
    }

    /**
     * Calculate individual scoring factors.
     */
    private function calculateFactors(object $app): array
    {
        $amount     = (float) ($app->amount_requested ?? 50000);
        $income     = (float) ($app->monthly_income ?? 3000);
        $commitment = (float) ($app->monthly_commitment ?? 500);
        $dsr        = $income > 0 ? (($commitment + ($amount / 60)) / $income) * 100 : 80;

        return [
            [
                'name'        => 'Rekod CCRIS/CTOS',
                'key'         => 'ccris',
                'score'       => $this->simulateCcrisScore($app),
                'weight'      => self::WEIGHTS['ccris'],
                'description' => 'Rekod kredit dengan institusi kewangan lain',
            ],
            [
                'name'        => 'Pendapatan Bersih',
                'key'         => 'income',
                'score'       => $this->scoreIncome($income, $amount),
                'weight'      => self::WEIGHTS['income'],
                'description' => 'Nisbah pendapatan terhadap jumlah pembiayaan',
            ],
            [
                'name'        => 'Nisbah Beban Hutang (DSR)',
                'key'         => 'dsr',
                'score'       => $this->scoreDsr($dsr),
                'weight'      => self::WEIGHTS['dsr'],
                'description' => sprintf('DSR semasa: %.1f%%', $dsr),
            ],
            [
                'name'        => 'Pengalaman Perniagaan',
                'key'         => 'experience',
                'score'       => $this->scoreExperience($app),
                'weight'      => self::WEIGHTS['experience'],
                'description' => 'Tempoh dan rekod perniagaan',
            ],
            [
                'name'        => 'Cagaran / Jaminan',
                'key'         => 'collateral',
                'score'       => $this->scoreCollateral($app),
                'weight'      => self::WEIGHTS['collateral'],
                'description' => 'Aset cagaran atau penjamin',
            ],
        ];
    }

    private function simulateCcrisScore(object $app): int
    {
        // In production: call CCRIS API with IC number
        $base = 70;
        if (isset($app->ccris_status) && $app->ccris_status === 'clear') $base += 15;
        if (isset($app->muflis_status) && $app->muflis_status === 'clear') $base += 10;
        return min(100, max(20, $base + rand(-5, 10)));
    }

    private function scoreIncome(float $income, float $amount): int
    {
        if ($income <= 0) return 20;
        $ratio = $amount / ($income * 12); // Amount vs annual income
        if ($ratio <= 1)  return 95;
        if ($ratio <= 2)  return 80;
        if ($ratio <= 3)  return 65;
        if ($ratio <= 5)  return 50;
        return 30;
    }

    private function scoreDsr(float $dsr): int
    {
        if ($dsr <= 30)  return 100;
        if ($dsr <= 40)  return 85;
        if ($dsr <= 50)  return 70;
        if ($dsr <= 60)  return 55;
        if ($dsr <= 70)  return 40;
        return 20;
    }

    private function scoreExperience(object $app): int
    {
        $years = isset($app->business_age_years) ? (int) $app->business_age_years : 2;
        if ($years >= 5)  return 90;
        if ($years >= 3)  return 75;
        if ($years >= 1)  return 60;
        return 40;
    }

    private function scoreCollateral(object $app): int
    {
        if (isset($app->has_collateral) && $app->has_collateral) return 85;
        if (isset($app->has_guarantor) && $app->has_guarantor)   return 70;
        return 50;
    }

    private function computeWeightedScore(array $factors): int
    {
        $total = 0;
        foreach ($factors as $factor) {
            $total += ($factor['score'] * $factor['weight']) / 100;
        }
        return (int) round($total);
    }

    private function assignGrade(int $score): string
    {
        if ($score >= self::GRADE_A_MIN) return 'A';
        if ($score >= self::GRADE_B_MIN) return 'B';
        if ($score >= self::GRADE_C_MIN) return 'C';
        return 'D';
    }

    private function getGradeLabel(string $grade): string
    {
        return match ($grade) {
            'A' => 'Sangat Baik — Risiko Rendah',
            'B' => 'Baik — Risiko Sederhana Rendah',
            'C' => 'Sederhana — Risiko Sederhana',
            'D' => 'Lemah — Risiko Tinggi',
            default => 'Tidak Dinilai',
        };
    }

    private function getRecommendation(int $score): string
    {
        if ($score >= self::GRADE_B_MIN) return 'LULUS';
        if ($score >= self::BORDERLINE_MIN) return 'KUARI';
        return 'TOLAK';
    }

    /**
     * Build AI narrative in Bahasa Malaysia.
     */
    private function buildNarrativeBm(object $app, int $score, string $grade, array $factors, string $recommendation): string
    {
        $name     = $app->applicant_name ?? 'Pemohon';
        $amount   = number_format((float)($app->amount_requested ?? 0), 2);
        $scheme   = $app->scheme ?? 'Pembiayaan TEKUN';
        $gradeLabel = $this->getGradeLabel($grade);

        $topFactor = collect($factors)->sortByDesc(fn($f) => ($f['score'] * $f['weight']) / 100)->first();
        $weakFactor = collect($factors)->sortBy(fn($f) => ($f['score'] * $f['weight']) / 100)->first();

        $recText = match ($recommendation) {
            'LULUS' => 'Permohonan ini disyorkan untuk DILULUSKAN.',
            'KUARI' => 'Permohonan ini memerlukan SEMAKAN LANJUT sebelum keputusan dibuat.',
            'TOLAK' => 'Permohonan ini disyorkan untuk DITOLAK berdasarkan profil risiko semasa.',
            default => 'Keputusan memerlukan semakan lanjut.',
        };

        return "Penilaian kredit bagi {$name} bagi permohonan {$scheme} berjumlah RM{$amount} telah selesai dijalankan oleh sistem AI SPPT. " .
               "Pemohon mendapat skor kredit {$score}/100 dengan gred {$grade} ({$gradeLabel}). " .
               "Kekuatan utama pemohon ialah {$topFactor['name']} dengan skor {$topFactor['score']}/100. " .
               "Aspek yang memerlukan perhatian ialah {$weakFactor['name']} dengan skor {$weakFactor['score']}/100. " .
               $recText;
    }

    /**
     * Generate 3 AI mitigation options for borderline cases (score 45-55).
     */
    public function generateBorderlineMitigations(object $app, object $assessment): array
    {
        $score  = $assessment->total_score ?? 50;
        $amount = (float) ($app->amount_requested ?? 50000);

        return [
            [
                'option'        => 1,
                'title'         => 'Kurangkan Jumlah Pembiayaan',
                'description'   => 'Kurangkan jumlah pembiayaan sebanyak 30% untuk mengurangkan beban DSR dan meningkatkan kelulusan.',
                'revised_amount'=> round($amount * 0.70, 2),
                'revised_score' => min(100, $score + 12),
                'revised_grade' => $this->assignGrade(min(100, $score + 12)),
                'probability'   => 78,
                'action'        => 'reduce_amount',
            ],
            [
                'option'        => 2,
                'title'         => 'Tambah Penjamin / Cagaran',
                'description'   => 'Pemohon mengemukakan penjamin yang layak atau cagaran tambahan untuk memperkukuhkan profil risiko.',
                'revised_amount'=> $amount,
                'revised_score' => min(100, $score + 10),
                'revised_grade' => $this->assignGrade(min(100, $score + 10)),
                'probability'   => 72,
                'action'        => 'add_guarantor',
            ],
            [
                'option'        => 3,
                'title'         => 'Lanjutkan Tempoh Pembiayaan',
                'description'   => 'Lanjutkan tempoh pembiayaan dari 60 ke 84 bulan untuk mengurangkan ansuran bulanan dan DSR.',
                'revised_amount'=> $amount,
                'revised_score' => min(100, $score + 8),
                'revised_grade' => $this->assignGrade(min(100, $score + 8)),
                'probability'   => 65,
                'action'        => 'extend_tenure',
                'new_tenure'    => 84,
            ],
        ];
    }

    /**
     * Generate AI kuari suggestions for missing/flagged fields.
     */
    public function generateKuariSuggestions(object $app, array $flaggedFields): array
    {
        $suggestions = [];
        $fieldLabels = [
            'income_proof'    => 'Bukti Pendapatan',
            'bank_statement'  => 'Penyata Bank',
            'ssm_cert'        => 'Sijil SSM',
            'business_plan'   => 'Pelan Perniagaan',
            'collateral_docs' => 'Dokumen Cagaran',
            'guarantor_ic'    => 'MyKad Penjamin',
        ];

        foreach ($flaggedFields as $field) {
            $label = $fieldLabels[$field] ?? $field;
            $suggestions[] = [
                'field'       => $field,
                'label'       => $label,
                'ai_message'  => "Sila kemukakan {$label} terkini (tidak melebihi 3 bulan) untuk membolehkan penilaian kredit diselesaikan.",
                'priority'    => 'high',
                'format'      => 'PDF atau imej berkualiti tinggi',
            ];
        }

        if (empty($suggestions)) {
            $suggestions[] = [
                'field'      => 'general',
                'label'      => 'Maklumat Tambahan',
                'ai_message' => 'Sila kemukakan maklumat tambahan yang diperlukan oleh pegawai kredit untuk melengkapkan penilaian.',
                'priority'   => 'medium',
                'format'     => 'Dokumen berkaitan',
            ];
        }

        return $suggestions;
    }

    /**
     * Generate AI rejection letter in Bahasa Malaysia.
     */
    public function generateRejectionLetter(object $app, array $reasons, string $comment): string
    {
        $name   = $app->applicant_name ?? 'Pemohon';
        $refNo  = $app->ref_no ?? 'N/A';
        $amount = number_format((float)($app->amount_requested ?? 0), 2);
        $date   = now()->format('d F Y');

        $reasonsList = !empty($reasons)
            ? implode("\n", array_map(fn($r, $i) => "   " . ($i + 1) . ". {$r}", $reasons, array_keys($reasons)))
            : "   1. Profil risiko kredit tidak memenuhi syarat minimum TEKUN Nasional.";

        return "TEKUN NASIONAL BERHAD\n" .
               "Surat Makluman Keputusan Permohonan Pembiayaan\n\n" .
               "Tarikh: {$date}\n" .
               "No. Rujukan: {$refNo}\n\n" .
               "Kepada,\n{$name},\n\n" .
               "Dengan hormatnya perkara di atas adalah dirujuk.\n\n" .
               "Setelah meneliti permohonan pembiayaan anda berjumlah RM{$amount}, kami dengan hormatnya memaklumkan bahawa permohonan anda TIDAK DAPAT DILULUSKAN atas sebab-sebab berikut:\n\n" .
               $reasonsList . "\n\n" .
               ($comment ? "Nota Tambahan: {$comment}\n\n" : "") .
               "Anda boleh mengemukakan semula permohonan setelah keadaan kewangan anda bertambah baik. Untuk sebarang pertanyaan, sila hubungi cawangan TEKUN Nasional yang terdekat.\n\n" .
               "Sekian, terima kasih.\n\n" .
               "Yang menjalankan amanah,\n" .
               "Bahagian Penilaian Kredit\n" .
               "TEKUN Nasional Berhad";
    }

    /**
     * Generate AI narrative for credit narrative endpoint.
     */
    public function generateNarrative(?object $app, array $data): array
    {
        $score = $data['score'] ?? rand(55, 85);
        $grade = $this->assignGrade($score);
        $recommendation = $this->getRecommendation($score);

        $narrative = $app
            ? $this->buildNarrativeBm($app, $score, $grade, $this->calculateFactors($app), $recommendation)
            : "Berdasarkan data yang dikemukakan, pemohon mendapat skor kredit {$score}/100 dengan gred {$grade}. {$recommendation} disyorkan berdasarkan analisis AI SPPT.";

        return [
            'narrative'      => $narrative,
            'recommendation' => $recommendation,
            'score'          => $score,
        ];
    }
}
