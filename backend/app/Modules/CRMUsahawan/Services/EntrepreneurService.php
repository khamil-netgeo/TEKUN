<?php

namespace App\Modules\CRMUsahawan\Services;

use App\Modules\CRMUsahawan\Models\Entrepreneur;
use App\Modules\CRMUsahawan\Models\FieldVisit;
use App\Modules\CRMUsahawan\Models\EntrepreneurKpiSnapshot;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Module 7 — CRM & Pemantauan Usahawan
 * EntrepreneurService — business logic, AI health scoring, visit report generation
 */
class EntrepreneurService
{
    // ── Entrepreneur CRUD ─────────────────────────────────────────────────────

    /**
     * Generate a unique ref_no for a new entrepreneur.
     */
    public function generateRefNo(): string
    {
        $last = Entrepreneur::withTrashed()->orderByDesc('id')->first();
        $seq  = $last ? ((int) substr($last->ref_no, 4)) + 1 : 1;
        return 'USH-' . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate a unique ref_no for a new field visit.
     */
    public function generateVisitRefNo(): string
    {
        $last = FieldVisit::withTrashed()->orderByDesc('id')->first();
        $seq  = $last ? ((int) substr($last->ref_no, 3)) + 1 : 1;
        return 'LW-' . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    // ── AI Health Score ───────────────────────────────────────────────────────

    /**
     * Compute the AI health score for an entrepreneur.
     * Uses rule-based scoring + optional LLM narrative.
     * Returns: { score: int, distress_level: string, factors: array, default_probability: float }
     */
    public function computeHealthScore(Entrepreneur $entrepreneur): array
    {
        $score   = 100;
        $factors = [];

        // 1. Financing status
        $statusPenalty = match ($entrepreneur->financing_status) {
            'Perhatian Khusus' => 20,
            'Tidak Lancar'     => 40,
            default            => 0,
        };
        $score -= $statusPenalty;
        if ($statusPenalty > 0) {
            $factors[] = 'status_pembiayaan_' . strtolower(str_replace(' ', '_', $entrepreneur->financing_status));
        }

        // 2. Outstanding balance ratio
        if ($entrepreneur->total_financing > 0) {
            $ratio = $entrepreneur->outstanding_balance / $entrepreneur->total_financing;
            if ($ratio > 0.9) {
                $score -= 10;
                $factors[] = 'baki_tinggi';
            }
        }

        // 3. Revenue vs expenses
        if ($entrepreneur->monthly_revenue > 0 && $entrepreneur->monthly_expenses > 0) {
            $margin = ($entrepreneur->monthly_revenue - $entrepreneur->monthly_expenses) / $entrepreneur->monthly_revenue;
            if ($margin < 0) {
                $score -= 15;
                $factors[] = 'margin_negatif';
            } elseif ($margin < 0.1) {
                $score -= 8;
                $factors[] = 'margin_rendah';
            }
        } elseif (!$entrepreneur->monthly_revenue) {
            $score -= 5;
            $factors[] = 'tiada_data_pendapatan';
        }

        // 4. Business age
        $businessAge = $entrepreneur->business_age_years ?? 0;
        if ($businessAge < 1) {
            $score -= 10;
            $factors[] = 'perniagaan_baru';
        } elseif ($businessAge >= 3) {
            // Bonus for established businesses
            $score = min(100, $score + 5);
        }

        // 5. Field visit recency
        $lastVisit = $entrepreneur->fieldVisits()
            ->where('status', 'Selesai')
            ->orderByDesc('actual_date')
            ->first();
        if (!$lastVisit) {
            $score -= 5;
            $factors[] = 'tiada_lawatan_lapangan';
        } elseif ($lastVisit->actual_date && $lastVisit->actual_date->diffInDays(now()) > 180) {
            $score -= 5;
            $factors[] = 'lawatan_lama';
        }

        // 6. Employee count
        if ($entrepreneur->employee_count >= 5) {
            $score = min(100, $score + 3);
        }

        // Clamp
        $score = max(0, min(100, $score));

        // Distress level
        $distressLevel = match (true) {
            $score >= 70 => 'Rendah',
            $score >= 50 => 'Sederhana',
            $score >= 30 => 'Tinggi',
            default      => 'Kritikal',
        };

        // Default probability (sigmoid-like mapping)
        $defaultProbability = round(1 / (1 + exp(($score - 50) / 15)), 4);

        return [
            'score'               => $score,
            'distress_level'      => $distressLevel,
            'factors'             => $factors,
            'default_probability' => $defaultProbability,
        ];
    }

    /**
     * Refresh and persist AI health score for an entrepreneur.
     */
    public function refreshHealthScore(Entrepreneur $entrepreneur): Entrepreneur
    {
        $result = $this->computeHealthScore($entrepreneur);

        $entrepreneur->update([
            'health_score'         => $result['score'],
            'distress_level'       => $result['distress_level'],
            'default_probability'  => $result['default_probability'],
            'ai_factors'           => $result['factors'],
            'ai_score_updated_at'  => now(),
        ]);

        return $entrepreneur->fresh();
    }

    // ── AI Visit Report Generation ────────────────────────────────────────────

    /**
     * Generate an AI visit report for a completed field visit.
     * Calls the SPPT AI LLM proxy.
     */
    public function generateVisitReport(FieldVisit $visit): string
    {
        $entrepreneur = $visit->entrepreneur;
        $officer      = $visit->officer;

        $prompt = $this->buildVisitReportPrompt($visit, $entrepreneur, $officer?->name ?? 'Pegawai');

        try {
            $apiKey  = config('services.openai.key', env('OPENAI_API_KEY'));
            $apiBase = config('services.openai.base_url', env('OPENAI_API_BASE', 'https://api.openai.com/v1'));

            $response = Http::withToken($apiKey)
                ->timeout(30)
                ->post("{$apiBase}/chat/completions", [
                    'model'       => 'sppt-ai',
                    'max_tokens'  => 600,
                    'temperature' => 0.4,
                    'messages'    => [
                        [
                            'role'    => 'system',
                            'content' => 'Anda adalah pegawai kanan TEKUN Nasional yang menulis laporan lawatan lapangan dalam Bahasa Melayu yang formal dan profesional. Laporan mestilah ringkas, tepat, dan merangkumi pemerhatian, cadangan, dan tindakan susulan.',
                        ],
                        [
                            'role'    => 'user',
                            'content' => $prompt,
                        ],
                    ],
                ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content', $this->fallbackReport($visit, $entrepreneur));
            }
        } catch (\Throwable $e) {
            Log::warning('M7 AI visit report generation failed: ' . $e->getMessage());
        }

        return $this->fallbackReport($visit, $entrepreneur);
    }

    // ── AI Semantic Search ────────────────────────────────────────────────────

    /**
     * Perform AI-enhanced semantic search over entrepreneurs.
     * Falls back to SQL ILIKE search if LLM unavailable.
     */
    public function semanticSearch(string $query, int $branchId = null): \Illuminate\Support\Collection
    {
        // For production: generate embedding for query, then do pgvector cosine similarity search.
        // For POC: use enhanced SQL search with multiple fields.
        $builder = Entrepreneur::query()
            ->with(['branch', 'assignedOfficer'])
            ->where(function ($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%")
                  ->orWhere('ref_no', 'ilike', "%{$query}%")
                  ->orWhere('ic_no', 'like', "%{$query}%")
                  ->orWhere('business_name', 'ilike', "%{$query}%")
                  ->orWhere('sector', 'ilike', "%{$query}%")
                  ->orWhere('skim', 'ilike', "%{$query}%")
                  ->orWhere('state', 'ilike', "%{$query}%");
            });

        if ($branchId) {
            $builder->where('branch_id', $branchId);
        }

        return $builder->orderByDesc('health_score')->limit(20)->get();
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private function buildVisitReportPrompt(FieldVisit $visit, Entrepreneur $entrepreneur, string $officerName): string
    {
        $date      = $visit->actual_date?->format('d/m/Y') ?? $visit->scheduled_date->format('d/m/Y');
        $condition = $visit->business_condition ?? 'Tidak dinyatakan';
        $revenue   = $visit->reported_revenue ? 'RM ' . number_format($visit->reported_revenue, 2) : 'Tidak dilaporkan';
        $employees = $visit->reported_employees ?? $entrepreneur->employee_count;

        return <<<PROMPT
Sila jana laporan lawatan lapangan rasmi berdasarkan maklumat berikut:

**Maklumat Lawatan:**
- Tarikh: {$date}
- Pegawai: {$officerName}
- Tujuan: {$visit->purpose}
- Keadaan Perniagaan: {$condition}

**Maklumat Usahawan:**
- Nama: {$entrepreneur->name}
- ID: {$entrepreneur->ref_no}
- Skim: {$entrepreneur->skim}
- Sektor: {$entrepreneur->sector}
- Status Pembiayaan: {$entrepreneur->financing_status}
- Skor Kesihatan: {$entrepreneur->health_score}/100

**KPI Dilaporkan Semasa Lawatan:**
- Pendapatan Bulanan: {$revenue}
- Bilangan Pekerja: {$employees}

**Nota Pegawai:**
{$visit->visit_notes}

Jana laporan formal dalam 3 perenggan: (1) Pemerhatian semasa lawatan, (2) Analisis prestasi perniagaan, (3) Cadangan dan tindakan susulan.
PROMPT;
    }

    private function fallbackReport(FieldVisit $visit, Entrepreneur $entrepreneur): string
    {
        $date      = $visit->actual_date?->format('d/m/Y') ?? now()->format('d/m/Y');
        $condition = $visit->business_condition ?? 'Sederhana';

        return "Laporan Lawatan Lapangan — {$date}\n\n" .
            "Lawatan lapangan telah dijalankan ke premis usahawan {$entrepreneur->name} ({$entrepreneur->ref_no}) " .
            "bagi tujuan {$visit->purpose}. Keadaan perniagaan semasa lawatan dinilai sebagai {$condition}.\n\n" .
            "Berdasarkan pemerhatian semasa lawatan, usahawan menunjukkan tahap operasi yang " .
            ($entrepreneur->health_score >= 70 ? 'memuaskan dan perniagaan berjalan dengan baik.' :
                ($entrepreneur->health_score >= 50 ? 'sederhana dan memerlukan pemantauan berterusan.' :
                    'membimbangkan dan memerlukan tindakan segera.')) . "\n\n" .
            "Pegawai mengesyorkan tindakan susulan dalam tempoh 30 hari bagi memastikan kesinambungan " .
            "pembiayaan dan prestasi perniagaan usahawan. Laporan ini dijana secara automatik oleh sistem SPPT.";
    }
}
