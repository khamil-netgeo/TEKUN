<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

/**
 * TEKUN SPPT - AppServiceProvider
 * Implements DYNAMIC MODULE ROUTE LOADING per project instructions Section 3.1.
 * Each module defines its own Routes/api.php under app/Modules/<ModuleName>/Routes/.
 * This auto-discovers and loads ALL module routes without modifying routes/api.php.
 */
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(\App\Modules\AuditKawalan\Services\AnomalyDetectionService::class, \App\Modules\AuditKawalan\Services\AnomalyDetectionService::class);
        $this->app->bind(\App\Modules\AuditKawalan\Services\ComplianceReportService::class, \App\Modules\AuditKawalan\Services\ComplianceReportService::class);
        $this->app->bind(\App\Modules\CRMUsahawan\Services\EntrepreneurService::class, \App\Modules\CRMUsahawan\Services\EntrepreneurService::class);
        $this->app->bind(\App\Modules\IntegrasiAPI\Services\IntegrationHealthService::class, \App\Modules\IntegrasiAPI\Services\IntegrationHealthService::class);
        $this->app->bind(\App\Modules\LaporanAnalitik\Services\AnalyticsService::class, \App\Modules\LaporanAnalitik\Services\AnalyticsService::class);
        $this->app->bind(\App\Modules\LaporanAnalitik\Services\ReportExportService::class, \App\Modules\LaporanAnalitik\Services\ReportExportService::class);
        $this->app->bind(\App\Modules\PengeluaranDana\Services\DisbursementService::class, \App\Modules\PengeluaranDana\Services\DisbursementService::class);
        $this->app->bind(\App\Modules\PengurusanAkaun\Services\AiDefaultPredictionService::class, \App\Modules\PengurusanAkaun\Services\AiDefaultPredictionService::class);
        $this->app->bind(\App\Modules\PengurusanAkaun\Services\TawidhService::class, \App\Modules\PengurusanAkaun\Services\TawidhService::class);
        $this->app->bind(\App\Modules\PengurusanCawangan\Services\BranchService::class, \App\Modules\PengurusanCawangan\Services\BranchService::class);
        $this->app->bind(\App\Modules\PengurusanNPL\Services\NplService::class, \App\Modules\PengurusanNPL\Services\NplService::class);
        $this->app->bind(\App\Modules\PenilaianKredit\Services\AmortizationService::class, \App\Modules\PenilaianKredit\Services\AmortizationService::class);
        $this->app->bind(\App\Modules\PenilaianKredit\Services\CreditScoringService::class, \App\Modules\PenilaianKredit\Services\CreditScoringService::class);
        $this->app->bind(\App\Modules\PenilaianKredit\Services\OfferLetterService::class, \App\Modules\PenilaianKredit\Services\OfferLetterService::class);
        $this->app->bind(\App\Modules\PentadbiranSistem\Services\AdminService::class, \App\Modules\PentadbiranSistem\Services\AdminService::class);
        $this->app->bind(\App\Modules\ProdukPembiayaan\Services\EligibilityCheckerService::class, \App\Modules\ProdukPembiayaan\Services\EligibilityCheckerService::class);
        $this->app->bind(\App\Modules\ProdukPembiayaan\Services\ProductService::class, \App\Modules\ProdukPembiayaan\Services\ProductService::class);
    }

    public function boot(): void
    {
        $this->loadModuleRoutes();
    }

    protected function loadModuleRoutes(): void
    {
        $modulesPath = app_path('Modules');

        if (!File::isDirectory($modulesPath)) {
            return;
        }

        $moduleDirs = File::directories($modulesPath);

        foreach ($moduleDirs as $moduleDir) {
            $routeFile = $moduleDir . '/Routes/api.php';

            if (File::exists($routeFile)) {
                Route::middleware('api')
                    ->prefix('api')
                    ->group($routeFile);
            }
        }
    }
}