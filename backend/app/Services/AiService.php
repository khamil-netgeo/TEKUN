<?php

namespace App\Services;

use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;

/**
 * SPPT Central AI Service
 *
 * All AI features in the SPPT system route through this service.
 * Uses Google Gemini API (gemini-2.0-flash for text, gemini-2.0-flash for vision).
 *
 * Features:
 *  - Credit scoring narrative
 *  - Document OCR extraction (MyKad, bank statements, SSM)
 *  - Chatbot (Pembantu TEKUN) with RAG
 *  - Fraud detection analysis
 *  - Ta'widh calculation explanation
 *  - NPL prediction
 *  - Dunning letter generation
 *  - Executive report narrative
 *  - Embedding generation for RAG (pgvector)
 */
class AiService
{
    protected string $defaultModel;
    protected string $visionModel;

    public function __construct()
    {
        $this->defaultModel = config('gemini.default_model', 'gemini-3.5-flash');
        $this->visionModel  = config('gemini.vision_model', 'gemini-3.5-flash');
    }

    // =========================================================================
    // MODULE 1 — eKYC & Document Extraction
    // =========================================================================

    /**
     * Extract MyKad data from image using Gemini Vision
     */
    public function extractMyKad(string $base64Image): array
    {
        try {
            $prompt = "You are an OCR system for Malaysian MyKad (identity card). Extract the following fields from this image and return ONLY valid JSON with no markdown:
{
  \"ic_number\": \"string (format: XXXXXX-XX-XXXX)\",
  \"full_name\": \"string\",
  \"address\": \"string\",
  \"date_of_birth\": \"string (YYYY-MM-DD)\",
  \"gender\": \"Lelaki|Perempuan\",
  \"religion\": \"string\",
  \"race\": \"string\",
  \"nationality\": \"Warganegara|Bukan Warganegara\",
  \"confidence_score\": number (0.0-1.0)
}
If a field cannot be read, use null. Return ONLY the JSON object.";

            $response = Gemini::generativeModel("gemini-3.5-flash")->generateContent([
                ['text' => $prompt],
                ['inline_data' => ['mime_type' => 'image/jpeg', 'data' => $base64Image]],
            ]);

            $text = $response->text();
            $text = preg_replace('/```json\s*|\s*```/', '', $text);
            return json_decode(trim($text), true) ?? ['error' => 'Parse failed', 'raw' => $text];
        } catch (\Exception $e) {
            Log::error('AiService::extractMyKad error: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Extract bank statement data from image/PDF using Gemini Vision
     */
    public function extractBankStatement(string $base64Image): array
    {
        try {
            $prompt = "You are a financial document OCR system. Extract bank statement data from this image and return ONLY valid JSON:
{
  \"bank_name\": \"string\",
  \"account_holder\": \"string\",
  \"account_number\": \"string\",
  \"period_from\": \"YYYY-MM-DD\",
  \"period_to\": \"YYYY-MM-DD\",
  \"average_monthly_balance\": number,
  \"average_monthly_credit\": number,
  \"average_monthly_debit\": number,
  \"total_credits_3m\": number,
  \"total_debits_3m\": number,
  \"transactions\": [{\"date\": \"YYYY-MM-DD\", \"description\": \"string\", \"credit\": number, \"debit\": number, \"balance\": number}],
  \"confidence_score\": number
}
Return ONLY the JSON object.";

            $response = Gemini::generativeModel("gemini-3.5-flash")->generateContent([
                ['text' => $prompt],
                ['inline_data' => ['mime_type' => 'image/jpeg', 'data' => $base64Image]],
            ]);

            $text = preg_replace('/```json\s*|\s*```/', '', $response->text());
            return json_decode(trim($text), true) ?? ['error' => 'Parse failed'];
        } catch (\Exception $e) {
            Log::error('AiService::extractBankStatement error: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    // =========================================================================
    // MODULE 2 — Credit Scoring & Assessment
    // =========================================================================

    /**
     * Generate AI credit scoring for a loan application
     */
    public function generateCreditScore(array $applicationData): array
    {
        try {
            $prompt = "You are an expert Islamic microfinance credit analyst for TEKUN Nasional Malaysia. Analyse this loan application and return ONLY valid JSON:

Application Data:
" . json_encode($applicationData, JSON_PRETTY_PRINT) . "

Return this exact JSON structure:
{
  \"score\": number (300-850),
  \"grade\": \"A|B|C|D|E\",
  \"grade_label\": \"Sangat Baik|Baik|Sederhana|Lemah|Berisiko Tinggi\",
  \"recommendation\": \"LULUS|TOLAK|KUARI\",
  \"confidence\": number (0.0-1.0),
  \"risk_factors\": [\"string\"],
  \"positive_factors\": [\"string\"],
  \"narrative_bm\": \"string (full analyst narrative in Bahasa Malaysia, 3-4 sentences)\",
  \"narrative_en\": \"string (full analyst narrative in English, 3-4 sentences)\",
  \"suggested_amount\": number,
  \"suggested_tenure_months\": number,
  \"conditions\": [\"string\"]
}";

            $response = Gemini::generativeModel("gemini-3.5-flash")->generateContent($prompt);
            $text = preg_replace('/```json\s*|\s*```/', '', $response->text());
            return json_decode(trim($text), true) ?? ['error' => 'Parse failed'];
        } catch (\Exception $e) {
            Log::error('AiService::generateCreditScore error: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Generate AI fraud detection analysis
     */
    public function detectFraud(array $applicationData): array
    {
        try {
            $prompt = "You are a fraud detection AI for TEKUN Nasional. Analyse this application for fraud indicators and return ONLY valid JSON:

Data: " . json_encode($applicationData) . "

{
  \"fraud_score\": number (0-100, higher = more suspicious),
  \"risk_level\": \"RENDAH|SEDERHANA|TINGGI|KRITIKAL\",
  \"flags\": [{\"type\": \"string\", \"description\": \"string\", \"severity\": \"LOW|MEDIUM|HIGH\"}],
  \"duplicate_detected\": boolean,
  \"duplicate_ic\": \"string|null\",
  \"recommendation\": \"PROCEED|MANUAL_REVIEW|REJECT\",
  \"explanation_bm\": \"string\",
  \"explanation_en\": \"string\"
}";

            $response = Gemini::generativeModel("gemini-3.5-flash")->generateContent($prompt);
            $text = preg_replace('/```json\s*|\s*```/', '', $response->text());
            return json_decode(trim($text), true) ?? ['error' => 'Parse failed'];
        } catch (\Exception $e) {
            Log::error('AiService::detectFraud error: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    // =========================================================================
    // MODULE 4 — Ta'widh & Payments
    // =========================================================================

    /**
     * Calculate and explain Ta'widh (late payment penalty) per BNM Shariah guidelines
     */
    public function calculateTawidh(array $paymentData): array
    {
        try {
            $prompt = "You are a Shariah-compliant finance calculator for TEKUN Nasional. Calculate Ta'widh (late payment compensation) based on BNM guidelines and return ONLY valid JSON:

Payment Data: " . json_encode($paymentData) . "

Ta'widh Rules:
- Rate: 1% per annum on outstanding amount (BNM standard)
- Formula: Outstanding Amount × Rate × (Days Overdue / 365)
- Maximum: Actual loss suffered by TEKUN (whichever is lower)
- Shariah basis: Permitted as compensation, not penalty (ta'zir)

{
  \"outstanding_amount\": number,
  \"days_overdue\": number,
  \"annual_rate\": 0.01,
  \"tawidh_amount\": number,
  \"formula_display\": \"string (human readable formula)\",
  \"shariah_basis\": \"string\",
  \"bnm_reference\": \"string\",
  \"is_shariah_compliant\": true,
  \"explanation_bm\": \"string\",
  \"explanation_en\": \"string\",
  \"waiver_eligible\": boolean,
  \"waiver_reason\": \"string|null\"
}";

            $response = Gemini::generativeModel("gemini-3.5-flash")->generateContent($prompt);
            $text = preg_replace('/```json\s*|\s*```/', '', $response->text());
            return json_decode(trim($text), true) ?? ['error' => 'Parse failed'];
        } catch (\Exception $e) {
            Log::error('AiService::calculateTawidh error: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    // =========================================================================
    // MODULE 5 — NPL & Dunning
    // =========================================================================

    /**
     * Generate automated dunning letter content
     */
    public function generateDunningLetter(array $accountData, int $noticeNumber): array
    {
        try {
            $noticeTypes = [
                1 => 'Notis Pertama — peringatan mesra, minta hubungi TEKUN',
                2 => 'Notis Kedua — amaran serius, ancaman tindakan undang-undang',
                3 => 'Notis Ketiga — notis muktamad, rujuk kepada peguam/mahkamah',
            ];

            $prompt = "You are a collections officer at TEKUN Nasional. Generate a {$noticeTypes[$noticeNumber]} dunning letter in both Bahasa Malaysia and English. Return ONLY valid JSON:

Account Data: " . json_encode($accountData) . "

{
  \"notice_number\": {$noticeNumber},
  \"subject_bm\": \"string\",
  \"subject_en\": \"string\",
  \"body_bm\": \"string (full formal letter body in BM)\",
  \"body_en\": \"string (full formal letter body in EN)\",
  \"action_required_bm\": \"string\",
  \"action_required_en\": \"string\",
  \"deadline_days\": number,
  \"escalation_if_ignored\": \"string\"
}";

            $response = Gemini::generativeModel("gemini-3.5-flash")->generateContent($prompt);
            $text = preg_replace('/```json\s*|\s*```/', '', $response->text());
            return json_decode(trim($text), true) ?? ['error' => 'Parse failed'];
        } catch (\Exception $e) {
            Log::error('AiService::generateDunningLetter error: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Predict NPL risk for an account
     */
    public function predictNplRisk(array $accountData): array
    {
        try {
            $prompt = "You are an NPL risk prediction AI for TEKUN Nasional. Analyse this account and predict NPL risk. Return ONLY valid JSON:

Account: " . json_encode($accountData) . "

{
  \"npl_probability\": number (0.0-1.0),
  \"classification\": \"Lancar|Perhatian Khusus|Tidak Lancar\",
  \"days_past_due\": number,
  \"risk_score\": number (1-10),
  \"key_risk_factors\": [\"string\"],
  \"recommended_action\": \"string\",
  \"collection_priority\": \"RENDAH|SEDERHANA|TINGGI|KRITIKAL\",
  \"predicted_recovery_rate\": number (0.0-1.0),
  \"explanation_bm\": \"string\",
  \"explanation_en\": \"string\"
}";

            $response = Gemini::generativeModel("gemini-3.5-flash")->generateContent($prompt);
            $text = preg_replace('/```json\s*|\s*```/', '', $response->text());
            return json_decode(trim($text), true) ?? ['error' => 'Parse failed'];
        } catch (\Exception $e) {
            Log::error('AiService::predictNplRisk error: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    // =========================================================================
    // MODULE 6 — Executive Analytics
    // =========================================================================

    /**
     * Generate executive narrative for dashboard KPIs
     */
    public function generateExecutiveNarrative(array $kpiData): array
    {
        try {
            $prompt = "You are an executive business analyst for TEKUN Nasional. Write a concise executive summary of these KPIs in both Bahasa Malaysia and English. Return ONLY valid JSON:

KPI Data: " . json_encode($kpiData) . "

{
  \"summary_bm\": \"string (2-3 sentence executive summary in BM)\",
  \"summary_en\": \"string (2-3 sentence executive summary in EN)\",
  \"key_highlights\": [\"string\"],
  \"areas_of_concern\": [\"string\"],
  \"recommendations\": [\"string\"],
  \"trend\": \"POSITIF|NEUTRAL|NEGATIF\",
  \"confidence\": number (0.0-1.0)
}";

            $response = Gemini::generativeModel("gemini-3.5-flash")->generateContent($prompt);
            $text = preg_replace('/```json\s*|\s*```/', '', $response->text());
            return json_decode(trim($text), true) ?? ['error' => 'Parse failed'];
        } catch (\Exception $e) {
            Log::error('AiService::generateExecutiveNarrative error: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    // =========================================================================
    // CHATBOT — Pembantu TEKUN (RAG-powered)
    // =========================================================================

    /**
     * Answer a user question using RAG context from pgvector knowledge base
     */
    public function chat(string $userMessage, array $ragContext = [], string $language = 'ms'): array
    {
        try {
            $contextText = '';
            if (!empty($ragContext)) {
                $contextText = "\n\nKonteks daripada pangkalan pengetahuan TEKUN:\n";
                foreach ($ragContext as $chunk) {
                    $contextText .= "---\n" . (is_array($chunk) ? ($chunk['content'] ?? $chunk[0] ?? '') : $chunk) . "\n";
                }
            }

            $systemPrompt = $language === 'ms'
                ? "Anda adalah Pembantu TEKUN, pembantu AI rasmi TEKUN Nasional Malaysia. Jawab dalam Bahasa Malaysia yang mesra dan profesional. Bantu pemohon dengan soalan berkaitan pembiayaan TEKUN, syarat kelayakan, proses permohonan, dan status pinjaman. Jika tidak pasti, minta pemohon hubungi cawangan TEKUN terdekat."
                : "You are Pembantu TEKUN, the official AI assistant of TEKUN Nasional Malaysia. Answer in friendly and professional English. Help applicants with questions about TEKUN financing, eligibility criteria, application process, and loan status. If unsure, ask the applicant to contact the nearest TEKUN branch.";

            $fullPrompt = $systemPrompt . $contextText . "\n\nSoalan pengguna: " . $userMessage;

            $response = Gemini::generativeModel("gemini-3.5-flash")->generateContent($fullPrompt);

            return [
                'reply' => $response->text(),
                'language' => $language,
                'rag_used' => !empty($ragContext),
                'context_chunks' => count($ragContext),
            ];
        } catch (\Exception $e) {
            Log::error('AiService::chat error: ' . $e->getMessage());
            return ['error' => $e->getMessage(), 'reply' => 'Maaf, sistem AI sedang tidak tersedia. Sila cuba sebentar lagi.'];
        }
    }

    /**
     * Generate text embedding for RAG (pgvector storage)
     */
    public function generateEmbedding(string $text): array
    {
        try {
            $apiKey = config('gemini.api_key');
            $model  = config('gemini.embedding_model', 'models/gemini-embedding-001');
            $modelId = str_replace('models/', '', $model);

            $response = \Illuminate\Support\Facades\Http::timeout(30)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$modelId}:embedContent?key={$apiKey}",
                [
                    'model'              => $model,
                    'content'            => ['parts' => [['text' => $text]]],
                    'outputDimensionality' => 768, // pgvector HNSW max 2000 dims; 768 is optimal
                ]
            );

            if ($response->successful()) {
                return $response->json('embedding.values', []);
            }

            \Illuminate\Support\Facades\Log::error('Gemini embedding failed', ['status' => $response->status(), 'body' => $response->body()]);
            return [];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Gemini embedding exception', ['error' => $e->getMessage()]);
            return [];
        }
    }

    // =========================================================================
    // RAG — Vector Search
    // =========================================================================

    /**
     * Search knowledge base using pgvector cosine similarity
     */
    public function ragSearch(string $query, int $limit = 5): array
    {
        try {
            $embedding = $this->generateEmbedding($query);
            if (empty($embedding)) {
                return [];
            }
            $vectorStr = '[' . implode(',', array_map(fn($v) => sprintf('%.10f', $v), $embedding)) . ']';
            $results = \Illuminate\Support\Facades\DB::select(
                "SELECT content, metadata, 1 - (embedding <=> ?::vector) AS similarity
                 FROM knowledge_base
                 ORDER BY embedding <=> ?::vector
                 LIMIT ?",
                [$vectorStr, $vectorStr, $limit]
            );
            return array_map(function ($row) {
                return [
                    'content'    => $row->content,
                    'metadata'   => json_decode($row->metadata ?? '{}', true),
                    'similarity' => round((float)$row->similarity, 4),
                ];
            }, $results);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('AiService::ragSearch error: ' . $e->getMessage());
            return [];
        }
    }

    // =========================================================================
    // UTILITY
    // =========================================================================

    /**
     * Test Gemini API connectivity
     */
    public function testConnection(): array
    {
        try {
            $apiKey = config('gemini.api_key');
            $model  = $this->defaultModel; // gemini-3.5-flash
            $response = \Illuminate\Support\Facades\Http::timeout(15)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
                ['contents' => [['parts' => [['text' => 'Reply with only this exact JSON, no markdown: {"status":"ok","model":"gemini-3.5-flash","system":"SPPT"}']]]]]
            );
            if ($response->successful()) {
                $text = $response->json('candidates.0.content.parts.0.text', '');
                $text = preg_replace('/```json\s*|\s*```/', '', trim($text));
                $data = json_decode($text, true);
                return $data ?? ['status' => 'ok', 'model' => 'gemini-3.5-flash', 'system' => 'SPPT'];
            }
            return ['status' => 'error', 'message' => $response->body()];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
}
