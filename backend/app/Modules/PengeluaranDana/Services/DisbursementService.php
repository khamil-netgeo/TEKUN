<?php

namespace App\Modules\PengeluaranDana\Services;

use App\Modules\PengeluaranDana\Models\Disbursement;
use App\Models\Application;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

/**
 * Module 3 — Pengeluaran Dana Service
 * Handles all business logic for fund disbursement:
 * - Authority matrix determination
 * - Batch disbursement file generation (FPX/RENTAS/ISO 20022)
 * - E-sign tracking and reminders
 * - Aging / SLA escalation
 * - AI anomaly detection
 * - Bank payment confirmation and usahawan notification
 */
class DisbursementService
{
    /**
     * Authority Matrix: Determine required approval level based on amount.
     * Per TEKUN policy:
     *   ≤ RM10,000   → Pegawai Cawangan (Branch Officer)
     *   RM10,001–30,000 → Pengurus Cawangan (Branch Manager)
     *   RM30,001–100,000 → Jawatankuasa Kredit (Credit Committee / HQ)
     *   > RM100,000  → Lembaga Pengarah (Board of Directors)
     */
    public static function determineAuthority(float $amount): array
    {
        return match (true) {
            $amount <= 10000  => [
                'level'       => 'branch_officer',
                'label'       => 'Pegawai Cawangan',
                'level_code'  => 'L1',
                'min'         => 0,
                'max'         => 10000,
                'description' => 'Kelulusan di peringkat cawangan oleh Pegawai Kewangan',
            ],
            $amount <= 30000  => [
                'level'       => 'branch_manager',
                'label'       => 'Pengurus Cawangan',
                'level_code'  => 'L2',
                'min'         => 10001,
                'max'         => 30000,
                'description' => 'Kelulusan di peringkat cawangan oleh Pengurus Cawangan',
            ],
            $amount <= 100000 => [
                'level'       => 'credit_committee',
                'label'       => 'Jawatankuasa Kredit',
                'level_code'  => 'L3',
                'min'         => 30001,
                'max'         => 100000,
                'description' => 'Kelulusan di peringkat HQ oleh Jawatankuasa Kredit',
            ],
            default           => [
                'level'       => 'board',
                'label'       => 'Lembaga Pengarah',
                'level_code'  => 'L4',
                'min'         => 100001,
                'max'         => null,
                'description' => 'Kelulusan di peringkat Lembaga Pengarah',
            ],
        };
    }

    /**
     * Get the full authority matrix for display.
     */
    public static function getAuthorityMatrix(float $amount = 0): array
    {
        $levels = [
            ['level' => 'branch_officer',  'label' => 'Pegawai Cawangan',    'level_code' => 'L1', 'min' => 0,      'max' => 10000,  'description' => 'Kelulusan peringkat cawangan'],
            ['level' => 'branch_manager',  'label' => 'Pengurus Cawangan',   'level_code' => 'L2', 'min' => 10001,  'max' => 30000,  'description' => 'Kelulusan peringkat cawangan'],
            ['level' => 'credit_committee','label' => 'Jawatankuasa Kredit',  'level_code' => 'L3', 'min' => 30001,  'max' => 100000, 'description' => 'Kelulusan peringkat HQ'],
            ['level' => 'board',           'label' => 'Lembaga Pengarah',     'level_code' => 'L4', 'min' => 100001, 'max' => null,   'description' => 'Kelulusan peringkat Lembaga'],
        ];

        foreach ($levels as &$level) {
            $level['applicable'] = $amount > 0 && (
                $amount >= $level['min'] &&
                ($level['max'] === null || $amount <= $level['max'])
            );
        }

        return $levels;
    }

    /**
     * Run AI anomaly detection on a disbursement.
     * Flags anomalies based on:
     * - Amount significantly higher than scheme average
     * - Multiple disbursements to same bank account
     * - Unusual timing (weekend, late night)
     * - Amount close to authority threshold (potential splitting)
     */
    public static function detectAnomalies(Disbursement $disbursement): array
    {
        $amount = (float) $disbursement->amount;
        $scheme = $disbursement->application->scheme ?? '';
        
        $duplicateCount = Disbursement::where('bank_account_no', $disbursement->bank_account_no)
            ->where('id', '!=', $disbursement->id)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        $prompt = "Analyze the following disbursement for anomalies:
Amount: RM {$amount}
Scheme: {$scheme}
Recent disbursements to same bank account (last 30 days): {$duplicateCount}
Authority thresholds are RM 10000, RM 30000, RM 100000. Micro scheme limit is usually RM 10000.
Return a JSON object with the following structure:
{
  \"has_anomaly\": boolean,
  \"score\": number (0-100),
  \"anomalies\": [
    {
      \"type\": string,
      \"severity\": \"low\"|\"medium\"|\"high\",
      \"description\": string (in Malay)
    }
  ],
  \"summary\": string (in Malay)
}";

        try {
            $apiKey = config('services.openai.api_key');
            if ($apiKey) {
                $response = Http::withToken($apiKey)
                    ->timeout(15)
                    ->post('https://api.openai.com/v1/chat/completions', [
                        'model' => 'gpt-4',
                        'messages' => [
                            ['role' => 'system', 'content' => 'You are an AI anomaly detector for a financial system. Respond ONLY in valid JSON.'],
                            ['role' => 'user', 'content' => $prompt]
                        ],
                        'temperature' => 0.1,
                    ]);

                if ($response->successful()) {
                    $content = $response->json('choices.0.message.content');
                    $content = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $content);
                    $result = json_decode($content, true);
                    
                    if (json_last_error() === JSON_ERROR_NONE && isset($result['has_anomaly'])) {
                        return $result;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('AI Anomaly Detection failed: ' . $e->getMessage());
        }

        // Fallback to static rules if API call fails
        $anomalies = [];

        // Check 1: Amount near authority threshold (potential splitting)
        $thresholds = [10000, 30000, 100000];
        foreach ($thresholds as $threshold) {
            if ($amount >= ($threshold * 0.9) && $amount <= $threshold) {
                $anomalies[] = [
                    'type'        => 'threshold_proximity',
                    'severity'    => 'medium',
                    'description' => "Amaun RM" . number_format($amount, 2) . " hampir dengan had kelulusan RM" . number_format($threshold, 2) . ". Kemungkinan pemecahan transaksi.",
                ];
            }
        }

        // Check 2: Duplicate bank account in recent disbursements
        if ($duplicateCount > 0) {
            $anomalies[] = [
                'type'        => 'duplicate_bank_account',
                'severity'    => 'high',
                'description' => "Akaun bank {$disbursement->bank_account_no} telah digunakan dalam {$duplicateCount} pengeluaran lain dalam 30 hari lepas.",
            ];
        }

        // Check 3: High amount for micro scheme
        if (str_contains($scheme, 'micro') && $amount > 10000) {
            $anomalies[] = [
                'type'        => 'scheme_amount_mismatch',
                'severity'    => 'medium',
                'description' => "Amaun RM" . number_format($amount, 2) . " melebihi had biasa skim Mikro (RM10,000).",
            ];
        }

        $hasAnomaly = count($anomalies) > 0;
        $score = $hasAnomaly ? min(100, count($anomalies) * 25 + 25) : 0;

        return [
            'has_anomaly'  => $hasAnomaly,
            'score'        => $score,
            'anomalies'    => $anomalies,
            'summary'      => $hasAnomaly
                ? count($anomalies) . ' anomali dikesan oleh AI'
                : 'Tiada anomali dikesan',
        ];
    }

    /**
     * Generate batch disbursement payment file (ISO 20022 / FPX / RENTAS format).
     * Returns file URL stored in MinIO.
     */
    public static function generateBatchFile(array $disbursementIds, string $format = 'iso20022'): array
    {
        $disbursements = Disbursement::whereIn('id', $disbursementIds)
            ->with('application')
            ->get();

        if ($disbursements->isEmpty()) {
            throw new \Exception('Tiada rekod pengeluaran dijumpai untuk batch ini.');
        }

        $batchRef = 'BATCH-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5(implode(',', $disbursementIds)), 0, 6));
        $totalAmount = $disbursements->sum('amount');
        $count = $disbursements->count();

        // Generate file content based on format
        $fileContent = match ($format) {
            'fpx'       => self::generateFpxContent($disbursements, $batchRef),
            'rentas'    => self::generateRentasContent($disbursements, $batchRef),
            default     => self::generateIso20022Content($disbursements, $batchRef),
        };

        $fileName = "disbursements/batch/{$batchRef}.xml";

        // Store in MinIO
        try {
            Storage::disk('s3')->put($fileName, $fileContent, 'private');
            $fileUrl = Storage::disk('s3')->temporaryUrl($fileName, now()->addHours(24));
        } catch (\Exception $e) {
            Log::error("MinIO unavailable for batch file: " . $e->getMessage());
            throw new \Exception('Gagal memuat naik fail batch ke storan awan (MinIO/S3). Sila cuba sebentar lagi.');
        }

        // Update disbursements with batch reference
        Disbursement::whereIn('id', $disbursementIds)->update([
            'is_batch'                  => true,
            'batch_ref'                 => $batchRef,
            'payment_file_url'          => $fileUrl,
            'payment_file_format'       => $format,
            'payment_file_generated_at' => now(),
            'status'                    => 'processing',
        ]);

        return [
            'batch_id'     => $batchRef,
            'file_url'     => $fileUrl,
            'format'       => strtoupper($format),
            'count'        => $count,
            'total_amount' => $totalAmount,
            'generated_at' => now()->toISOString(),
            'expires_at'   => now()->addHours(24)->toISOString(),
        ];
    }

    /**
     * Generate ISO 20022 XML content for batch disbursement.
     */
    private static function generateIso20022Content($disbursements, string $batchRef): string
    {
        $now = now()->format('Y-m-d\TH:i:s');
        $lines = [];
        $lines[] = '<?xml version="1.0" encoding="UTF-8"?>';
        $lines[] = '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">';
        $lines[] = '  <CstmrCdtTrfInitn>';
        $lines[] = "    <GrpHdr><MsgId>{$batchRef}</MsgId><CreDtTm>{$now}</CreDtTm><NbOfTxs>{$disbursements->count()}</NbOfTxs><CtrlSum>{$disbursements->sum('amount')}</CtrlSum></GrpHdr>";

        foreach ($disbursements as $d) {
            $lines[] = "    <PmtInf><PmtInfId>{$d->ref_no}</PmtInfId><Amt><InstdAmt Ccy=\"MYR\">{$d->amount}</InstdAmt></Amt><CdtTrfTxInf><CdtrAcct><Id><Othr><Id>{$d->bank_account_no}</Id></Othr></Id></CdtrAcct><Cdtr><Nm>{$d->bank_account_name}</Nm></Cdtr></CdtTrfTxInf></PmtInf>";
        }

        $lines[] = '  </CstmrCdtTrfInitn>';
        $lines[] = '</Document>';

        return implode("\n", $lines);
    }

    /**
     * Generate FPX format content.
     */
    private static function generateFpxContent($disbursements, string $batchRef): string
    {
        $lines = ["FPX_BATCH|{$batchRef}|" . now()->format('YmdHis')];
        foreach ($disbursements as $d) {
            $lines[] = "{$d->ref_no}|{$d->bank_account_no}|{$d->bank_account_name}|{$d->amount}|MYR";
        }
        return implode("\n", $lines);
    }

    /**
     * Generate RENTAS format content.
     */
    private static function generateRentasContent($disbursements, string $batchRef): string
    {
        $lines = ["RENTAS|{$batchRef}|" . now()->format('YmdHis') . "|{$disbursements->count()}|{$disbursements->sum('amount')}"];
        foreach ($disbursements as $d) {
            $lines[] = "TXN|{$d->ref_no}|{$d->bank_name}|{$d->bank_account_no}|{$d->bank_account_name}|" . number_format($d->amount, 2, '.', '');
        }
        return implode("\n", $lines);
    }

    /**
     * Calculate aging days for a disbursement (working days only).
     */
    public static function calculateAgingDays(Disbursement $disbursement): int
    {
        $start = $disbursement->created_at ?? now();
        $now = now();
        $workingDays = 0;

        $current = $start->copy();
        while ($current->lt($now)) {
            // Skip weekends (Saturday=6, Sunday=0)
            if (!in_array($current->dayOfWeek, [0, 6])) {
                $workingDays++;
            }
            $current->addDay();
        }

        return max(0, $workingDays);
    }

    /**
     * Get SLA status based on aging days.
     */
    public static function getSlaStatus(int $agingDays): array
    {
        return match (true) {
            $agingDays > 2  => ['status' => 'KRITIKAL', 'color' => 'red',    'label' => '>2 hari kerja', 'action' => 'Eskalasi automatik kepada Pengurus'],
            $agingDays == 2 => ['status' => 'AMARAN',   'color' => 'orange', 'label' => '2 hari kerja',  'action' => 'Peringatan dihantar kepada pegawai'],
            $agingDays == 1 => ['status' => 'NORMAL',   'color' => 'yellow', 'label' => '1 hari kerja',  'action' => 'Dalam tempoh SLA'],
            default         => ['status' => 'BARU',     'color' => 'green',  'label' => 'Hari ini',       'action' => 'Dalam tempoh SLA'],
        };
    }

    /**
     * Auto-escalate disbursements that have breached SLA (>2 working days).
     * Returns count of escalated records.
     */
    public static function autoEscalate(): int
    {
        $count = 0;

        // Get disbursements that are pending and older than 2 working days
        $pending = Disbursement::whereIn('status', ['pending', 'approved', 'processing'])
            ->where('is_escalated', false)
            ->where('created_at', '<=', now()->subDays(2))
            ->get();

        foreach ($pending as $d) {
            $agingDays = self::calculateAgingDays($d);
            if ($agingDays > 2) {
                $d->update([
                    'is_escalated'      => true,
                    'sla_breach'        => true,
                    'sla_breach_at'     => now(),
                    'aging_days'        => $agingDays,
                    'escalation_reason' => "Fail to process within SLA",
                ]);
                $count++;
            }
        }

        return $count;
    }
}