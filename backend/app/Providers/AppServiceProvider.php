<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->bindModuleServices();
    }

    public function boot(): void
    {
        $this->loadModuleRoutes();
    }

    private function loadModuleRoutes(): void
    {
        $modulesPath = app_path('Modules');
        if (!is_dir($modulesPath)) {
            return;
        }
        foreach (glob($modulesPath . '/*/Routes/api.php') as $routeFile) {
            Route::middleware(['api'])
                ->prefix('api')
                ->group($routeFile);
        }
    }

    private function bindModuleServices(): void
    {
        $services = [
            \App\Modules\AuditKawalan\Services\AnomalyDetectionService::class,
            \App\Modules\AuditKawalan\Services\ComplianceReportService::class,
            \App\Modules\CRMUsahawan\Services\EntrepreneurService::class,
            \App\Modules\IntegrasiAPI\Services\IntegrationHealthService::class,
            \App\Modules\LaporanAnalitik\Services\AnalyticsService::class,
            \App\Modules\LaporanAnalitik\Services\ReportExportService::class,
            \App\Modules\PengeluaranDana\Services\DisbursementService::class,
            \App\Modules\PengurusanAkaun\Services\AiDefaultPredictionService::class,
            \App\Modules\PengurusanAkaun\Services\TawidhService::class,
            \App\Modules\PengurusanCawangan\Services\BranchService::class,
            \App\Modules\PengurusanNPL\Services\NplService::class,
            \App\Modules\PenilaianKredit\Services\AmortizationService::class,
            \App\Modules\PenilaianKredit\Services\CreditScoringService::class,
            \App\Modules\PenilaianKredit\Services\OfferLetterService::class,
            \App\Modules\PentadbiranSistem\Services\AdminService::class,
            \App\Modules\ProdukPembiayaan\Services\EligibilityCheckerService::class,
            \App\Modules\ProdukPembiayaan\Services\ProductService::class,
        ];
        foreach ($services as $service) {
            if (class_exists($service)) {
                $this->app->singleton($service, $service);
            }
        }
    }
}
