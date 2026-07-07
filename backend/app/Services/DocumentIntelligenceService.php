<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * SPPT Document Intelligence Service (AI OCR + Eligibility Decision Engine)
 *
 * Uses Google Gemini 3.1 Pro (native generateContent API with inline_data)
 * so that images/PDFs actually reach the vision model.
 *
 * Capabilities:
 *  1. extractDocument()      — per-document-type OCR extraction (MyKad, SSM,
 *                              bank statement, payslip, premises photo, other)
 *  2. analyzeBankStatement() — deep cash-flow analysis for affordability
 *  3. makeDecision()         — AI Eligibility Decision Engine:
 *                              auto_reject | accept | recommend_lower | recommend_higher
 */
class DocumentIntelligenceService
{
    protected string $apiKey;
    protected string $model;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey  = env('GEMINI_API_KEY', '');
        $this->model   = env('GEMINI_VISION_MODEL_V2', 'gemini-3.1-pro-preview');
        $this->baseUrl = rtrim(env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta/'), '/');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Core: native Gemini generateContent call with image support
    // ─────────────────────────────────────────────────────────────────────────
    public function callGeminiVision(string $prompt, ?string $base64Data = null, string $mimeType = 'image/jpeg', ?string $model = null): array
    {
        $model = $model ?? $this->model;
        $parts = [['text' => $prompt]];
        if ($base64Data) {
            $parts[] = ['inline_data' => ['mime_type' => $mimeType, 'data' => $base64Data]];
        }

        try {
            $response = Http::timeout(90)->post(
                "{$this->baseUrl}/models/{$model}:generateContent?key={$this->apiKey}",
                [
                    'contents'         => [['role' => 'user', 'parts' => $parts]],
                    'generationConfig' => [
                        'temperature'      => 0.1,
                        'maxOutputTokens'  => 16384,
                        'responseMimeType' => 'application/json',
                    ],
                ]
            );

            if ($response->failed()) {
                Log::warning('DocumentIntelligence Gemini HTTP error', [
                    'status' => $response->status(),
                    'body'   => substr($response->body(), 0, 400),
                ]);
                // Fallback to flash model if pro model is overloaded/unavailable
                if ($model !== 'gemini-2.5-flash') {
                    return $this->callGeminiVision($prompt, $base64Data, $mimeType, 'gemini-2.5-flash');
                }
                return ['error' => "Gemini HTTP {$response->status()}"];
            }

            // Gemini may split output across multiple parts — concatenate all text parts
            $parts = $response->json('candidates.0.content.parts') ?? [];
            $text  = '';
            foreach ($parts as $p) {
                $text .= $p['text'] ?? '';
            }
            $finishReason = $response->json('candidates.0.finishReason') ?? '';
            $text = preg_replace('/```json\s*|\s*```/', '', trim($text));
            $decoded = json_decode($text, true);

            // Robust fallback: extract the outermost JSON object substring
            if (!is_array($decoded)) {
                $start = strpos($text, '{');
                $end   = strrpos($text, '}');
                if ($start !== false && $end !== false && $end > $start) {
                    $decoded = json_decode(substr($text, $start, $end - $start + 1), true);
                }
            }

            if (!is_array($decoded)) {
                Log::warning('DocumentIntelligence JSON parse failed', [
                    'finish_reason' => $finishReason,
                    'len'           => strlen($text),
                    'raw_tail'      => substr($text, -300),
                ]);
                // Retry once with flash model if output was truncated
                if ($finishReason === 'MAX_TOKENS' && $model !== 'gemini-2.5-flash') {
                    return $this->callGeminiVision($prompt, $base64Data, $mimeType, 'gemini-2.5-flash');
                }
                return ['error' => 'JSON parse failed', 'raw' => substr($text, 0, 500)];
            }
            return $decoded;
        } catch (\Throwable $e) {
            Log::error('DocumentIntelligence exception: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Per-document-type OCR extraction
    // ─────────────────────────────────────────────────────────────────────────
    public function extractDocument(string $base64Data, string $mimeType, string $docType): array
    {
        $schemas = [
            'mykad' => '{
  "document_type": "mykad",
  "is_valid_document": true|false,
  "fields": {
    "full_name": "string|null", "ic_number": "string|null", "address": "string|null",
    "gender": "Lelaki|Perempuan|null", "religion": "string|null", "citizenship": "string|null",
    "date_of_birth": "YYYY-MM-DD|null (derive from first 6 digits of IC: YYMMDD)",
    "age": "number|null (calculate from IC as of 2026)"
  }
}',
            'ssm' => '{
  "document_type": "ssm",
  "is_valid_document": true|false,
  "fields": {
    "business_name": "string|null", "registration_number": "string|null",
    "business_type": "string|null", "registration_date": "YYYY-MM-DD|null",
    "expiry_date": "YYYY-MM-DD|null", "business_address": "string|null",
    "owner_name": "string|null", "owner_ic": "string|null", "business_activities": "string|null"
  }
}',
            'bank_statement' => '{
  "document_type": "bank_statement",
  "is_valid_document": true|false,
  "fields": {
    "bank_name": "string|null", "account_holder": "string|null", "account_number": "string|null",
    "statement_period": "string|null", "opening_balance": number|null, "closing_balance": number|null,
    "total_credits": number|null, "total_debits": number|null,
    "average_daily_balance": number|null, "salary_or_income_deposits_detected": number|null,
    "notable_transactions": [{"date":"string","description":"string","amount":number}]
  },
  "analysis": {
    "estimated_monthly_income": number|null,
    "estimated_monthly_expenses": number|null,
    "cash_flow_health": "sihat|sederhana|lemah",
    "income_stability": "stabil|tidak menentu",
    "existing_loan_commitments_detected": number|null,
    "red_flags": ["string"],
    "summary_bm": "Ringkasan analisis penyata bank dalam Bahasa Melayu (2-3 ayat)"
  }
}',
            'payslip' => '{
  "document_type": "payslip",
  "is_valid_document": true|false,
  "fields": {
    "employer_name": "string|null", "employee_name": "string|null", "position": "string|null",
    "pay_period": "string|null", "gross_salary": number|null, "net_salary": number|null,
    "deductions_total": number|null, "epf_deduction": number|null, "existing_loan_deductions": number|null
  }
}',
            'premises' => '{
  "document_type": "premises",
  "is_valid_document": true|false,
  "fields": {
    "premises_type": "kedai|gerai|kilang|pejabat|rumah|lain-lain|null",
    "business_signage_visible": true|false, "signage_text": "string|null",
    "condition": "baik|sederhana|usang|null", "estimated_business_activity": "string|null",
    "location_indicators": "string|null"
  }
}',
        ];

        $schema = $schemas[$docType] ?? '{
  "document_type": "other",
  "is_valid_document": true|false,
  "fields": { "document_title": "string|null", "key_information": [{"label":"string","value":"string"}] }
}';

        $prompt = "Anda ialah sistem AI Document Intelligence untuk TEKUN Nasional (agensi pembiayaan mikro Malaysia). "
            . "Analisis dokumen yang dilampirkan dengan teliti (OCR). Baca SEMUA teks yang kelihatan dan ekstrak setiap fakta. "
            . "Jenis dokumen yang dijangka: '{$docType}'. "
            . "Kembalikan HANYA objek JSON sah mengikut skema berikut:\n{$schema}\n"
            . "Tambah juga medan tambahan berikut pada objek JSON:\n"
            . "\"confidence\": nombor 0-100 (keyakinan pembacaan OCR),\n"
            . "\"document_matches_expected_type\": true|false (adakah dokumen ini sepadan dengan jenis yang dijangka '{$docType}'),\n"
            . "\"ai_summary_bm\": \"Ringkasan 2-3 ayat dalam Bahasa Melayu tentang apa yang AI faham daripada dokumen ini\",\n"
            . "\"issues\": [\"senarai isu dalam BM, cth: imej kabur, dokumen tidak lengkap, jenis tidak sepadan\"].\n"
            . "Jika medan tidak boleh dibaca, guna null. Jangan reka data.";

        $result = $this->callGeminiVision($prompt, $base64Data, $mimeType);

        if (isset($result['error'])) {
            return [
                'confidence' => 0,
                'is_valid_document' => false,
                'ai_summary_bm' => 'Analisis AI gagal: ' . $result['error'],
                'issues' => ['Analisis AI tidak dapat dijalankan. Sila cuba semula.'],
                'fields' => [],
                'error' => $result['error'],
            ];
        }
        return $result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. AI Eligibility Decision Engine
    //    Combines mandatory policy rules + OCR extracted data + Gemini analysis
    // ─────────────────────────────────────────────────────────────────────────
    public function makeDecision(array $applicationData, array $documentExtractions, array $policyChecks): array
    {
        $appJson    = json_encode($applicationData, JSON_UNESCAPED_UNICODE);
        $docsJson   = json_encode($documentExtractions, JSON_UNESCAPED_UNICODE);
        $policyJson = json_encode($policyChecks, JSON_UNESCAPED_UNICODE);

        $prompt = <<<PROMPT
Anda ialah Enjin Keputusan Kelayakan AI untuk TEKUN Nasional (SPPT). Tarikh hari ini: 7 Julai 2026.

DASAR MANDATORI TEKUN (auto-reject jika dilanggar):
1. Umur pemohon mesti 18-60 tahun.
2. Pemohon TIDAK boleh berada dalam senarai hitam (blacklist), muflis/insolvensi, atau rekod CCRIS/CTOS buruk.
3. Jumlah komitmen pembiayaan aktif sedia ada + jumlah dipohon TIDAK boleh melebihi had maksimum skim.
4. Nisbah khidmat hutang (DSR) selepas pembiayaan baru tidak boleh melebihi 70% pendapatan bulanan.

HAD SKIM: tekun_micro=RM10,000 | tekun_usahawan=RM50,000 | tekun_wanita=RM30,000 | tekun_belia=RM20,000.

DATA PERMOHONAN:
{$appJson}

DATA EKSTRAK AI OCR DARIPADA DOKUMEN:
{$docsJson}

SEMAKAN POLISI/INTEGRASI (JPN, CCRIS, CTOS, SSM, e-Syariah, Insolvensi):
{$policyJson}

TUGASAN: Analisis semua data di atas dan buat keputusan kelayakan. Kembalikan HANYA JSON:
{
  "decision": "auto_reject" | "accept" | "recommend_lower" | "recommend_higher",
  "recommended_amount": number (jumlah RM yang AI cadangkan; sama dengan jumlah dipohon jika accept),
  "confidence": number 0-100,
  "risk_grade": "A" | "B" | "C" | "D" | "E",
  "dsr_estimated_pct": number|null (anggaran DSR % selepas pembiayaan),
  "monthly_installment_estimate": number|null (anggaran ansuran bulanan pada tempoh & kadar skim),
  "mandatory_violations": ["senarai pelanggaran dasar mandatori dalam BM; kosong jika tiada"],
  "factors": [
    {"factor": "nama faktor BM", "impact": "positif|negatif|neutral", "detail": "penjelasan ringkas BM", "weight_pct": number}
  ],
  "narrative_bm": "Penjelasan keputusan 3-4 ayat dalam Bahasa Melayu, profesional, boleh dipaparkan kepada pegawai",
  "next_steps_bm": ["langkah seterusnya yang dicadangkan dalam BM"]
}

PERATURAN KEPUTUSAN:
- Jika ada pelanggaran mandatori → "auto_reject".
- Jika data kewangan (penyata bank/slip gaji) menunjukkan kapasiti bayar TIDAK cukup untuk jumlah dipohon → "recommend_lower" dengan jumlah yang selamat (DSR ≤ 50%).
- Jika kapasiti kewangan KUKUH (DSR rendah, aliran tunai sihat, pendapatan stabil) dan jumlah dipohon jauh di bawah had skim serta keperluan perniagaan nyata → "recommend_higher" (tidak melebihi had skim).
- Jika jumlah dipohon sepadan dengan kapasiti → "accept".
- factors mesti ada 4-6 faktor dengan weight_pct berjumlah 100.
PROMPT;

        $result = $this->callGeminiVision($prompt);

        if (isset($result['error'])) {
            // Deterministic fallback using policy checks only
            $violations = $policyChecks['violations'] ?? [];
            return [
                'decision'            => count($violations) > 0 ? 'auto_reject' : 'accept',
                'recommended_amount'  => $applicationData['amount_requested'] ?? 0,
                'confidence'          => 40,
                'risk_grade'          => 'C',
                'mandatory_violations'=> $violations,
                'factors'             => [
                    ['factor' => 'Analisis AI tidak tersedia', 'impact' => 'neutral', 'detail' => 'Keputusan berdasarkan semakan polisi sahaja.', 'weight_pct' => 100],
                ],
                'narrative_bm'        => 'Enjin AI tidak dapat dihubungi. Keputusan awal dibuat berdasarkan semakan polisi mandatori sahaja. Sila jana semula untuk analisis penuh.',
                'next_steps_bm'       => ['Jana semula keputusan AI', 'Semakan manual oleh Pegawai Kredit'],
                'engine'              => 'fallback',
            ];
        }

        $result['engine'] = $this->model;
        return $result;
    }
}
