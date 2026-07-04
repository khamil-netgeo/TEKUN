<?php

namespace App\Modules\IntegrasiAPI\Database\Seeders;

use App\Modules\IntegrasiAPI\Models\ApiAlertConfig;
use App\Modules\IntegrasiAPI\Models\ApiIntegration;
use Illuminate\Database\Seeder;

class ApiIntegrationSeeder extends Seeder
{
    public function run(): void
    {
        $integrations = [
            [
                'service_key'               => 'esyariah',
                'service_name'              => 'e-Syariah',
                'base_url'                  => 'https://esyariah.gov.my/api',
                'description'               => 'Sistem Maklumat e-Syariah — Jabatan Kehakiman Syariah Malaysia',
                'status'                    => 'OK',
                'latency_ms'                => 245,
                'uptime_30d'                => 99.80,
                'circuit_breaker_state'     => 'CLOSED',
                'circuit_breaker_failures'  => 0,
                'circuit_breaker_threshold' => 5,
                'is_active'                 => true,
                'sort_order'                => 1,
            ],
            [
                'service_key'               => 'muflis',
                'service_name'              => 'Muflis (Insolvency)',
                'base_url'                  => 'https://muflis.insolvency.gov.my/api',
                'description'               => 'Jabatan Insolvensi Malaysia — Semakan status muflis pemohon',
                'status'                    => 'OK',
                'latency_ms'                => 312,
                'uptime_30d'                => 99.50,
                'circuit_breaker_state'     => 'CLOSED',
                'circuit_breaker_failures'  => 0,
                'circuit_breaker_threshold' => 5,
                'is_active'                 => true,
                'sort_order'                => 2,
            ],
            [
                'service_key'               => 'ssm',
                'service_name'              => 'SSM (Suruhanjaya Syarikat)',
                'base_url'                  => 'https://api.ssm.com.my/v1',
                'description'               => 'Suruhanjaya Syarikat Malaysia — Pengesahan perniagaan dan syarikat',
                'status'                    => 'OK',
                'latency_ms'                => 189,
                'uptime_30d'                => 99.90,
                'circuit_breaker_state'     => 'CLOSED',
                'circuit_breaker_failures'  => 0,
                'circuit_breaker_threshold' => 5,
                'is_active'                 => true,
                'sort_order'                => 3,
            ],
            [
                'service_key'               => 'ccris',
                'service_name'              => 'CCRIS (Bank Negara)',
                'base_url'                  => 'https://ccris.bnm.gov.my/api',
                'description'               => 'Central Credit Reference Information System — Bank Negara Malaysia',
                'status'                    => 'DEGRADED',
                'latency_ms'                => 1850,
                'uptime_30d'                => 97.20,
                'circuit_breaker_state'     => 'CLOSED',
                'circuit_breaker_failures'  => 2,
                'circuit_breaker_threshold' => 5,
                'is_active'                 => true,
                'sort_order'                => 4,
            ],
            [
                'service_key'               => 'ctos',
                'service_name'              => 'CTOS (Credit Bureau)',
                'base_url'                  => 'https://api.ctos.com.my/v2',
                'description'               => 'CTOS Data Systems — Laporan kredit dan skor kredit individu',
                'status'                    => 'OK',
                'latency_ms'                => 423,
                'uptime_30d'                => 99.10,
                'circuit_breaker_state'     => 'CLOSED',
                'circuit_breaker_failures'  => 0,
                'circuit_breaker_threshold' => 5,
                'is_active'                 => true,
                'sort_order'                => 5,
            ],
            [
                'service_key'               => 'mykad',
                'service_name'              => 'MyKad / eKYC (JPN)',
                'base_url'                  => 'https://ekyc.jpn.gov.my/api',
                'description'               => 'Jabatan Pendaftaran Negara — Pengesahan identiti MyKad dan eKYC',
                'status'                    => 'OK',
                'latency_ms'                => 567,
                'uptime_30d'                => 98.90,
                'circuit_breaker_state'     => 'CLOSED',
                'circuit_breaker_failures'  => 0,
                'circuit_breaker_threshold' => 5,
                'is_active'                 => true,
                'sort_order'                => 6,
            ],
        ];

        foreach ($integrations as $data) {
            ApiIntegration::updateOrCreate(
                ['service_key' => $data['service_key']],
                array_merge($data, [
                    'last_checked_at' => now()->subMinutes(rand(1, 15)),
                    'last_success_at' => now()->subMinutes(rand(1, 30)),
                ])
            );
        }

        // Seed default global alert configs
        $globalAlerts = [
            [
                'api_integration_id'         => null,
                'alert_type'                 => 'latency',
                'latency_threshold_ms'       => 1000,
                'downtime_threshold_minutes' => 5,
                'error_rate_threshold'       => 10.00,
                'notify_email'               => true,
                'notify_sms'                 => false,
                'notify_email_addresses'     => 'admin@tekun.gov.my,it@tekun.gov.my',
                'is_active'                  => true,
            ],
            [
                'api_integration_id'         => null,
                'alert_type'                 => 'downtime',
                'latency_threshold_ms'       => 2000,
                'downtime_threshold_minutes' => 10,
                'error_rate_threshold'       => 20.00,
                'notify_email'               => true,
                'notify_sms'                 => true,
                'notify_email_addresses'     => 'admin@tekun.gov.my,it@tekun.gov.my,cto@tekun.gov.my',
                'is_active'                  => true,
            ],
        ];

        foreach ($globalAlerts as $alert) {
            ApiAlertConfig::firstOrCreate(
                ['api_integration_id' => null, 'alert_type' => $alert['alert_type']],
                $alert
            );
        }

        $this->command->info('ApiIntegration seeder: 6 integrations + 2 global alert configs seeded.');
    }
}
