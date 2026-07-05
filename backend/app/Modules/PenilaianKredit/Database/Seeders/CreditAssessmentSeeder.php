<?php

namespace App\Modules\PenilaianKredit\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CreditAssessmentSeeder extends Seeder
{
    public function run(): void
    {
        // Get branch ID
        $branchId = DB::table('branches')->first()->id ?? 1;
        
        // Ensure applications exist first
        $appIds = [];
        for ($i = 1; $i <= 10; $i++) {
            $appId = DB::table('applications')->insertGetId([
                'ref_no' => 'APP-2026-M2-' . rand(1000, 9999) . '-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'applicant_name' => 'Pemohon Ujian ' . $i,
                'ic_no' => '80' . rand(10, 12) . rand(10, 28) . str_pad($i, 6, '0', STR_PAD_LEFT),
                'scheme' => 'TEKUN Niaga',
                'amount_requested' => rand(10000, 50000),
                'status' => 'pending_assessment',
                'branch_id' => $branchId,
                'officer_id' => 1,
                'phone' => '0123456789',
                'tenure_months' => 60,
                'created_at' => Carbon::now()->subDays(rand(1, 10)),
                'updated_at' => Carbon::now()->subDays(rand(1, 10)),
            ]);
            $appIds[] = $appId;
        }

        // Create credit assessments
        foreach ($appIds as $index => $appId) {
            $score = rand(55, 95);
            $grade = $score >= 80 ? 'A' : ($score >= 65 ? 'B' : ($score >= 50 ? 'C' : 'D'));
            
            DB::table('credit_assessments')->insert([
                'application_id' => $appId,
                'total_score' => $score,
                'risk_grade' => $grade,
                'ccris_score' => rand(60, 100),
                'ctos_score' => rand(60, 100),
                'dsr' => rand(20, 60),
                'ai_narrative' => 'Pemohon menunjukkan rekod pembayaran yang ' . ($score >= 70 ? 'baik' : 'memuaskan') . '. Kapasiti pembayaran balik adalah ' . ($score >= 70 ? 'kukuh' : 'sederhana') . ' berdasarkan DSR semasa.',
                'recommendation' => $score >= 65 ? 'LULUS' : 'SEMAK SEMULA',
                'assessed_by' => 3, // Assuming credit officer ID
                                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }
}
