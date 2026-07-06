<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     * Dynamically binds all module services to the container.
     */
    public function register(): void
    {
        // ── Module Service Bindings ──────────────────────────────────────────
        // Auto-registered by Gemini Audit Fix — ensures all module services
        // are resolvable via dependency injection in controllers and tests.
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

    /**
     * Bootstrap any application services.
     * Dynamically loads all module routes from app/Modules/*/Routes/api.php
     */
    public function boot(): void
    {
        $this->loadModuleRoutes();
    }

    /**
     * Dynamically load routes from all module Route files.
     * This means no module needs to touch routes/api.php directly.
     */
    protected function loadModuleRoutes(): void
    {
        $modulesPath = app_path('Modules');

        if (!is_dir($modulesPath)) {
            return;
        }

        foreach (glob($modulesPath . '/*/Routes/api.php') as $routeFile) {
            Route::middleware('api')
                ->prefix('api')
                ->group($routeFile);
        }
    }
}
