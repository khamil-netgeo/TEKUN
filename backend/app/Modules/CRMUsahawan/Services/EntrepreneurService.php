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
            'Perhatian Khusus' => config('crm_usahawan.health_score.penalties.status_perhatian_khusus', 20),
            'Tidak Lancar'     => config('crm_usahawan.health_score.penalties.status_tidak_lancar', 40),
            default            => 0,
        };
        $score -= $statusPenalty;
        if ($statusPenalty > 0) {
            $factors[] = 'status_pembiayaan_' . strtolower(str_replace(' ', '_', $entrepreneur->financing_status));
        }

        // 2. Outstanding balance ratio
        if ($entrepreneur->total_financing > 0) {
            $ratio = $entrepreneur->outstanding_balance / $entrepreneur->total_financing;
            $ratioThreshold = config('crm_usahawan.health_score.thresholds.high_balance_ratio', 0.9);
            if ($ratio > $ratioThreshold) {
                $score -= config('crm_usahawan.health_score.penalties.high_balance_ratio', 10);
                $factors[] = 'baki_tinggi';
            }
        }

        // 3. Revenue vs expenses
        if ($entrepreneur->monthly_revenue > 0 && $entrepreneur->monthly_expenses > 0) {
            $margin = ($entrepreneur->monthly_revenue - $entrepreneur->monthly_expenses) / $entrepreneur->monthly_revenue;
            $lowMarginThreshold = config('crm_usahawan.health_score.thresholds.low_margin', 0.1);
            if ($margin < 0) {
                $score -= config('crm_usahawan.health_score.penalties.negative_margin', 15);
                $factors[] = 'margin_negatif';
            } elseif ($margin < $lowMarginThreshold) {
                $score -= config('crm_usahawan.health_score.penalties.low_margin', 8);
                $factors[] = 'margin_rendah';
            }
        } elseif (!$entrepreneur->monthly_revenue) {
            $score -= config('crm_usahawan.health_score.penalties.no_revenue_data', 5);
            $factors[] = 'tiada_data_pendapatan';
        }

        // 4. Business age
        $businessAge = $entrepreneur->business_age_years ?? 0;
        $establishedAge = config('crm_usahawan.health_score.thresholds.established_business_years', 3);
        if ($businessAge < 1) {
            $score -= config('crm_usahawan.health_score.penalties.new_business', 10);
            $factors[] = 'perniagaan_baru';
        } elseif ($businessAge >= $establishedAge) {
            // Bonus for established businesses
            $score = min(100, $score + config('crm_usahawan.health_score.bonuses.established_business', 5));
        }

        // 5. Field visit recency
        $lastVisit = $entrepreneur->fieldVisits()
            ->where('status', 'Selesai')
            ->orderByDesc('actual_date')
            ->first();
            
        $oldVisitDays = config('crm_usahawan.health_score.thresholds.old_visit_days', 180);
        if (!$lastVisit) {
            $score -= config('crm_usahawan.health_score.penalties.no_field_visit', 5);
            $factors[] = 'tiada_lawatan_lapangan';
        } elseif ($lastVisit->actual_date && $lastVisit->actual_date->diffInDays(now()) > $oldVisitDays) {
            $score -= config('crm_usahawan.health_score.penalties.old_field_visit', 5);
            $factors[] = 'lawatan_lama';
        }

        // 6. Employee count
        $highEmployeeThreshold = config('crm_usahawan.health_score.thresholds.high_employee_count', 5);
        if ($entrepreneur->employee_count >= $highEmployeeThreshold) {
            $score = min(100, $score + config('crm_usahawan.health_score.bonuses.high_employee_count', 3));
        }

        // Clamp
        $score = max(0, min(100, $score));

        // Distress level
        $thresholdRendah = config('crm_usahawan.health_score.thresholds.distress_rendah', 70);
        $thresholdSederhana = config('crm_usahawan.health_score.thresholds.distress_sederhana', 50);
        $thresholdTinggi = config('crm_usahawan.health_score.thresholds.distress_tinggi', 30);

        $distressLevel = match (true) {
            $score >= $thresholdRendah    => 'Rendah',
            $score >= $thresholdSederhana => 'Sederhana',
            $score >= $thresholdTinggi    => 'Tinggi',
            default                       => 'Kritikal',
        };

        // Default probability (sigmoid-like mapping)
        $sigmoidOffset = config('crm_usahawan.health_score.sigmoid_offset', 50);
        $sigmoidScale = config('crm_usahawan.health_score.sigmoid_scale', 15);
        $defaultProbability = round(1 / (1 + exp(($score - $sigmoidOffset) / $sigmoidScale)), 4);

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
                $content = $response->json('choices.0.message.content');
                if ($content) {
                    return $content;
                }
                throw new \Exception('Tiada kandungan dikembalikan oleh AI.');
            }

            throw new \Exception('Ralat API AI: ' . $response->body());
        } catch (\Throwable $e) {
            Log::error('M7 AI visit report generation failed: ' . $e->getMessage());
            throw new \Exception('Gagal menjana laporan AI: ' . $e->getMessage());
        }
    }

    // ── AI Semantic Search ────────────────────────────────────────────────────

    /**
     * Perform AI-enhanced semantic search over entrepreneurs.
     * Falls back to SQL ILIKE search if LLM unavailable.
     */
    public function semanticSearch(string $query, int $branchId = null): \Illuminate\Support\Collection
    {
        try {
            $apiKey  = config('services.openai.key', env('OPENAI_API_KEY'));
            $apiBase = config('services.openai.base_url', env('OPENAI_API_BASE', 'https://api.openai.com/v1'));

            $response = Http::withToken($apiKey)
                ->timeout(15)
                ->post("{$apiBase}/embeddings", [
                    'model' => 'text-embedding-ada-002',
                    'input' => $query,
                ]);

            if ($response->successful() && $embedding = $response->json('data.0.embedding')) {
                $embeddingString = '[' . implode(',', $embedding) . ']';

                $builder = Entrepreneur::query()
                    ->with(['branch', 'assignedOfficer'])
                    ->select('*')
                    ->selectRaw('embedding <=> ? AS distance', [$embeddingString])
                    ->orderBy('distance');

                if ($branchId) {
                    $builder->where('branch_id', $branchId);
                }

                return $builder->limit(20)->get();
            }
        } catch (\Throwable $e) {
            Log::warning('M7 AI semantic search failed: ' . $e->getMessage());
        }

        // Fallback to SQL ILIKE search if LLM unavailable
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
}