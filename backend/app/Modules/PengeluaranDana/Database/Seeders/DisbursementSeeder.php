<?php

namespace App\Modules\PengeluaranDana\Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Disbursement;
use App\Models\Application;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DisbursementSeeder extends Seeder
{
    public function run(): void
    {
        // Get some users
        $admin = User::where('email', 'admin@tekun.gov.my')->first();
        $manager = User::where('email', 'pengurus@tekun.gov.my')->first();
        
        if (!$admin) {
            $admin = User::first();
        }

        // Get some applications to attach disbursements to
        $applications = Application::take(15)->get();
        
        if ($applications->isEmpty()) {
            // Create some dummy applications if none exist
            $this->command->info('No applications found. Please run the ApplicationSeeder first.');
            return;
        }

        DB::table('disbursements')->truncate();

        $scenarios = [
            // Pending, Critical SLA (>3 days old)
            ['amount' => 5000, 'status' => 'pending', 'esign' => 'pending', 'days_ago' => 5],
            ['amount' => 25000, 'status' => 'pending', 'esign' => 'pending', 'days_ago' => 4],
            
            // Pending, Warning SLA (2 days old)
            ['amount' => 75000, 'status' => 'pending', 'esign' => 'signed', 'days_ago' => 2],
            ['amount' => 10000, 'status' => 'pending', 'esign' => 'signed', 'days_ago' => 2],
            
            // Pending, Normal SLA (0-1 days old)
            ['amount' => 150000, 'status' => 'pending', 'esign' => 'pending', 'days_ago' => 0],
            ['amount' => 15000, 'status' => 'pending', 'esign' => 'pending', 'days_ago' => 1],
            
            // Approved
            ['amount' => 8000, 'status' => 'approved', 'esign' => 'signed', 'days_ago' => 10],
            ['amount' => 28000, 'status' => 'approved', 'esign' => 'signed', 'days_ago' => 15],
            
            // Processing
            ['amount' => 95000, 'status' => 'processing', 'esign' => 'signed', 'days_ago' => 8],
            
            // Esign Expired
            ['amount' => 12000, 'status' => 'pending', 'esign' => 'expired', 'days_ago' => 20],
            
            // Esign Rejected
            ['amount' => 50000, 'status' => 'pending', 'esign' => 'rejected', 'days_ago' => 3],
        ];

        foreach ($applications as $index => $app) {
            if (!isset($scenarios[$index])) break;
            
            $scenario = $scenarios[$index];
            $createdAt = Carbon::now()->subDays($scenario['days_ago']);
            
            Disbursement::create([
                'application_id' => $app->id,
                'ref_no' => 'DIS-' . date('Y-m') . '-' . str_pad($index + 1, 5, '0', STR_PAD_LEFT),
                'amount' => $scenario['amount'],
                'bank_name' => 'Maybank Islamic',
                'bank_account_no' => '164' . rand(1000000, 9999999),
                'bank_account_name' => $app->applicant_name,
                'bank_verified' => true,
                'status' => $scenario['status'],
                'esign_status' => $scenario['esign'],
                'approval_level' => Disbursement::determineAuthority($scenario['amount']),
                'approved_by_l1' => $scenario['status'] === 'approved' ? $manager->id : null,
                'approved_at' => $scenario['status'] === 'approved' ? $createdAt->copy()->addDays(1) : null,
                'is_escalated' => $scenario['days_ago'] > 3,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }
        
        $this->command->info('Disbursements seeded successfully.');
    }
}
